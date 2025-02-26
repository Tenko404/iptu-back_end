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

  // Create the person
  const newPerson = await PersonModel.createPerson(
    name,
    document_type,
    document,
    email,
    phone_number
  ); // Pass email/phone
  return newPerson;
}

//check the person, used for request validation
async function checkPerson(id) {
  const person = await PersonModel.getPersonById(id);
  if (!person) {
    return false;
  }
  return person;
}

// Get a person by ID
async function getPersonById(personId) {
  const person = await PersonModel.getPersonById(personId);
  if (!person) {
    throw new Error("Person not found"); // Throw error to be handled in controller
  }
  return person;
}

async function getAllPeople() {
  const people = await PersonModel.getAllPeople();
  return people;
}

async function updatePerson(personId, personData) {
  // Check if the person exists
  const { name, email, phone_number, document_type, document } = personData;
  const personExists = await PersonModel.getPersonById(personId);
  if (!personExists) {
    throw new Error("Person not found");
  }
  // Check if a person with the same document already exists
  if (document && document_type) {
    //if those fields are being updated
    const existingPerson = await PersonModel.getPersonByDocument(
      document_type,
      document
    );
    if (existingPerson && existingPerson.id != personId) {
      throw new Error("A person with this document already exists.");
    }
  }
  const updateData = {
    ...personData,
  };
  const filteredData = Object.fromEntries(
    Object.entries(updateData).filter(([key, value]) => value !== undefined)
  );
  await PersonModel.updatePerson(personId, filteredData);
  return;
}

async function deletePerson(personId) {
  const person = await PersonModel.getPersonById(personId);
  if (!person) {
    throw new Error("Person not found");
  }
  await PersonModel.deletePerson(personId);
  return;
}

export {
  createPerson,
  checkPerson,
  getPersonById,
  updatePerson,
  deletePerson,
  getAllPeople,
};
