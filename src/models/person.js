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
  const db = connection || pool;
  // Filter out undefined values explicitly, although the dynamic query builder handles missing keys
  const validData = Object.fromEntries(
    Object.entries(personData).filter(([_, value]) => value !== undefined)
  );

  // Get the keys provided in the personData object
  const fields = Object.keys(validData);

  // If no fields are provided to update, return early (or handle as needed)
  if (fields.length === 0) {
    // console.log("No fields provided to update person.");
    return { affectedRows: 0 }; // Or throw an error if update must change something
  }

  // Dynamically build the SET part of the query
  // Example: SET name = ?, email = ?, phone_number = ?
  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  // Get the corresponding values in the correct order
  const values = fields.map((field) => validData[field]);

  // Add the person's ID to the end of the values array for the WHERE clause
  values.push(id);

  const sql = `UPDATE people SET ${setClause} WHERE id = ?`;

  try {
    const [result] = await db.query(sql, values);
    // Return the result object which includes affectedRows
    // The service layer can check result.affectedRows > 0 to confirm update
    return result;
  } catch (error) {
    console.error("Error in updatePerson model:", error);
    // Handle specific errors if needed (like ER_DUP_ENTRY for document)
    throw error; // Re-throw for the service layer
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
