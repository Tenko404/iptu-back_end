// ./src/Models/User.js
import pool from "../Config/db.js";

async function getUserByEmployeeId(employeeId) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE employee_id = ?",
      [employeeId]
    );
    return rows[0]; // Return the first row (or undefined if no user found)
  } catch (error) {
    console.error("Error in getUserByEmployeeId:", error);
    throw error; // Re-throw the error to be handled by the controller
  }
}
async function getUserById(id) {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0]; // Return the first row (or undefined if no user found)
  } catch (error) {
    console.error("Error in getUserById:", error);
    throw error;
  }
}

async function createUser(employeeId, hashedPassword, role) {
  try {
    const [result] = await pool.query(
      "INSERT INTO users (employee_id, employee_password, employee_role) VALUES (?,?,?)",
      [employeeId, hashedPassword, role]
    );
    return { id: result.insertId, employee_id: employeeId, role: role }; //return the created user
  } catch (error) {
    console.error("Error in createUser: ", error);
    throw error;
  }
}

export { getUserByEmployeeId, createUser, getUserById };
