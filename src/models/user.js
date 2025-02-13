//src/models/user.js

const db = require("../config/db");

const User = {
  create: async (userData) => {
    const [result] = await db.query("INSERT INTO users SET ?", userData);

    return result.insertId; // Get id of new user.
  },
  //Added this, so we find user by ID!
  findByEmployeeId: async (employeeId) => {
    const [rows] = await db.query("SELECT * FROM users WHERE employee_id = ?", [
      employeeId,
    ]);
    return rows[0]; //Return the first
  },
  findById: async (id) => {
    const [rows] = await db.query("SELECT * FROM user_login WHERE id = ?", [
      id,
    ]);
    return rows[0];
  },
};

module.exports = User;
