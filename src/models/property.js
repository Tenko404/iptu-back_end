import pool from "../config/db.js";

async function createProperty(propertyData) {
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
    const [result] = await pool.query(
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
    throw error;
  }
}

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

async function getAllProperties() {
  try {
    const [rows] = await pool.query("SELECT * FROM properties");
    return rows;
  } catch (error) {
    console.error("Error in getAllProperties:", error);
    throw error;
  }
}

async function updateProperty(id, propertyData) {
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

    const [result] = await pool.query(
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

async function deleteProperty(id) {
  try {
    const [result] = await pool.query("DELETE FROM properties WHERE id = ?", [
      id,
    ]);
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
  description
) {
  try {
    const [result] = await pool.query(
      "INSERT INTO property_people (property_id, person_id, relationship_type, description) VALUES (?, ?, ?, ?)",
      [propertyId, personId, relationshipType, description]
    );
    return result;
  } catch (error) {
    console.error("Error in linkPropertyToPerson: ", error);
    throw error;
  }
}

// NEW FUNCTION (replaces getOwnersByPropertyId, etc.)
async function getPeopleByPropertyId(propertyId) {
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

async function removePropertyPeople(propertyId) {
  try {
    const [result] = await pool.query(
      "DELETE FROM property_people WHERE property_id = ?",
      [propertyId]
    );
    return result;
  } catch (error) {
    console.error("Error in removePropertyPeople: ", error);
    throw error;
  }
}

// REMOVE THESE FUNCTIONS:
// async function getOwnersByPropertyId(propertyId) { ... }
// async function getPossessorByPropertyId(propertyId) { ... }
// async function getExecutorByPropertyId(propertyId) { ... }

export {
  createProperty,
  getPropertyById,
  getAllProperties,
  updateProperty,
  deleteProperty,
  linkPropertyToPerson,
  getPeopleByPropertyId, // Export the new function
  removePropertyPeople,
};
