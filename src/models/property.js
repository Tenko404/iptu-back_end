import pool from "../config/db.js";

async function createProperty(propertyData) {
  const {
    zip_code,
    street,
    house_number,
    neighborhood,
    complement,
    city,
    state,
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
      INSERT INTO properties (zip_code, street, house_number, neighborhood, complement, city, state, property_registration, tax_type, land_area, built_area, front_photo, above_photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        zip_code,
        street,
        house_number,
        neighborhood,
        complement,
        city,
        state,
        property_registration,
        tax_type,
        land_area,
        built_area,
        front_photo,
        above_photo,
      ]
    );

    return { id: result.insertId }; //return the id of the created property
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
      zip_code,
      street,
      house_number,
      neighborhood,
      complement,
      city,
      state,
      property_registration,
      tax_type,
      land_area,
      built_area,
      front_photo,
      above_photo,
    } = propertyData;

    const [result] = await pool.query(
      `UPDATE properties SET zip_code = ?, street = ?, house_number = ?, neighborhood = ?,
        complement = ?, city = ?, state = ?, property_registration = ?, tax_type = ?, land_area = ?, built_area = ?,
        front_photo = ?, above_photo = ? WHERE id = ?`,
      [
        zip_code,
        street,
        house_number,
        neighborhood,
        complement,
        city,
        state,
        property_registration,
        tax_type,
        land_area,
        built_area,
        front_photo,
        above_photo,
        id,
      ]
    );

    return result; //return the result
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
    return result; //return the result
  } catch (error) {
    console.error("Error in linkPropertyToPerson: ", error);
    throw error;
  }
}
async function getOwnersByPropertyId(propertyId) {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.document, p.document_type
        FROM people p
        INNER JOIN property_people pp ON p.id = pp.person_id
        WHERE pp.property_id = ? AND pp.relationship_type = 'owner'`,
      [propertyId]
    );
    return rows;
  } catch (error) {
    console.error("Error in getOwnersByPropertyId:");
    throw error;
  }
}

async function getPossessorByPropertyId(propertyId) {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.document, p.document_type, pp.description
        FROM people p
        INNER JOIN property_people pp ON p.id = pp.person_id
        WHERE pp.property_id = ? AND pp.relationship_type = 'possessor'`,
      [propertyId]
    );
    return rows[0];
  } catch (error) {
    console.error("Error in getPossessorByPropertyId:");
    throw error;
  }
}

async function getExecutorByPropertyId(propertyId) {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.document, p.document_type, pp.description
        FROM people p
        INNER JOIN property_people pp ON p.id = pp.person_id
        WHERE pp.property_id = ? AND pp.relationship_type = 'executor'`,
      [propertyId]
    );
    return rows[0];
  } catch (error) {
    console.error("Error in getExecutorByPropertyId:");
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
export {
  createProperty,
  getPropertyById,
  getAllProperties,
  updateProperty,
  deleteProperty,
  linkPropertyToPerson,
  getOwnersByPropertyId,
  getPossessorByPropertyId,
  getExecutorByPropertyId,
  removePropertyPeople,
};
