import pool from "../config/db.js";

async function createPerson(
  name,
  documentType,
  document,
  email,
  phoneNumber,
  connection
) {
  const db = connection || pool;
  try {
    const [result] = await db.query(
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
  const db = connection || pool;
  try {
    const [rows] = await db.query(
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
  const validData = Object.fromEntries(
    Object.entries(personData).filter(([_, value]) => value !== undefined)
  );

  const fields = Object.keys(validData);

  if (fields.length === 0) {
    // console.log("No fields provided to update person.");
    return { affectedRows: 0 };
  }

  // Build SET part of the query
  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  // Get values in correct order
  const values = fields.map((field) => validData[field]);

  // Add persons ID to the end of the values array
  values.push(id);

  const sql = `UPDATE people SET ${setClause} WHERE id = ?`;

  try {
    const [result] = await db.query(sql, values);
    return result;
  } catch (error) {
    console.error("Error in updatePerson model:", error);
    throw error;
  }
}
/*
async function deletePerson(id, connection) {
  const db = connection || pool;
  try {
    const [result] = await db.query("DELETE FROM people WHERE id = ?", [id]);
    return result;
  } catch (error) {
    console.error("Error in deletePerson: ", error);
    throw error;
  }
}
*/
export {
  createPerson,
  getPersonByDocument,
  getPersonById,
  updatePerson,
  //deletePerson,
  getAllPeople,
};
