import pool from "../config/db.js";
import * as PropertyModel from "../models/property.js";
import * as PersonModel from "../models/person.js";

async function findOrCreatePerson(personData, connection) {
  if (!personData) {
    return null;
  }

  const { name, email, phone_number, document_type, document, ...otherData } =
    personData;

  if (!document_type || !document) {
    if (name || email || phone_number) {
      console.warn(
        "findOrCreatePerson called with person details but no document/type."
      );
      throw new Error(
        "Document type and document are required to find or create a person by document."
      );
    } else {
      console.log(
        "findOrCreatePerson called with insufficient data, returning null."
      );
      return null;
    }
  }

  try {
    // 1. Try to find existing person by document using the transaction connection
    console.log(
      `Searching for person with document: ${document_type} - ${document}`
    ); // DEBUG
    let existingPerson = await PersonModel.getPersonByDocument(
      document_type,
      document,
      connection // Pass the connection
    );

    if (existingPerson) {
      console.log(`Found existing person ID: ${existingPerson.id}`); // DEBUG
      // 2. Person exists: Update IF name, email, or phone_number are explicitly provided in the input `personData`
      const updateData = {};
      // Check if field exists and is not undefined in the input object
      if (personData.hasOwnProperty("name") && name !== undefined)
        updateData.name = name;
      if (personData.hasOwnProperty("email") && email !== undefined)
        updateData.email = email;
      if (
        personData.hasOwnProperty("phone_number") &&
        phone_number !== undefined
      )
        updateData.phone_number = phone_number;

      // Only run the update query if there are actual fields passed in the request to update
      if (Object.keys(updateData).length > 0) {
        console.log(
          `Updating existing person ${existingPerson.id} with data:`,
          updateData
        ); // DEBUG
        // Use the updated PersonModel.updatePerson which handles partial updates
        await PersonModel.updatePerson(
          existingPerson.id,
          updateData,
          connection // Pass the connection
        );
      } else {
        console.log(
          `Found existing person ${existingPerson.id}, no new details provided to update.`
        ); // DEBUG
      }
      // Return the ID of the existing (and potentially updated) person
      return existingPerson.id;
    } else {
      console.log(
        `Person with document ${document} not found. Attempting to create.`
      ); // DEBUG
      // 3. Person doesn't exist: Create a new person
      // Check if all required fields for CREATION are present (name, email, phone are mandatory based on DB/logic)
      if (
        name === undefined ||
        email === undefined ||
        phone_number === undefined
      ) {
        console.error("Missing required fields for creating new person:", {
          name,
          email,
          phone_number,
        }); // Log missing fields
        throw new Error(
          "Name, email, and phone number are required to create a new person when document is not found."
        );
      }

      console.log(`Creating new person with document ${document}`); // DEBUG
      const newPerson = await PersonModel.createPerson(
        name,
        document_type,
        document,
        email,
        phone_number,
        connection // Pass the connection
      );
      console.log(`Created new person with ID: ${newPerson.id}`); // DEBUG
      return newPerson.id;
    }
  } catch (error) {
    // Log the specific error origin for better debugging
    console.error(
      `Error during findOrCreatePerson for document ${document_type} / ${document}:`,
      error
    );
    // Avoid re-throwing generic error, let specific DB/validation errors propagate if possible
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
  console.log(
    "updateProperty service START (using findOrCreatePerson), propertyId:",
    propertyId
  );

  try {
    await connection.beginTransaction();

    // 1. Check if Property Exists (Service layer responsibility)
    const existingProperty = await PropertyModel.getPropertyById(propertyId); // Use pool or connection? Pool is fine for read check before transaction logic.
    if (!existingProperty) {
      throw new Error("Propriedade não encontrada.");
    }
    console.log("Property exists:", existingProperty.id); // DEBUG

    const { owner, possessor, executor, ...otherPropertyData } = propertyData;

    // 2. Determine Target Person IDs using findOrCreatePerson
    let targetOwnerId = null;
    let targetPossessorId = null;
    let targetExecutorId = null;
    let ownerDescription = null; // Store descriptions separately
    let possessorDescription = possessor?.description;
    let executorDescription = executor?.description;

    // --- Handle Owner ---
    if (propertyData.hasOwnProperty("owner")) {
      // Check if owner key was present in request
      if (owner === null) {
        // Attempting to remove owner - disallow?
        console.error("Attempt to remove owner during update is not allowed.");
        throw new Error("Property must have an owner.");
      } else {
        // Find or Create the owner provided in the request
        targetOwnerId = await findOrCreatePerson(owner, connection);
        ownerDescription = owner?.description; // Though owners usually don't have descriptions
        if (!targetOwnerId) {
          // findOrCreatePerson should throw if creation fails
          throw new Error("Failed to process owner information.");
        }
      }
    } else {
      // Owner key was NOT in request body - keep the existing owner
      const currentOwner = (
        await PropertyModel.getPeopleByPropertyId(propertyId)
      ).find((p) => p.relationship_type === "owner");
      targetOwnerId = currentOwner?.id; // Use existing ID
      if (!targetOwnerId) {
        console.error(
          `Consistency Error: Property ${propertyId} has no current owner.`
        );
        throw new Error("Failed to find current owner for property.");
      }
      console.log(`Keeping existing owner ID: ${targetOwnerId}`);
    }

    // --- Handle Possessor ---
    if (propertyData.hasOwnProperty("possessor")) {
      // Check if possessor key was present
      if (possessor === null) {
        targetPossessorId = null; // Request to remove
        console.log("Request to remove possessor.");
      } else {
        // Find or Create the possessor provided
        targetPossessorId = await findOrCreatePerson(possessor, connection);
        if (!targetPossessorId) {
          // Should not happen if possessor object is valid
          throw new Error("Failed to process possessor information.");
        }
      }
    } else {
      // Possessor key was NOT in request body - keep existing (if any)
      const currentPossessor = (
        await PropertyModel.getPeopleByPropertyId(propertyId)
      ).find((p) => p.relationship_type === "possessor");
      targetPossessorId = currentPossessor?.id; // Use existing ID or null
      possessorDescription = currentPossessor?.description; // Keep existing description
      console.log(`Keeping existing possessor ID: ${targetPossessorId}`);
    }

    // --- Handle Executor ---
    if (propertyData.hasOwnProperty("executor")) {
      // Check if executor key was present
      if (executor === null) {
        targetExecutorId = null; // Request to remove
        console.log("Request to remove executor.");
      } else {
        // Find or Create the executor provided
        targetExecutorId = await findOrCreatePerson(executor, connection);
        if (!targetExecutorId) {
          // Should not happen if executor object is valid
          throw new Error("Failed to process executor information.");
        }
      }
    } else {
      // Executor key was NOT in request body - keep existing (if any)
      const currentExecutor = (
        await PropertyModel.getPeopleByPropertyId(propertyId)
      ).find((p) => p.relationship_type === "executor");
      targetExecutorId = currentExecutor?.id; // Use existing ID or null
      executorDescription = currentExecutor?.description; // Keep existing description
      console.log(`Keeping existing executor ID: ${targetExecutorId}`);
    }

    console.log("Final Target People IDs:", {
      targetOwnerId,
      targetPossessorId,
      targetExecutorId,
    });

    // 3. Prepare Property Data for Update
    const dataToUpdate = { ...otherPropertyData };
    if (propertyData.hasOwnProperty("front_photo"))
      dataToUpdate.front_photo = propertyData.front_photo;
    if (propertyData.hasOwnProperty("above_photo"))
      dataToUpdate.above_photo = propertyData.above_photo;

    const finalPropertyUpdateData = Object.fromEntries(
      Object.entries(dataToUpdate).filter(([key, value]) => value !== undefined)
    );

    console.log("Final property data for update:", finalPropertyUpdateData); // DEBUG

    // 4. Update Property Details (SINGLE CALL to the updated model)
    if (Object.keys(finalPropertyUpdateData).length > 0) {
      console.log("Updating property fields:", finalPropertyUpdateData);
      await PropertyModel.updateProperty(
        propertyId,
        finalPropertyUpdateData,
        connection
      );
    } else {
      console.log("No property fields to update.");
    }

    // 5. Update Relationships (Remove all and Re-add)
    console.log("Updating relationships..."); // DEBUG
    await PropertyModel.removePropertyPeople(propertyId, connection);

    // Link Target Owner (Must have one)
    if (!targetOwnerId)
      throw new Error("Consistency Error: Owner ID is missing before linking."); // Should have been caught earlier
    await PropertyModel.linkPropertyToPerson(
      propertyId,
      targetOwnerId,
      "owner",
      ownerDescription,
      connection
    );

    // Link Target Possessor (if exists)
    if (targetPossessorId) {
      await PropertyModel.linkPropertyToPerson(
        propertyId,
        targetPossessorId,
        "possessor",
        possessorDescription,
        connection
      );
    }
    // Link Target Executor (if exists)
    if (targetExecutorId) {
      await PropertyModel.linkPropertyToPerson(
        propertyId,
        targetExecutorId,
        "executor",
        executorDescription,
        connection
      );
    }
    console.log("Relationships updated.");

    await connection.commit();
    console.log("Transaction committed.");

    // 6. Fetch and return the fully updated property representation
    const updatedProperty = await getPropertyById(propertyId);
    return updatedProperty;
  } catch (error) {
    await connection.rollback();
    console.error("Transaction rolled back (UPDATE):", error);
    throw error;
  } finally {
    connection.release();
    console.log("Connection released.");
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
