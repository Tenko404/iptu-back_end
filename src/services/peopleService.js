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
  return person; // Return undefined if not found, don't throw
}

async function getAllPeople() {
  const people = await PersonModel.getAllPeople();
  return people;
}

async function updatePerson(personId, personData) {
  // 1. Check if the person exists
  const personExists = await PersonModel.getPersonById(personId);
  if (!personExists) {
    // Use a more specific error type if implemented, otherwise keep string
    throw new Error("Person not found");
  }

  // 2. Check for document conflicts IF document details are being updated
  const { document_type, document } = personData;
  if (document_type && document) {
    const existingPersonWithDoc = await PersonModel.getPersonByDocument(
      document_type,
      document
    );
    // Ensure the conflicting document doesn't belong to *another* person
    if (existingPersonWithDoc && existingPersonWithDoc.id != personId) {
      // Use a specific error type/message for duplicates
      throw new Error("Já existe outra pessoa cadastrada com este documento.");
    }
  }

  // 3. Prepare data for the model (can pass personData directly, or filter nulls if needed)
  // The updated model handles missing keys, so we can pass personData.
  // If you want to explicitly prevent setting fields to NULL via undefined, filter here.
  // For simplicity now, let's assume undefined means "don't update".
  const dataToUpdate = Object.fromEntries(
    Object.entries(personData).filter(([_, value]) => value !== undefined)
  );

  // If no actual data is left to update after filtering, maybe return early?
  if (Object.keys(dataToUpdate).length === 0) {
    console.log("No valid fields provided for person update.");
    // Return the existing data or indicate no change occurred
    return personExists;
  }

  // 4. Call the updated model function
  const result = await PersonModel.updatePerson(personId, dataToUpdate); // Pass connection if in transaction context

  // 5. Optional: Check if update actually occurred
  if (result.affectedRows === 0) {
    // This might happen if the data provided was identical to existing data
    // Or if the ID didn't match (though we checked earlier)
    console.warn(`Update operation affected 0 rows for person ID: ${personId}`);
    // Decide how to handle this - maybe still return the person?
  }

  // 6. Return the potentially updated person data (fetch again or merge)
  // Fetching again ensures we return the *actual* state from the DB
  const updatedPerson = await PersonModel.getPersonById(personId);
  return updatedPerson;
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
  getPersonById,
  updatePerson,
  deletePerson,
  getAllPeople,
};
