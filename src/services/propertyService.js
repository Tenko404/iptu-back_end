import pool from "../config/db.js"; // Import the connection pool!
import * as PropertyModel from "../models/property.js";
import * as PersonModel from "../models/person.js";

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
    return null;
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

async function updateProperty(propertyId, propertyData) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { owner, possessor, executor, ...otherPropertyData } = propertyData;

    // --- Check if Property Exists ---
    const propertyExists = await PropertyModel.getPropertyById(propertyId);
    if (!propertyExists) {
      throw new Error("Propriedade não encontrada.");
    }

    // --- 1. Handle Owner ---
    //For simplicity, let's consider the owner is always sent on update
    const existingOwner = await PersonModel.getPersonByDocument(
      owner.document_type,
      owner.document
    );
    if (existingOwner) {
      throw new Error("Já existe uma pessoa cadastrada com este documento.");
    }
    const updatedOwner = await PersonModel.createPerson(
      //creates the new owner
      owner.name,
      owner.document_type,
      owner.document,
      owner.email,
      owner.phone_number
    );
    const ownerId = updatedOwner.id; //gets the id

    // --- 2. Handle Possessor (Optional) ---
    let possessorId = null;
    if (possessor) {
      try {
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
          throw new Error(
            "Já existe uma pessoa cadastrada com este documento."
          );
        }
        const newPossessor = await PersonModel.createPerson(
          possessor.name,
          possessor.document_type,
          possessor.document,
          possessor.email,
          possessor.phone_number
        );
        possessorId = newPossessor.id;
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    // --- 3. Handle Executor (Optional) ---
    let executorId = null;
    if (executor) {
      try {
        if (
          !executor.name ||
          !executor.email ||
          !executor.phone_number ||
          !executor.document_type ||
          !executor.document ||
          !executor.relationship_type
        ) {
          throw new Error("Executor data is incomplete.");
        }
        const existingExecutor = await PersonModel.getPersonByDocument(
          executor.document_type,
          executor.document
        );
        if (existingExecutor) {
          throw new Error(
            "Já existe uma pessoa cadastrada com este documento."
          );
        }
        const newExecutor = await PersonModel.createPerson(
          executor.name,
          executor.document_type,
          executor.document,
          executor.email,
          executor.phone_number
        );
        executorId = newExecutor.id;
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    // --- 4. Update Property Details ---
    const filteredUpdateData = Object.fromEntries(
      Object.entries(otherPropertyData).filter(
        ([key, value]) => value !== undefined
      )
    );
    await PropertyModel.updateProperty(
      propertyId,
      filteredUpdateData,
      connection
    ); // Pass connection

    // --- 5. Update relationships (Remove and Re-add) ---
    await PropertyModel.removePropertyPeople(propertyId, connection); // Correct

    await PropertyModel.linkPropertyToPerson(
      propertyId,
      ownerId,
      "owner",
      null,
      connection
    ); // Always link the owner

    if (possessorId) {
      await PropertyModel.linkPropertyToPerson(
        propertyId,
        possessorId,
        "possessor",
        possessor.description,
        connection
      ); // Pass connection
    }
    if (executorId) {
      await PropertyModel.linkPropertyToPerson(
        propertyId,
        executorId,
        "executor",
        executor.description,
        connection
      ); // Pass connection
    }

    await connection.commit(); // Commit
    return {
      id: propertyId,
      ...filteredUpdateData,
      owner: { id: ownerId, ...owner },
      possessor: possessorId ? { id: possessorId, ...possessor } : null,
      executor: executorId ? { id: executorId, ...executor } : null,
    };
  } catch (error) {
    await connection.rollback(); // Rollback
    console.error("Transaction rolled back (UPDATE):", error);
    throw error;
  } finally {
    connection.release(); // Release
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
