import pool from "../config/db.js";
import * as PropertyModel from "../models/property.js";
import * as PersonModel from "../models/person.js";

async function findOrCreatePerson(personData, personRole, connection) {
  if (!personData) {
    return null;
  }

  const {
    name,
    email,
    phone_number,
    document_type,
    document,
    residential_street,
    residential_house_number,
    residential_neighborhood,
    residential_complement,
    residential_city,
    residential_state,
    residential_zip_code,
    // ...otherData
  } = personData;

  if (!document_type || !document) {
    if (name || email || phone_number) {
      console.warn(
        "findOrCreatePerson called with person details but no document/type."
      );
      throw new Error(
        "Document type and document are required to find or create a person by document."
      );
    } else {
      return null;
    }
  }

  try {
    let existingPerson = await PersonModel.getPersonByDocument(
      document_type,
      document,
      connection
    );

    if (existingPerson) {
      const updateData = {};
      if (personData.hasOwnProperty("name") && name !== undefined)
        updateData.name = name;
      if (personData.hasOwnProperty("email") && email !== undefined)
        updateData.email = email;
      if (
        personData.hasOwnProperty("phone_number") &&
        phone_number !== undefined
      )
        updateData.phone_number = phone_number;

      if (personRole === "owner") {
        if (
          personData.hasOwnProperty("residential_street") &&
          residential_street !== undefined
        )
          updateData.residential_street = residential_street;
        if (
          personData.hasOwnProperty("residential_house_number") &&
          residential_house_number !== undefined
        )
          updateData.residential_house_number = residential_house_number;
        if (
          personData.hasOwnProperty("residential_neighborhood") &&
          residential_neighborhood !== undefined
        )
          updateData.residential_neighborhood = residential_neighborhood;
        if (
          personData.hasOwnProperty("residential_complement") &&
          residential_complement !== undefined
        ) {
          updateData.residential_complement = residential_complement;
        } else if (
          personData.hasOwnProperty("residential_complement") &&
          personData.residential_complement === null
        ) {
          updateData.residential_complement = null;
        }
        if (
          personData.hasOwnProperty("residential_city") &&
          residential_city !== undefined
        )
          updateData.residential_city = residential_city;
        if (
          personData.hasOwnProperty("residential_state") &&
          residential_state !== undefined
        )
          updateData.residential_state = residential_state;
        if (
          personData.hasOwnProperty("residential_zip_code") &&
          residential_zip_code !== undefined
        )
          updateData.residential_zip_code = residential_zip_code;
      }

      if (Object.keys(updateData).length > 0) {
        await PersonModel.updatePerson(
          existingPerson.id,
          updateData,
          connection
        );
      }
      return existingPerson.id;
    } else {
      if (
        name === undefined ||
        email === undefined ||
        phone_number === undefined
      ) {
        console.error(
          "Missing required fields (name, email, phone) for creating new person:",
          { name, email, phone_number, document_type, document }
        );
        throw new Error(
          "Name, email, and phone number are required to create a new person when document is not found."
        );
      }

      const newPerson = await PersonModel.createPerson(
        name,
        document_type,
        document,
        email,
        phone_number,
        personRole === "owner" ? residential_street : null,
        personRole === "owner" ? residential_house_number : null,
        personRole === "owner" ? residential_neighborhood : null,
        personRole === "owner" ? residential_complement : null,
        personRole === "owner" ? residential_city : null,
        personRole === "owner" ? residential_state : null,
        personRole === "owner" ? residential_zip_code : null,
        connection
      );

      if (!newPerson || newPerson.id === undefined) {
        console.error(
          "PersonModel.createPerson did not return a valid person object with an ID."
        );
        throw new Error(
          "Failed to create person record due to internal model error."
        );
      }
      return newPerson.id;
    }
  } catch (error) {
    console.error(
      `Error during findOrCreatePerson for document ${document_type} / ${document} (Role: ${personRole}):`,
      error
    );
    throw error;
  }
}

