import * as PeopleService from "../services/peopleService.js";
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
      .json({ message: "Pessoa criada com sucesso", id: newPerson.id });
  } catch (error) {
    console.error("Erro em createPerson controller:", error);
    if (error.code === "ER_DUP_ENTRY") {
      // Assuming you have a unique constraint on document (CPF/CNPJ)
      res
        .status(409)
        .json({ message: "Uma pessoa com este documento ja existe!." });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
// Add other CRUD operations (get, update, delete) as needed.
