// ./src/Controllers/UserController.js
import * as UserService from "../Services/UserService.js";
import { validationResult } from "express-validator";

export const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employee_id, password } = req.body;
    const result = await UserService.login(employee_id, password); // Call the service

    // If successful, return user data and token
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in login controller:", error);

    if (error.message === "Invalid credentials") {
      res.status(401).json({ message: "Invalid credentials" });
    } else if (error.message === "User not found") {
      res.status(404).json({ message: "User not found" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
