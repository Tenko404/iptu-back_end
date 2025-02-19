import * as PropertyModel from "../models/property.js";
import * as PersonModel from "../models/person.js";
import { getAddressFromCEP } from "./utils.js"; // Import getAddressFromCEP

async function createProperty(propertyData) {
  const { zip_code, owner_ids, possessor, executor, front_photo, above_photo } =
    propertyData;

  // --- 1. CEP Auto-fill (using utils.js) ---
  const addressFromCep = await getAddressFromCEP(zip_code);

  if (!addressFromCep) {
    throw new Error("Invalid CEP"); // Or handle the error as appropriate for your UI
  }
  // Check if owners exist, before creating the property
  for (const ownerId of owner_ids) {
    const ownerExists = await PersonModel.getPersonById(ownerId);
    if (!ownerExists) {
      throw new Error("One or more owners not found");
    }
  }
  //if possessor exists, checks it
  if (possessor) {
    const possessorExists = await PersonModel.getPersonById(
      possessor.person_id
    );
    if (!possessorExists) {
      throw new Error("Possessor not found");
    }
  }
  //if executor exists, checks it
  if (executor) {
    const executorExists = await PersonModel.getPersonById(executor.person_id);
    if (!executorExists) {
      throw new Error("Executor not found");
    }
  }

  // --- 2. Create the Property ---
  const newProperty = await PropertyModel.createProperty({
    ...propertyData,
    street: addressFromCep.logradouro,
    neighborhood: addressFromCep.bairro,
    city: addressFromCep.localidade,
    state: addressFromCep.uf,
    front_photo: front_photo, // ADDED THIS
    above_photo: above_photo, // ADDED THIS
  });

  // --- 3. Link Owners to Property ---
  for (const ownerId of owner_ids) {
    await PropertyModel.linkPropertyToPerson(
      newProperty.id,
      ownerId,
      "owner",
      null
    ); //no description for owners
  }

  // --- 4. Link Possessor (if provided) ---

  if (possessor) {
    await PropertyModel.linkPropertyToPerson(
      newProperty.id,
      possessor.person_id,
      "possessor",
      possessor.description
    );
  }

  // --- 5. Link Executor (if provided) ---
  if (executor) {
    await PropertyModel.linkPropertyToPerson(
      newProperty.id,
      executor.person_id,
      "executor",
      executor.description
    );
  }

  return newProperty;
}

async function getPropertyById(propertyId) {
  const property = await PropertyModel.getPropertyById(propertyId);
  if (!property) {
    return null; // Or throw an error, depending on your needs
  }

  // Fetch related data (owners, possessor, executor)
  const owners = await PropertyModel.getOwnersByPropertyId(propertyId);
  const possessor = await PropertyModel.getPossessorByPropertyId(propertyId);
  const executor = await PropertyModel.getExecutorByPropertyId(propertyId);

  // Combine all data into a single object
  return {
    ...property,
    owners,
    possessor,
    executor,
  };
}
async function getAllProperties() {
  const properties = await PropertyModel.getAllProperties();

  //get all properties with their owners
  const propertiesWithOwner = [];
  for (let property of properties) {
    const owners = await PropertyModel.getOwnersByPropertyId(property.id);
    propertiesWithOwner.push({ ...property, owners });
  }
  return propertiesWithOwner;
}

async function updateProperty(propertyId, propertyData) {
  const { zip_code, owner_ids, possessor, executor, front_photo, above_photo } =
    propertyData;

  // Check if the property exists
  const propertyExists = await PropertyModel.getPropertyById(propertyId);
  if (!propertyExists) {
    throw new Error("Property not found");
  }

  // --- 1. CEP Auto-fill (using utils.js) ---
  let addressFromCep = null;
  //if the zip code is sent, gets the information
  if (zip_code) {
    addressFromCep = await getAddressFromCEP(zip_code);

    if (!addressFromCep) {
      throw new Error("Invalid CEP"); // Or handle the error as appropriate for your UI
    }
  }
  // Check if owners exist, before updating the property
  if (owner_ids) {
    for (const ownerId of owner_ids) {
      const ownerExists = await PersonModel.getPersonById(ownerId);
      if (!ownerExists) {
        throw new Error("One or more owners not found");
      }
    }
  }

  //if possessor exists, checks it
  if (possessor) {
    const possessorExists = await PersonModel.getPersonById(
      possessor.person_id
    );
    if (!possessorExists) {
      throw new Error("Possessor not found");
    }
  }
  //if executor exists, checks it
  if (executor) {
    const executorExists = await PersonModel.getPersonById(executor.person_id);
    if (!executorExists) {
      throw new Error("Executor not found");
    }
  }
  // --- 2. Update Property ---
  //If there is data from cep, uses it
  const updateData = addressFromCep
    ? {
        ...propertyData,
        street: addressFromCep.logradouro,
        neighborhood: addressFromCep.bairro,
        city: addressFromCep.localidade,
        state: addressFromCep.uf,
        front_photo: front_photo, // ADDED THIS
        above_photo: above_photo, // ADDED THIS
      }
    : {
        ...propertyData,
        front_photo: front_photo, // ADDED THIS
        above_photo: above_photo, // ADDED THIS
      };
  //removes undefined values
  const filteredUpdateData = Object.fromEntries(
    Object.entries(updateData).filter(([key, value]) => value !== undefined)
  );

  await PropertyModel.updateProperty(propertyId, filteredUpdateData);

  // --- 3. Update relationships ---
  //first, remove all people linked with this property
  await PropertyModel.removePropertyPeople(propertyId);

  //after, re-add with the updated data
  if (owner_ids) {
    for (const ownerId of owner_ids) {
      await PropertyModel.linkPropertyToPerson(
        propertyId,
        ownerId,
        "owner",
        null
      ); //no description for owners
    }
  }

  if (possessor) {
    await PropertyModel.linkPropertyToPerson(
      propertyId,
      possessor.person_id,
      "possessor",
      possessor.description
    );
  }

  if (executor) {
    await PropertyModel.linkPropertyToPerson(
      propertyId,
      executor.person_id,
      "executor",
      executor.description
    );
  }
  return;
}

async function deleteProperty(propertyId) {
  const propertyExists = await PropertyModel.getPropertyById(propertyId);
  if (!propertyExists) {
    throw new Error("Property not found");
  }
  //first, remove all relationships
  await PropertyModel.removePropertyPeople(propertyId);

  //deletes the property
  await PropertyModel.deleteProperty(propertyId);
  return;
}
export {
  createProperty,
  getPropertyById,
  getAllProperties,
  updateProperty,
  deleteProperty,
};
