import pool from "../config/db.js";

async function createPerson(name, documentType, document) {
  try {
    const [result] = await pool.query(
      "INSERT INTO people (name, document_type, document) VALUES (?, ?, ?)",
      [name, documentType, document]
    );
    return { id: result.insertId, name, document_type: documentType, document }; // Return the ID of the new person
  } catch (error) {
    console.error("Error in createPerson:", error);
    throw error;
  }
}
async function getPersonByDocument(documentType, document) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM people WHERE document_type = ? AND document = ?",
      [documentType, document]
    );
    return rows[0];
  } catch (error) {
    console.error("Error in getPersonByDocument: ", error);
    throw error;
  }
}

async function getPersonById(id) {
  try {
    const [rows] = await pool.query("SELECT * FROM people WHERE id = ?", [id]);
    return rows[0];
  } catch (error) {
    console.error("Error in getPersonById: ", error);
    throw error;
  }
}

async function getAllPeople() {
  try {
    const [rows] = await pool.query("SELECT * FROM people");
    return rows;
  } catch (error) {
    console.error("Error in getAllPeople: ", error);
    throw error;
  }
}

async function updatePerson(id, personData) {
  try {
    const { name, email, phone_number, document_type, document } = personData;
    const [result] = await pool.query(
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
async function deletePerson(id) {
  try {
    const [result] = await pool.query("DELETE FROM people WHERE id = ?", [id]);
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
