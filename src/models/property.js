import pool from "../config/db.js";

async function createProperty(propertyData, connection) {
  // Add connection parameter
  const {
    street,
    house_number,
    neighborhood,
    complement,
    property_registration,
    tax_type,
    land_area,
    built_area,
    front_photo,
    above_photo,
  } = propertyData;

  try {
    const [result] = await connection.query(
      // Use connection, not pool
      `
      INSERT INTO properties (street, house_number, neighborhood, complement, property_registration, tax_type, land_area, built_area, front_photo, above_photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        street,
        house_number,
        neighborhood,
        complement,
        property_registration,
        tax_type,
        land_area,
        built_area,
        front_photo,
        above_photo,
      ]
    );

    return { id: result.insertId };
  } catch (error) {
    console.error("Error in createProperty:", error);
    throw error; // No need to rollback here, service layer handles it
  }
}

async function getPropertyById(id) {
  // No connection needed
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

async function getAllProperties() {
  // No connection needed
  try {
    const [rows] = await pool.query("SELECT * FROM properties");
    return rows;
  } catch (error) {
    console.error("Error in getAllProperties:", error);
    throw error;
  }
}

async function updateProperty(id, propertyData, connection) {
  const db = connection || pool;
  // Filter out undefined values explicitly
  const validData = Object.fromEntries(
    Object.entries(propertyData).filter(([_, value]) => value !== undefined)
  );

  const fields = Object.keys(validData);

  if (fields.length === 0) {
    // console.log("No fields provided to update property.");
    return { affectedRows: 0 }; // No update occurred
  }

  // Dynamically build the SET clause
  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  // Get the corresponding values
  const values = fields.map((field) => validData[field]);

  // Add the property ID for the WHERE clause
  values.push(id);

  const sql = `UPDATE properties SET ${setClause} WHERE id = ?`;

  try {
    const [result] = await db.query(sql, values);
    // Return result; service layer checks affectedRows
    return result;
  } catch (error) {
    console.error("Error in updateProperty model:", error);
    // Handle specific errors if needed (like ER_DUP_ENTRY for property_registration)
    throw error; // Re-throw for the service layer
  }
}

async function deleteProperty(propertyId, connection) {
  // Add connection
  try {
    const [result] = await connection.query(
      // Use connection, not pool
      "DELETE FROM properties WHERE id = ?",
      [propertyId]
    );
    return result;
  } catch (error) {
    console.error("Error in deleteProperty: ", error);
    throw error;
  }
}

async function linkPropertyToPerson(
  propertyId,
  personId,
  relationshipType,
  description,
  connection
) {
  // Add connection
  try {
    const [result] = await connection.query(
      // Use connection
      "INSERT INTO property_people (property_id, person_id, relationship_type, description) VALUES (?, ?, ?, ?)",
      [propertyId, personId, relationshipType, description]
    );
    return result;
  } catch (error) {
    console.error("Error in linkPropertyToPerson: ", error);
    throw error;
  }
}

async function getPeopleByPropertyId(propertyId) {
  // No connection needed
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.document, p.document_type, pp.relationship_type, pp.description
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

async function removePropertyPeople(propertyId, connection) {
  // Add connection
  try {
    const [result] = await connection.query(
      // Use connection
      "DELETE FROM property_people WHERE property_id = ?",
      [propertyId]
    );
    return result;
  } catch (error) {
    console.error("Error in removePropertyPeople: ", error);
    throw error;
  }
}

async function propertyExists(propertyId) {
  try {
    const [rows] = await pool.query(
      "SELECT 1 FROM properties WHERE id = ?", // Efficient existence check
      [propertyId]
    );
    return rows.length > 0; // Return true if any rows are found, false otherwise
  } catch (error) {
    console.error("Error in propertyExists:", error);
    throw error; // Re-throw for controller to handle
  }
}

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

async function getPeopleForPropertyIds(propertyIds) {
  // Handle empty list to avoid invalid SQL
  if (!propertyIds || propertyIds.length === 0) {
    return [];
  }

  // Create placeholders for the IN clause (?, ?, ?, ...)
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
    const [rows] = await pool.query(sql, propertyIds); // Pass the array of IDs
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
