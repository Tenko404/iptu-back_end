// src/models/property.js
const db = require("../config/db");

const Property = {
  findAll: async () => {
    return await db.query("SELECT * FROM properties");
  },

  findById: async (id) => {
    return await db.query("SELECT * FROM properties WHERE id = ?", [id]);
  },

  create: async (propertyData) => {
    const [result] = await db.query(
      "INSERT INTO properties SET ?",
      propertyData
    );
    return result.insertId;
  },

  update: async (id, propertyData) => {
    const [result] = await db.query("UPDATE properties SET ? WHERE id = ?", [
      propertyData,
      id,
    ]);
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await db.query("DELETE FROM properties WHERE id = ?", [
      id,
    ]);
    return result.affectedRows;
  },
};

module.exports = Property;
