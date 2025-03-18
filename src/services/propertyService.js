import pool from "../config/db.js"; // Import the connection pool!
import * as PropertyModel from "../models/property.js";
import * as PersonModel from "../models/person.js";

// --- Helper Function: findOrCreatePerson (WITH proper error handling) ---
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
    const existingOwner = await PersonModel.getPersonByDocument(
      owner.document_type,
      owner.document
    );
    if (existingOwner) {
      throw new Error("Já existe uma pessoa cadastrada com este documento.");
    }
    const newOwner = await PersonModel.createPerson(
      owner.name,
      owner.document_type,
      owner.document,
      owner.email,
      owner.phone_number
    );
    const ownerId = newOwner.id;

    // --- 2. Create Possessor (Optional) ---
    let possessorId = null;
    if (possessor) {
      if (
        !possessor.name ||
        !possessor.email ||
        !possessor.phone_number ||
        !possessor.document_type ||
        !possessor.document ||
        !possessor.relationship_type
      ) {
        throw new Error("Possessor data is incomplete.");
      }
      const existingPossessor = await PersonModel.getPersonByDocument(
        possessor.document_type,
        possessor.document
      );
      if (existingPossessor) {
        throw new Error("Já existe uma pessoa cadastrada com este documento.");
      }

      const newPossessor = await PersonModel.createPerson(
        possessor.name,
        possessor.document_type,
        possessor.document,
        possessor.email,
        possessor.phone_number
      );
      possessorId = newPossessor.id;
    }

    // --- 3. Create Executor (Optional) ---
    let executorId = null;
    if (executor) {
      if (
        !executor.name ||
        !executor.email ||
        !executor.phone_number ||
        !executor.document_type ||
        !executor.document ||
        !executor.relationship_type
      ) {
        throw new Error("Executor data is incomplete");
      }
      const existingExecutor = await PersonModel.getPersonByDocument(
        executor.document_type,
        executor.document
      );
      if (existingExecutor) {
        throw new Error("Já existe uma pessoa cadastrada com este documento.");
      }
      const newExecutor = await PersonModel.createPerson(
        executor.name,
        executor.document_type,
        executor.document,
        executor.email,
        executor.phone_number
      );
      executorId = newExecutor.id;
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
  const property = await PropertyModel.getPropertyById(propertyId);
  if (!property) {
    console.log("Error message being thrown:", "Propriedade não encontrada."); // ADD THIS LINE
    throw new Error("Propriedade não encontrada.");
  }

  // Use the new getPeopleByPropertyId function
  const people = await PropertyModel.getPeopleByPropertyId(propertyId);

  // Separate owners, possessor, and executor
  const owners = people.filter((p) => p.relationship_type === "owner");
  const possessor = people.find((p) => p.relationship_type === "possessor"); // Use find, as there should only be one
  const executor = people.find((p) => p.relationship_type === "executor");

  return {
    ...property,
    owners,
    possessor,
    executor,
  };
}

async function getAllProperties() {
  const properties = await PropertyModel.getAllProperties();

  // Use getPeopleByPropertyId to efficiently fetch all related people for each property
  const propertiesWithPeople = [];
  for (let property of properties) {
    const people = await PropertyModel.getPeopleByPropertyId(property.id);
    const owners = people.filter((p) => p.relationship_type === "owner");
    //removed possessor and executor since it is pratically never used.
    propertiesWithPeople.push({ ...property, owners });
  }
  return propertiesWithPeople;
}

// --- updateProperty (Refactored - Uses findOrCreatePerson) ---
async function updateProperty(propertyId, propertyData) {
  const connection = await pool.getConnection();
  console.log("10. Inside updateProperty service, propertyId:", propertyId);
  console.log("11. Inside updateProperty service, propertyData:", propertyData);

  try {
    await connection.beginTransaction();

    const { owner, possessor, executor, ...otherPropertyData } = propertyData;

    console.log(
      "13. Proceeding with update (Controller already checked existence)."
    );

    // --- 1. Retrieve Existing Property Data ---
    const existingProperty = await PropertyModel.getPropertyById(propertyId);
    if (!existingProperty) {
      //This error should never happen, but...
      throw new Error("Propriedade não encontrada."); // This error should be handled by the caller
    }

    console.log("Existing Property:", existingProperty); // ADD THIS
    const mergedPropertyData = {
      ...existingProperty,
      ...otherPropertyData,
    };
    console.log("Merged Property Data:", mergedPropertyData); // ADD THIS

    // Use the helper function for owner, possessor, and executor
    const ownerId = await findOrCreatePerson(owner, connection);
    const possessorId = await findOrCreatePerson(possessor, connection);
    const executorId = await findOrCreatePerson(executor, connection);

    // --- 3. Update Property Details (using MERGED data) ---
    await PropertyModel.updateProperty(
      propertyId,
      mergedPropertyData, // Update with MERGED data
      connection
    );

    // Update Property Details
    const filteredUpdateData = Object.fromEntries(
      Object.entries(otherPropertyData).filter(
        ([key, value]) => value !== undefined
      )
    );

    if (Object.keys(filteredUpdateData).length > 0) {
      await PropertyModel.updateProperty(
        propertyId,
        filteredUpdateData,
        connection
      );
    }

    // Update relationships (Remove and Re-add)
    await PropertyModel.removePropertyPeople(propertyId, connection);

    // Always link the owner
    if (ownerId) {
      await PropertyModel.linkPropertyToPerson(
        propertyId,
        ownerId,
        "owner",
        null,
        connection
      );
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

    await connection.commit();
    console.log("14. Transaction committed.");
    return {
      id: propertyId,
      ...mergedPropertyData, // MODIFIED
      owner: ownerId ? { id: ownerId, ...owner } : null,
      possessor: possessorId ? { id: possessorId, ...possessor } : null,
      executor: executorId ? { id: executorId, ...executor } : null,
    };
  } catch (error) {
    await connection.rollback();
    console.error("Transaction rolled back (UPDATE):", error);
    throw error; // Re-throw to be handled by the controller
  } finally {
    connection.release();
    console.log("16. Connection released");
  }
}

async function deleteProperty(propertyId) {
  const connection = await pool.getConnection(); // Get connection
  try {
    await connection.beginTransaction();
    const propertyExists = await PropertyModel.getPropertyById(propertyId);
    if (!propertyExists) {
      throw new Error("Property not found");
    }
    await PropertyModel.removePropertyPeople(propertyId, connection);
    await PropertyModel.deleteProperty(propertyId, connection);
    await connection.commit();
    return;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export {
  createProperty,
  getPropertyById,
  getAllProperties,
  updateProperty,
  deleteProperty,
};
