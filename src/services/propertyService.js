import pool from "../config/db.js";
import * as PropertyModel from "../models/property.js";
import * as PersonModel from "../models/person.js";

async function findOrCreatePerson(personData, connection) {
  if (!personData) {
    return null;
  }

  const { name, email, phone_number, document_type, document } = personData;

  if (!document_type || !document) {
    throw new Error("Document type and document are required for person.");
  }

  try {
    // 1. Try to find existing person - USE THE CONNECTION
    let existingPerson = await PersonModel.getPersonByDocument(
      document_type,
      document,
      connection // Pass the connection
    );

    if (existingPerson) {
      // 2. Person exists: Update details (if provided) - USE THE CONNECTION
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phone_number) updateData.phone_number = phone_number;
      if (document_type) updateData.document_type = document_type;
      if (document) updateData.document = document;

      if (Object.keys(updateData).length > 0) {
        await PersonModel.updatePerson(
          existingPerson.id,
          updateData,
          connection // Pass the connection
        );
      }
      return existingPerson.id;
    } else {
      // 3. Person doesn't exist: Create new person - USE THE CONNECTION
      if (!name || !email || !phone_number) {
        throw new Error(
          "Name, email, and phone number are required to create a new person."
        );
      }
      const newPerson = await PersonModel.createPerson(
        name,
        document_type,
        document,
        email,
        phone_number,
        connection // Pass the connection
      );
      return newPerson.id;
    }
  } catch (error) {
    console.error("Error in findOrCreatePerson:", error);
    throw error;
  }
}

async function createProperty(propertyData) {
  const connection = await pool.getConnection(); // Get a connection
  try {
    await connection.beginTransaction(); // Start transaction

    const { owner, possessor, executor, ...otherPropertyData } = propertyData;

    // --- 1. Create Owner (Always Required) ---
    const ownerId = await findOrCreatePerson(owner, connection); // REFACTORED

    // --- 2. Create Possessor (Optional) ---
    let possessorId = null;
    if (possessor) {
      possessorId = await findOrCreatePerson(possessor, connection); // REFACTORED
    }

    // --- 3. Create Executor (Optional) ---
    let executorId = null;
    if (executor) {
      executorId = await findOrCreatePerson(executor, connection); // REFACTORED
    }

    // --- 4. Create the Property ---
    const newProperty = await PropertyModel.createProperty(
      otherPropertyData,
      connection
    ); // Pass connection

    // --- 5. Link relationships ---
    await PropertyModel.linkPropertyToPerson(
      newProperty.id,
      ownerId,
      "owner",
      null,
      connection
    ); // Pass connection
    if (possessorId) {
      await PropertyModel.linkPropertyToPerson(
        newProperty.id,
        possessorId,
        "possessor",
        possessor.description,
        connection
      ); // Pass connection
    }
    if (executorId) {
      await PropertyModel.linkPropertyToPerson(
        newProperty.id,
        executorId,
        "executor",
        executor.description,
        connection
      ); // Pass connection
    }

    await connection.commit(); // Commit transaction
    return {
      id: newProperty.id,
      ...otherPropertyData,
      owner: { id: ownerId, ...owner }, // Include owner details in response
      possessor: possessorId ? { id: possessorId, ...possessor } : null, // Include possessor details if present
      executor: executorId ? { id: executorId, ...executor } : null, // Include executor details if present
    };
  } catch (error) {
    await connection.rollback(); // Rollback on error
    console.error("Transaction rolled back:", error);
    throw error; // Re-throw to be handled by controller
  } finally {
    connection.release(); // Always release connection
  }
}

async function getPropertyById(propertyId) {
  try {
    const property = await PropertyModel.getPropertyById(propertyId);

    if (!property) {
      // Throw a consistent error if not found
      throw new Error("Propriedade não encontrada");
    }

    const people = await PropertyModel.getPeopleByPropertyId(propertyId);
    const owners = people.filter((p) => p.relationship_type === "owner");
    const possessor = people.find((p) => p.relationship_type === "possessor");
    const executor = people.find((p) => p.relationship_type === "executor");

    return {
      ...property,
      owners,
      possessor,
      executor,
    };
  } catch (error) {
    console.error("Error in getPropertyById service:", error); // Log the error
    throw error; // Re-throw the error
  }
}

