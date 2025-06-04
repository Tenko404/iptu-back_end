import * as PersonModel from "../models/person.js";

async function createPerson(personData) {
  const { name, email, phone_number, document_type, document } = personData;

  // Check if a person with the same document already exists
  const existingPerson = await PersonModel.getPersonByDocument(
    document_type,
    document
  );
  if (existingPerson) {
    throw new Error("Já existe uma pessoa cadastrada com este documento.");
  }

  // Create person
  const newPerson = await PersonModel.createPerson(
    name,
    document_type,
    document,
    email,
    phone_number
  );
  return newPerson;
}

// Check the person for request validation
async function checkPerson(id) {
  const person = await PersonModel.getPersonById(id);
  if (!person) {
    return false;
  }
  return person;
}

// Get person by ID
async function getPersonById(personId) {
  const person = await PersonModel.getPersonById(personId);
  return person;
}

async function getAllPeople() {
  const people = await PersonModel.getAllPeople();
  return people;
}

async function updatePerson(personId, personData) {
  // Check if the person exists
  const personExists = await PersonModel.getPersonById(personId);
  if (!personExists) {
    throw new Error("Person not found");
  }

  // Check for document conflicts IF document details are being updated
  const { document_type, document } = personData;
  if (document_type && document) {
    const existingPersonWithDoc = await PersonModel.getPersonByDocument(
      document_type,
      document
    );
    if (existingPersonWithDoc && existingPersonWithDoc.id != personId) {
      throw new Error("Já existe outra pessoa cadastrada com este documento.");
    }
  }

  // Prepare data for the model
  const dataToUpdate = Object.fromEntries(
    Object.entries(personData).filter(([_, value]) => value !== undefined)
  );

  /*
  if (Object.keys(dataToUpdate).length === 0) {
    console.log("No valid fields provided for person update.");
    return personExists;
  }
*/

  // Call the updated model function
  const result = await PersonModel.updatePerson(personId, dataToUpdate);

  // Check if update actually occurred
  /*
  if (result.affectedRows === 0) {
    console.warn(`Update operation affected 0 rows for person ID: ${personId}`);
  }
*/

  // Return updated person data
  const updatedPerson = await PersonModel.getPersonById(personId);
  return updatedPerson;
}
/*
async function deletePerson(personId) {
  const person = await PersonModel.getPersonById(personId);
  if (!person) {
    throw new Error("Person not found");
  }
  await PersonModel.deletePerson(personId);
  return;
}
*/
export {
  createPerson,
  getPersonById,
  updatePerson,
  //deletePerson,
  getAllPeople,
};
