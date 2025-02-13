// src/models/person.js
const db = require("../config/db");

const Person = {
  //Find for owners.
  findOwners: async () => {
    return await db.query('SELECT * FROM people where type = "owner"');
  },
  //Find for possessors.
  findPossessors: async () => {
    return await db.query('SELECT * FROM people where type = "possessor"');
  },

  //General
  findAll: async () => {
    return await db.query("SELECT * FROM people");
  },

  findById: async (id) => {
    const [rows] = await db.query("SELECT * FROM people WHERE id = ?", [id]);
    return rows[0]; // Return the first row (or undefined if not found)
  },

  findByDocument: async (document_type, document) => {
    //New method!
    const [rows] = await db.query(
      "SELECT * FROM people where document_type = ? AND document = ?",
      [document_type, document]
    );
    return rows[0];
  },

  create: async (personData) => {
    const [result] = await db.query("INSERT INTO people SET ?", personData);
    return result.insertId;
  },

  update: async (id, personData) => {
    const [result] = await db.query("UPDATE people SET ? WHERE id = ?", [
      personData,
      id,
    ]);
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await db.query("DELETE FROM people WHERE id = ?", [id]);
    return result.affectedRows;
  },
};
module.exports = Person;