// --- createProperty ---
async function createProperty(propertyData) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      owner,
      possessor,
      executor,
      logradouro_code,
      secao_code,
      ...otherPropertyData
    } = propertyData;

    // --- Basic service-level validation for new NOT NULL fields ---
    if (!logradouro_code) {
      await connection.rollback();
      connection.release();
      throw new Error("Logradouro code is required for property creation.");
    }
    if (!secao_code) {
      await connection.rollback();
      connection.release();
      throw new Error("Seção code is required for property creation.");
    }

    // --- 1. Handle People ---
    const ownerId = await findOrCreatePerson(owner, "owner", connection);
    if (!ownerId) {
      await connection.rollback();
      connection.release();
      throw new Error("Failed to process owner for property creation.");
    }
    let possessorId = possessor
      ? await findOrCreatePerson(possessor, "possessor", connection)
      : null;
    let executorId = executor
      ? await findOrCreatePerson(executor, "executor", connection)
      : null;

    // --- 4. Create the Property ---
    const propertyModelData = {
      ...otherPropertyData,
      logradouro_code,
      secao_code,
    };
    const newPropertyResult = await PropertyModel.createProperty(
      propertyModelData,
      connection
    );
    const newPropertyId = newPropertyResult.id;

    // --- 5. Link relationships ---
    await PropertyModel.linkPropertyToPerson(
      newPropertyId,
      ownerId,
      "owner",
      owner?.description,
      connection
    );
    if (possessorId) {
      await PropertyModel.linkPropertyToPerson(
        newPropertyId,
        possessorId,
        "possessor",
        possessor?.description,
        connection
      );
    }
    if (executorId) {
      await PropertyModel.linkPropertyToPerson(
        newPropertyId,
        executorId,
        "executor",
        executor?.description,
        connection
      );
    }

    await connection.commit();

    const fullNewProperty = await getPropertyById(newPropertyId);
    return fullNewProperty;
  } catch (error) {
    if (
      connection &&
      connection.connection &&
      !connection.connection._fatalError &&
      !connection.connection._closing
    ) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }
    console.error("Error in service createProperty:", error);
    throw error;
  } finally {
    if (
      connection &&
      connection.connection &&
      !connection.connection._fatalError &&
      !connection.connection._closing
    ) {
      connection.release();
    }
  }
}

