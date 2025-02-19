import * as UserService from "../services/userService.js";
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

    if (error.message === "Credenciais inválidas") {
      res.status(401).json({ message: "Credenciais inválidas" });
    } else if (error.message === "Usuário não encontrado") {
      res.status(404).json({ message: "Usuário não encontrado" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