async function getAllProperties() {
  // 1. Fetch all base properties (Query 1)
  const properties = await PropertyModel.getAllProperties();

  if (!properties || properties.length === 0) {
    return []; // Return early if no properties exist
  }

  // 2. Extract all property IDs
  const propertyIds = properties.map((p) => p.id);

  // 3. Fetch all related people for these properties in one go (Query 2)
  const allRelatedPeople = await PropertyModel.getPeopleForPropertyIds(
    propertyIds
  );

  // 4. Map people to their respective properties efficiently
  const peopleMap = new Map(); // Use a Map for quick lookups: propertyId -> { owners: [], possessor: null, executor: null }
  allRelatedPeople.forEach((person) => {
    const propId = person.property_id;
    // Ensure an entry exists for this property ID in the map
    if (!peopleMap.has(propId)) {
      peopleMap.set(propId, { owners: [], possessor: null, executor: null });
    }

    const relatedPeople = peopleMap.get(propId);

    // Structure the person object (select only needed fields if desired)
    const personDetails = {
      id: person.id,
      name: person.name,
      document: person.document,
      document_type: person.document_type,
      // Add email/phone if needed by the list view, otherwise omit for less data transfer
      // email: person.email,
      // phone_number: person.phone_number,
      relationship_type: person.relationship_type,
      description: person.description,
    };

    // Add the person to the correct category (owner, possessor, executor)
    switch (person.relationship_type) {
      case "owner":
        relatedPeople.owners.push(personDetails);
        break;
      case "possessor":
        relatedPeople.possessor = personDetails; // Assuming only one possessor
        break;
      case "executor":
        relatedPeople.executor = personDetails; // Assuming only one executor
        break;
    }
  });

  // 5. Combine property data with the mapped people data
  const propertiesWithPeople = properties.map((property) => {
    const related = peopleMap.get(property.id) || {
      owners: [],
      possessor: null,
      executor: null,
    }; // Default if somehow no people found

    return {
      ...property,
      owners: related.owners,
    };
  });

  return propertiesWithPeople;
}

