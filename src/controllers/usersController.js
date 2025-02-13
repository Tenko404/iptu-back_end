// src/controllers/usersController.js
const User = require("../models/user"); // Import User model
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("../../config");
require("dotenv").config({ path: config.envPath });

// --- Validation Schemas ---
const registerSchema = Joi.object({
  employee_id: Joi.number().integer().required(), // Ensure it's a number
  employee_password: Joi.string().min(6).required(), // Example: minimum 6 characters
  employee_role: Joi.string().valid("admin", "staff").required(),
});

const loginSchema = Joi.object({
  employee_id: Joi.number().integer().required(), // Changed! to Integer!
  employee_password: Joi.string().required(),
});

// --- Controller Functions ---
const registerUser = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { employee_id, employee_password, employee_role } = req.body; //get From body
    const hashedPassword = await bcrypt.hash(employee_password, 10); // Hash password

    const userId = await User.create({
      employee_id,
      employee_password: hashedPassword,
      employee_role, // Use User model
    });

    res
      .status(201)
      .json({ message: "Usuário registrado com sucesso!", id: userId });
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.code === "ER_DUP_ENTRY") {
      //Example, you could check also this: ER_NO_REFERENCED_ROW_2, to check for example if inventory Exists; to foreigns inserts.
      return res
        .status(409)
        .json({ error: "Funcionário com este ID já existe." }); //Specific error is user friendly, as you can send that string at client and alert your app.
    }
    res.status(500).json({ error: "Error registering user" });
  }
};
const loginUser = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { employee_id, employee_password } = req.body;

    //Change Here too, since employee it's in another column
    const user = await User.findByEmployeeId(employee_id);

    if (!user) {
      return res.status(400).json({ error: "Usuário não encontrado." });
    }

    const passwordMatch = await bcrypt.compare(
      employee_password,
      user.employee_password
    );

    if (!passwordMatch) {
      return res.status(400).json({ error: "Senha incorreta." });
    }
    const token = jwt.sign(
      { id: user.id, role: user.employee_role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    // Replace with your secret key and options

    res.json({ message: "Login bem-sucedido!", token });
  } catch (error) {
    // <---  ADD THIS catch block
    console.error("Error during login:", error);
    res.status(500).json({ error: "Error during login" });
  }
};
