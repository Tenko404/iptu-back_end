import * as UserModel from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

async function login(employeeId, password) {
  const user = await UserModel.getUserByEmployeeId(employeeId);

  if (!user) {
    throw new Error("User not found"); // Throw error handled in controller
  }

  const passwordMatch = await bcrypt.compare(password, user.employee_password);

  if (!passwordMatch) {
    throw new Error("Invalid credentials"); // Throw error handled in controller
  }

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, role: user.employee_role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return {
    user: {
      id: user.id,
      employee_id: user.employee_id,
      role: user.employee_role,
    },
    token,
  };
}
export { login };
