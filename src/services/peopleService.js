// ./src/Services/PeopleService.js
import * as PersonModel from "../Models/Person.js";

async function createPerson(personData) {
  const { name, email, phone_number, document_type, document } = personData;

  // Check if a person with the same document already exists
  const existingPerson = await PersonModel.getPersonByDocument(
    document_type,
    document
  );
  if (existingPerson) {
    throw new Error("A person with this document already exists.");
  }

  // Create the person
  const newPerson = await PersonModel.createPerson(
    name,
    document_type,
    document
  );
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

export { createPerson, checkPerson };
