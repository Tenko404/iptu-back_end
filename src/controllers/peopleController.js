// ./src/Controllers/PeopleController.js
import * as PeopleService from "../Services/PeopleService.js";
import { validationResult } from "express-validator";

export const createPerson = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const personData = req.body;
    const newPerson = await PeopleService.createPerson(personData);

    res
      .status(201)
      .json({ message: "Person created successfully", id: newPerson.id });
  } catch (error) {
    console.error("Error in createPerson controller:", error);
    if (error.code === "ER_DUP_ENTRY") {
      // Assuming you have a unique constraint on document (CPF/CNPJ)
      res
        .status(409)
        .json({ message: "A person with this document already exists." });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
// Add other CRUD operations (get, update, delete) as needed.
