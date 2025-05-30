import pool from "../config/db.js";

async function createPerson(
  name,
  documentType,
  document,
  email,
  phoneNumber,
  residential_street,
  residential_house_number,
  residential_neighborhood,
  residential_complement,
  residential_city,
  residential_state,
  residential_zip_code,
  connection
) {
  console.log("--- !!! ENTERED PersonModel.createPerson !!! ---");

  const db = connection || pool;
  console.log("--- PersonModel.createPerson called with data ---");
  console.log({
    name,
    documentType,
    document,
    email,
    phoneNumber,
    residential_street,
    residential_house_number,
    residential_neighborhood,
    residential_complement,
    residential_city,
    residential_state,
    residential_zip_code,
  });
  try {
    const sql = `INSERT INTO people (
        name, document_type, document, email, phone_number,
        residential_street, residential_house_number, residential_neighborhood,
        residential_complement, residential_city, residential_state, residential_zip_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      name,
      documentType,
      document,
      email,
      phoneNumber,
      residential_street,
      residential_house_number,
      residential_neighborhood,
      residential_complement,
      residential_city,
      residential_state,
      residential_zip_code,
    ];

    console.log("--- PersonModel.createPerson: Executing SQL ---", sql);
    console.log("--- PersonModel.createPerson: With Values ---", values);

    const [result] = await db.query(sql, values);

    console.log(
      "--- PersonModel.createPerson: DB query result ---",
      JSON.stringify(result, null, 2)
    );

    if (result && result.insertId) {
      const returnObject = {
        id: result.insertId,
        name,
        document_type: documentType,
        document,
        email,
        phone_number: phoneNumber,
        residential_street,
        residential_house_number,
        residential_neighborhood,
        residential_complement,
        residential_city,
        residential_state,
        residential_zip_code,
      };
      console.log(
        "--- PersonModel.createPerson: Returning object ---",
        JSON.stringify(returnObject, null, 2)
      );
      return returnObject;
    } else {
      console.error(
        "--- PersonModel.createPerson: insertId not found in DB result! ---",
        JSON.stringify(result, null, 2)
      );
      throw new Error("Failed to create person in database, insertId missing.");
    }
  } catch (error) {
    console.error("--- ERROR IN PersonModel.createPerson ---:", error);
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
