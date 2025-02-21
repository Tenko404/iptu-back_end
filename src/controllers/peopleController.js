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
      .json({ message: "Pessoa criada com sucesso.", id: newPerson.id });
  } catch (error) {
    console.error("Error in createPerson controller:", error);
    if (error.code === "ER_DUP_ENTRY") {
      // Assuming you have a unique constraint on document (CPF/CNPJ)
      res.status(409).json({
        message: "Já existe uma pessoa cadastrada com este documento.",
      });
    } else {
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
};

// Get a person by ID
export const getPersonById = async (req, res) => {
  try {
    const personId = req.params.id;
    const person = await PeopleService.getPersonById(personId);

    if (!person) {
      return res.status(404).json({ message: "Pessoa não encontrada." });
    }

    res.status(200).json(person);
  } catch (error) {
    console.error("Error in getPersonById controller:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

//get all people
export const getAllPeople = async (req, res) => {
  try {
    const people = await PeopleService.getAllPeople();
    res.status(200).json(people);
  } catch (error) {
    console.error("Error in getAllPeople controller: ", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// Update a person
export const updatePerson = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const personId = req.params.id;
    const personData = req.body;
    const updatedPerson = await PeopleService.updatePerson(
      personId,
      personData
    );
    res.status(200).json({ message: "Pessoa atualizada com sucesso!" });
  } catch (error) {
    console.error("Error in updatePerson controller:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res
        .status(409)
        .json({
          message: "Já existe uma pessoa cadastrada com este documento.",
        });
    } else if (error.message === "Person not found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
};

// Delete a person
export const deletePerson = async (req, res) => {
  try {
    const personId = req.params.id;
    await PeopleService.deletePerson(personId);

    res.status(200).json({ message: "Pessoa excluída com sucesso!" });
  } catch (error) {
    console.error("Error in deletePerson controller:", error);
    if (error.message === "Person not found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
};
