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
  // Add connection
  try {
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

    const [result] = await connection.query(
      // Use connection
      `UPDATE properties SET street = ?, house_number = ?, neighborhood = ?,
        complement = ?, property_registration = ?, tax_type = ?, land_area = ?, built_area = ?,
        front_photo = ?, above_photo = ? WHERE id = ?`,
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
        id,
      ]
    );

    return result;
  } catch (error) {
    console.error("Error in updateProperty: ", error);
    throw error;
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

export {
  createProperty,
  getPropertyById,
  getAllProperties,
  updateProperty,
  deleteProperty,
  linkPropertyToPerson,
  getPeopleByPropertyId,
  removePropertyPeople,
};