// --- getPropertyById ---
async function getPropertyById(propertyId) {
  try {
    const property = await PropertyModel.getPropertyById(propertyId);

    if (!property) {
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
    console.error("Error in getPropertyById service:", error);
    throw error;
  }
}

// --- getAllProperties ---
async function getAllProperties() {
  const properties = await PropertyModel.getAllProperties();

  if (!properties || properties.length === 0) {
    return [];
  }

  const propertyIds = properties.map((p) => p.id);

  const allRelatedPeople = await PropertyModel.getPeopleForPropertyIds(
    propertyIds
  );

  const peopleMap = new Map();
  allRelatedPeople.forEach((person) => {
    const propId = person.property_id;
    if (!peopleMap.has(propId)) {
      peopleMap.set(propId, { owners: [], possessor: null, executor: null });
    }

    const relatedPeople = peopleMap.get(propId);

    const personDetails = {
      id: person.id,
      name: person.name,
      document: person.document,
      document_type: person.document_type,
      // email: person.email,
      // phone_number: person.phone_number,
      relationship_type: person.relationship_type,
      description: person.description,
    };

    switch (person.relationship_type) {
      case "owner":
        relatedPeople.owners.push(personDetails);
        break;
      case "possessor":
        relatedPeople.possessor = personDetails;
        break;
      case "executor":
        relatedPeople.executor = personDetails;
        break;
    }
  });

  const propertiesWithPeople = properties.map((property) => {
    const related = peopleMap.get(property.id) || {
      owners: [],
      possessor: null,
      executor: null,
    };

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

  try {
    await connection.beginTransaction();

    const existingProperty = await PropertyModel.getPropertyById(propertyId);
    if (!existingProperty) {
      throw new Error("Propriedade não encontrada.");
    }

    const { owner, possessor, executor, ...otherPropertyData } = propertyData;

    let targetOwnerId = null;
    let targetPossessorId = null;
    let targetExecutorId = null;
    let ownerDescription = null;
    let possessorDescription = possessor?.description;
    let executorDescription = executor?.description;

    // --- Handle Owner ---
    if (propertyData.hasOwnProperty("owner")) {
      if (owner === null) {
        console.error("Attempt to remove owner during update is not allowed.");
        throw new Error("Property must have an owner.");
      } else {
        targetOwnerId = await findOrCreatePerson(owner, "owner", connection);
        ownerDescription = owner?.description;
        if (!targetOwnerId) {
          throw new Error("Failed to process owner information.");
        }
      }
    } else {
      const currentOwner = (
        await PropertyModel.getPeopleByPropertyId(propertyId)
      ).find((p) => p.relationship_type === "owner");
      targetOwnerId = currentOwner?.id;
      if (!targetOwnerId) {
        console.error(
          `Consistency Error: Property ${propertyId} has no current owner.`
        );
        throw new Error("Failed to find current owner for property.");
      }
    }

    // --- Handle Possessor ---
    if (propertyData.hasOwnProperty("possessor")) {
      if (possessor === null) {
        targetPossessorId = null;
      } else {
        targetPossessorId = await findOrCreatePerson(
          possessor,
          "possessor",
          connection
        );
        if (!targetPossessorId) {
          throw new Error("Failed to process possessor information.");
        }
      }
    } else {
      const currentPossessor = (
        await PropertyModel.getPeopleByPropertyId(propertyId)
      ).find((p) => p.relationship_type === "possessor");
      targetPossessorId = currentPossessor?.id;
      possessorDescription = currentPossessor?.description;
    }

    // --- Handle Executor ---
    if (propertyData.hasOwnProperty("executor")) {
      if (executor === null) {
        targetExecutorId = null;
      } else {
        targetExecutorId = await findOrCreatePerson(
          executor,
          "executor",
          connection
        );
        if (!targetExecutorId) {
          throw new Error("Failed to process executor information.");
        }
      }
    } else {
      const currentExecutor = (
        await PropertyModel.getPeopleByPropertyId(propertyId)
      ).find((p) => p.relationship_type === "executor");
      targetExecutorId = currentExecutor?.id;
      executorDescription = currentExecutor?.description;
    }

    // 3. Prepare Property Data for Update
    const dataToUpdateModel = { ...otherPropertyData };

    if (propertyData.hasOwnProperty("front_photo"))
      dataToUpdateModel.front_photo = propertyData.front_photo;
    if (propertyData.hasOwnProperty("above_photo"))
      dataToUpdateModel.above_photo = propertyData.above_photo;

    const finalPropertyUpdateData = Object.fromEntries(
      Object.entries(dataToUpdateModel).filter(
        ([_, value]) => value !== undefined
      )
    );

    // 4. Update Property Details (SINGLE CALL)
    if (Object.keys(finalPropertyUpdateData).length > 0) {
      await PropertyModel.updateProperty(
        propertyId,
        finalPropertyUpdateData,
        connection
      );
    }

    // 5. Update Relationships (Remove all and Re-add)
    await PropertyModel.removePropertyPeople(propertyId, connection);

    if (!targetOwnerId)
      throw new Error("Consistency Error: Owner ID is missing before linking.");
    await PropertyModel.linkPropertyToPerson(
      propertyId,
      targetOwnerId,
      "owner",
      ownerDescription,
      connection
    );

    if (targetPossessorId) {
      await PropertyModel.linkPropertyToPerson(
        propertyId,
        targetPossessorId,
        "possessor",
        possessorDescription,
        connection
      );
    }
    if (targetExecutorId) {
      await PropertyModel.linkPropertyToPerson(
        propertyId,
        targetExecutorId,
        "executor",
        executorDescription,
        connection
      );
    }

    await connection.commit();
    const fullUpdatedProperty = await getPropertyById(propertyId);
    return fullUpdatedProperty;
  } catch (error) {
    if (
      connection &&
      connection.connection &&
      !connection.connection._fatalError &&
      !connection.connection._closing
    ) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error during rollback (UPDATE):", rollbackError);
      }
    }
    console.error("Error in service updateProperty:", error);
    throw error;
  } finally {
    if (
      connection &&
      connection.connection &&
      !connection.connection._fatalError &&
      !connection.connection._closing
    ) {
      connection.release();
    }
  }
}

async function deleteProperty(propertyId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const people = await PropertyModel.getPeopleByPropertyId(propertyId);
    const owner = people.find((p) => p.relationship_type === "owner");
    const possessor = people.find((p) => p.relationship_type === "possessor");
    const executor = people.find((p) => p.relationship_type === "executor");

    const propertyExists = await PropertyModel.getPropertyById(propertyId);
    if (!propertyExists) {
      throw new Error("Property not found");
    }

    await PropertyModel.removePropertyPeople(propertyId, connection);
    await PropertyModel.deleteProperty(propertyId, connection);

    async function checkAndDeletePerson(person) {
      if (person) {
        const remainingAssociations =
          await PropertyModel.getPropertiesByPersonId(person.id, connection);
        if (remainingAssociations.length === 0) {
          await PersonModel.deletePerson(person.id, connection);
        } else {
        }
      }
    }

    await checkAndDeletePerson(owner);
    await checkAndDeletePerson(possessor);
    await checkAndDeletePerson(executor);

    await connection.commit();
  } catch (error) {
    if (!error.message.includes("Property not found")) {
      await connection.rollback();
      console.error("Transaction rolled back (DELETE):", error);
    } else {
      console.error("Error during delete (Property not found):", error.message);
    }
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
