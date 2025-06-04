import pool from "../config/db.js";

// --- createProperty ---
async function createProperty(propertyData, connection) {
  const {
    street,
    house_number,
    neighborhood,
    complement,
    property_registration,
    logradouro_code,
    secao_code,
    tax_type,
    land_area,
    built_area,
    front_photo,
    above_photo,
  } = propertyData;

  const db = connection || pool;

  try {
    const [result] = await db.query(
      `
      INSERT INTO properties (
        street, house_number, neighborhood, complement,
        property_registration, logradouro_code, secao_code, tax_type,
        land_area, built_area, front_photo, above_photo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        street,
        house_number,
        neighborhood,
        complement,
        property_registration,
        logradouro_code,
        secao_code,
        tax_type,
        land_area,
        built_area,
        front_photo,
        above_photo,
      ]
    );

    return {
      id: result.insertId,
      property_registration,
      logradouro_code,
      secao_code,
    };
  } catch (error) {
    console.error("Error in createProperty:", error);
    throw error;
  }
}

// --- getPropertyById ---
async function getPropertyById(id) {
  try {
    const [rows] = await pool.query("SELECT * FROM properties WHERE id = ?", [
      id,
    ]);
    return rows[0];
  } catch (error) {
    console.error("Error in getPropertyById: ", error);
    throw error;
  }
}

// --- getAllProperties ---
async function getAllProperties() {
  try {
    const [rows] = await pool.query("SELECT * FROM properties");
    return rows;
  } catch (error) {
    console.error("Error in getAllProperties:", error);
    throw error;
  }
}

// --- updateProperty ---
async function updateProperty(id, propertyData, connection) {
  const db = connection || pool;
  const validData = Object.fromEntries(
    Object.entries(propertyData).filter(([_, value]) => value !== undefined)
  );

  const fields = Object.keys(validData);

  if (fields.length === 0) {
    // console.log("No fields provided to update property.");
    return { affectedRows: 0 };
  }

  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  const values = fields.map((field) => validData[field]);

  values.push(id);

  const sql = `UPDATE properties SET ${setClause} WHERE id = ?`;

  try {
    const [result] = await db.query(sql, values);
    return result;
  } catch (error) {
    console.error("Error in updateProperty model:", error);
    throw error;
  }
}

// --- deleteProperty ---
async function deleteProperty(propertyId, connection) {
  try {
    const [result] = await connection.query(
      "DELETE FROM properties WHERE id = ?",
      [propertyId]
    );
    return result;
  } catch (error) {
    console.error("Error in deleteProperty: ", error);
    throw error;
  }
}

// --- linkPropertyToPerson ---
async function linkPropertyToPerson(
  propertyId,
  personId,
  relationshipType,
  description,
  connection
) {
  try {
    const [result] = await connection.query(
      "INSERT INTO property_people (property_id, person_id, relationship_type, description) VALUES (?, ?, ?, ?)",
      [propertyId, personId, relationshipType, description]
    );
    return result;
  } catch (error) {
    console.error("Error in linkPropertyToPerson: ", error);
    throw error;
  }
}

// --- getPeopleByPropertyId ---
async function getPeopleByPropertyId(propertyId) {
  try {
    const [rows] = await pool.query(
      `SELECT
        p.id, p.name, p.document, p.document_type, p.email, p.phone_number,
        p.residential_street, p.residential_house_number, p.residential_neighborhood,
        p.residential_complement, p.residential_city, p.residential_state, p.residential_zip_code,
        pp.relationship_type, pp.description
          FROM people p
          INNER JOIN property_people pp ON p.id = pp.person_id
          WHERE pp.property_id = ?`,
      [propertyId]
    );
    return rows;
  } catch (error) {
    console.error("Error in getPeopleByPropertyId:", error);
    throw error;
  }
}

// --- removePropertyPeople ---
async function removePropertyPeople(propertyId, connection) {
  try {
    const [result] = await connection.query(
      "DELETE FROM property_people WHERE property_id = ?",
      [propertyId]
    );
    return result;
  } catch (error) {
    console.error("Error in removePropertyPeople: ", error);
    throw error;
  }
}

// --- propertyExists ---
async function propertyExists(propertyId) {
  try {
    const [rows] = await pool.query("SELECT 1 FROM properties WHERE id = ?", [
      propertyId,
    ]);
    return rows.length > 0;
  } catch (error) {
    console.error("Error in propertyExists:", error);
    throw error;
  }
}

// --- getPropertiesByPersonId ---
async function getPropertiesByPersonId(personId, connection) {
  try {
    const [rows] = await connection.query(
      `SELECT p.*
      FROM properties p
      INNER JOIN property_people pp ON p.id = pp.property_id
      WHERE pp.person_id = ?`,
      [personId]
    );
    return rows;
  } catch (error) {
    console.error("Error in getPropertiesByPersonId:", error);
    throw error;
  }
}

// --- getPeopleForPropertyIds ---
async function getPeopleForPropertyIds(propertyIds) {
  if (!propertyIds || propertyIds.length === 0) {
    return [];
  }

  const placeholders = propertyIds.map(() => "?").join(",");
  const sql = `
    SELECT
      p.id, p.name, p.document, p.document_type, p.email, p.phone_number,  /* Select needed people fields */
      pp.property_id,  /* Crucial: Include the property_id to map back */
      pp.relationship_type,
      pp.description
    FROM people p
    INNER JOIN property_people pp ON p.id = pp.person_id
    WHERE pp.property_id IN (${placeholders})
    ORDER BY pp.property_id; /* Optional: ordering might help mapping */
  `;

  try {
    const [rows] = await pool.query(sql, propertyIds);
    return rows;
  } catch (error) {
    console.error("Error in getPeopleForPropertyIds:", error);
    throw error;
  }
}

export {
  createProperty,
  getPropertyById,
  getAllProperties,
  updateProperty,
  deleteProperty,
  linkPropertyToPerson,
  getPeopleByPropertyId,
  removePropertyPeople,
  propertyExists,
  getPropertiesByPersonId,
  getPeopleForPropertyIds,
};