// --- updateProperty ---
async function updateProperty(propertyId, propertyData) {
  const connection = await pool.getConnection();
  console.log("updateProperty service START, propertyId:", propertyId); // DEBUG

  try {
    await connection.beginTransaction();

    // 1. Check if Property Exists (Service layer responsibility)
    const existingProperty = await PropertyModel.getPropertyById(propertyId); // Use pool or connection? Pool is fine for read check before transaction logic.
    if (!existingProperty) {
      throw new Error("Propriedade não encontrada.");
    }
    console.log("Property exists:", existingProperty.id); // DEBUG

    const { owner, possessor, executor, ...otherPropertyData } = propertyData;

    // 2. Handle People (Find/Create/Update) using the helper
    // Ensure findOrCreatePerson internally uses the updated PersonModel.updatePerson
    const ownerId = await findOrCreatePerson(owner, connection);
    const possessorId = possessor
      ? await findOrCreatePerson(possessor, connection)
      : null; // Handle null/undefined possessor input
    const executorId = executor
      ? await findOrCreatePerson(executor, connection)
      : null; // Handle null/undefined executor input

    console.log("People IDs:", { ownerId, possessorId, executorId }); // DEBUG

    // 3. Prepare Property Data for Update
    const dataToUpdate = { ...otherPropertyData };

    // Handle file paths explicitly:
    // If a photo field is MISSING (undefined) in propertyData, it won't be in dataToUpdate, preserving DB value.
    // If a photo field is EXPLICITLY NULL in propertyData, set it to NULL in DB.
    if (propertyData.front_photo === null) {
      dataToUpdate.front_photo = null;
    }
    if (propertyData.above_photo === null) {
      dataToUpdate.above_photo = null;
    }
    // If photo fields are present with paths (from multer), they are already in dataToUpdate.

    // Filter out any remaining undefined values before sending to model
    const finalPropertyUpdateData = Object.fromEntries(
      Object.entries(dataToUpdate).filter(([_, value]) => value !== undefined)
    );

    console.log("Final property data for update:", finalPropertyUpdateData); // DEBUG

    // 4. Update Property Details (SINGLE CALL to the updated model)
    if (Object.keys(finalPropertyUpdateData).length > 0) {
      const result = await PropertyModel.updateProperty(
        propertyId,
        finalPropertyUpdateData,
        connection
      );
      if (result.affectedRows === 0) {
        console.warn(
          `Property update affected 0 rows for ID: ${propertyId}. Data might be identical.`
        );
        // No need to throw error, maybe data was the same
      }
      console.log("Property details updated."); // DEBUG
    } else {
      console.log("No property fields to update."); // DEBUG
    }

    // 5. Update Relationships (Remove all and Re-add)
    console.log("Updating relationships..."); // DEBUG
    await PropertyModel.removePropertyPeople(propertyId, connection);

    // Always link the owner (assuming owner is mandatory)
    if (ownerId) {
      // Should always have an ownerId from findOrCreatePerson
      await PropertyModel.linkPropertyToPerson(
        propertyId,
        ownerId,
        "owner",
        owner?.description, // Get description from original input if exists
        connection
      );
    } else {
      // This case should ideally not happen if owner is mandatory for a property
      console.error(
        "Owner ID was not determined during update for property:",
        propertyId
      );
      throw new Error("Falha ao determinar proprietário para atualização.");
    }

    if (possessorId) {
      await PropertyModel.linkPropertyToPerson(
        propertyId,
        possessorId,
        "possessor",
        possessor?.description,
        connection
      );
    }
    if (executorId) {
      await PropertyModel.linkPropertyToPerson(
        propertyId,
        executorId,
        "executor",
        executor?.description,
        connection
      );
    }
    console.log("Relationships updated."); // DEBUG

    await connection.commit();
    console.log("Transaction committed."); // DEBUG

    // 6. Fetch and return the fully updated property representation
    // Call the existing service function to get the structured response
    const updatedProperty = await getPropertyById(propertyId); // Use the service function to get nested data
    return updatedProperty;
  } catch (error) {
    await connection.rollback();
    console.error("Transaction rolled back (UPDATE):", error);
    // Add more specific logging if needed
    throw error; // Re-throw to be handled by the controller
  } finally {
    connection.release();
    console.log("Connection released."); // DEBUG
  }
}

async function deleteProperty(propertyId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Retrieve associated people BEFORE deleting the property
    const people = await PropertyModel.getPeopleByPropertyId(propertyId);
    const owner = people.find((p) => p.relationship_type === "owner");
    const possessor = people.find((p) => p.relationship_type === "possessor");
    const executor = people.find((p) => p.relationship_type === "executor");

    //Check property existence
    const propertyExists = await PropertyModel.getPropertyById(propertyId);
    if (!propertyExists) {
      throw new Error("Property not found");
    }

    // 2. Delete the property and its links (existing logic)
    await PropertyModel.removePropertyPeople(propertyId, connection);
    await PropertyModel.deleteProperty(propertyId, connection);

    // 3. & 4. Check for remaining associations and delete people if necessary
    async function checkAndDeletePerson(person) {
      if (person) {
        const remainingAssociations =
          await PropertyModel.getPropertiesByPersonId(person.id, connection);
        if (remainingAssociations.length === 0) {
          await PeopleModel.deletePerson(person.id, connection); // Delete the person
        }
      }
    }

    await checkAndDeletePerson(owner);
    await checkAndDeletePerson(possessor);
    await checkAndDeletePerson(executor);

    await connection.commit();
    return;
  } catch (error) {
    await connection.rollback();
    console.error("Transaction rolled back (DELETE):", error);
    throw error;
  } finally {
    connection.release();
  }
}

async function getPropertiesByPersonId(personId, connection) {
  const properties = await PropertyModel.getPropertiesByPersonId(
    personId,
    connection
  );
  return properties;
}
export {
  createProperty,
  getPropertyById,
  getAllProperties,
  updateProperty,
  deleteProperty,
  getPropertiesByPersonId,
};
