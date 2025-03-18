// person.js
import pool from "../config/db.js";

async function createPerson(
  name,
  documentType,
  document,
  email,
  phoneNumber,
  connection
) {
  // Add connection
  const db = connection || pool; // Use connection if provided, otherwise use pool
  try {
    const [result] = await db.query(
      // Use 'db' instead of 'pool'
      "INSERT INTO people (name, document_type, document, email, phone_number) VALUES (?, ?, ?, ?, ?)",
      [name, documentType, document, email, phoneNumber]
    );
    return {
      id: result.insertId,
      name,
      document_type: documentType,
      document,
      email,
      phone_number: phoneNumber,
    };
  } catch (error) {
    console.error("Error in createPerson:", error);
    throw error;
  }
}
async function getPersonByDocument(documentType, document, connection) {
  // Add connection
  const db = connection || pool;
  try {
    const [rows] = await db.query(
      // Use 'db' instead of 'pool'
      "SELECT * FROM people WHERE document_type = ? AND document = ?",
      [documentType, document]
    );
    return rows[0];
  } catch (error) {
    console.error("Error in getPersonByDocument: ", error);
    throw error;
  }
}

async function getPersonById(id, connection) {
  // Add connection
  const db = connection || pool;
  try {
    const [rows] = await db.query("SELECT * FROM people WHERE id = ?", [id]);
    return rows[0];
  } catch (error) {
    console.error("Error in getPersonById: ", error);
    throw error;
  }
}

async function getAllPeople(connection) {
  // Add connection
  const db = connection || pool;
  try {
    const [rows] = await db.query("SELECT * FROM people");
    return rows;
  } catch (error) {
    console.error("Error in getAllPeople: ", error);
    throw error;
  }
}

async function updatePerson(id, personData, connection) {
  // Add connection
  const db = connection || pool;
  try {
    const { name, email, phone_number, document_type, document } = personData;
    const [result] = await db.query(
      // Use 'db' instead of 'pool'
      `UPDATE people
      SET name = ?, email = ?, phone_number = ?, document_type = ?, document = ?
      WHERE id = ?`,
      [name, email, phone_number, document_type, document, id]
    );
    return result;
  } catch (error) {
    console.error("Error in updatePerson:", error);
    throw error;
  }
}
async function deletePerson(id, connection) {
  // Add connection
  const db = connection || pool;
  try {
    const [result] = await db.query("DELETE FROM people WHERE id = ?", [id]);
    return result;
  } catch (error) {
    console.error("Error in deletePerson: ", error);
    throw error;
  }
}

export {
  createPerson,
  getPersonByDocument,
  getPersonById,
  updatePerson,
  deletePerson,
  getAllPeople,
};
