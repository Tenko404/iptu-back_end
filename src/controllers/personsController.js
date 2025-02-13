// src/controllers/personsController.js
const Person = require("../models/person");
const Joi = require("joi");
const db = require("../config/db");

// --- Validation Schemas ---
//Improved validations, requiring formats
const personSchema = Joi.object({
  name: Joi.string().required(),
  document_type: Joi.string().valid("CPF", "CNPJ").required(),
  document: Joi.string().max(18).required(), //Changed length to 18
  type: Joi.string().valid("owner", "possessor").required(),
})
  .when(Joi.object({ document_type: Joi.string().valid("CPF") }).unknown(), {
    // Conditional Validations
    then: Joi.object({
      document: Joi.string()
        .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
        .required(), // Format mask
    }),
  })
  .when(Joi.object({ document_type: Joi.string().valid("CNPJ") }).unknown(), {
    then: Joi.object({
      document: Joi.string()
        .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
        .required(), //CNPJ format mask
    }),
  });

const personUpdateSchema = Joi.object({
  name: Joi.string().required(),
  document_type: Joi.string().valid("CPF", "CNPJ").required(),
  document: Joi.string().max(18).required(), // Changed to 18
  type: Joi.string().valid("owner", "possessor").required(),
})
  .when(Joi.object({ document_type: Joi.string().valid("CPF") }).unknown(), {
    then: Joi.object({
      document: Joi.string()
        .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
        .required(),
    }),
  })
  .when(Joi.object({ document_type: Joi.string().valid("CNPJ") }).unknown(), {
    then: Joi.object({
      document: Joi.string()
        .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
        .required(),
    }),
  });

// --- Controller Functions ---

const getAllPersons = async (req, res) => {
  try {
    const persons = await Person.findAll(); // You now have find All
    res.json(persons);
  } catch (error) {
    console.error("Error getting persons:", error);
    res.status(500).json({ error: "Error getting persons" });
  }
};
const getAllOwners = async (req, res) => {
  try {
    const owners = await Person.findOwners(); // You now have find owners
    res.json(owners);
  } catch (error) {
    console.error("Error getting owners:", error);
    res.status(500).json({ error: "Error getting owners" });
  }
};
const getAllPossessors = async (req, res) => {
  try {
    const possessors = await Person.findPossessors(); // You now have find Possessors
    res.json(possessors);
  } catch (error) {
    console.error("Error getting possessors:", error);
    res.status(500).json({ error: "Error getting possessors" });
  }
};
const getPersonById = async (req, res) => {
  try {
    const { id } = req.params;
    const person = await Person.findById(id);
    if (!person) {
      return res.status(404).json({ error: "Person not found" });
    }
    res.json(person);
  } catch (error) {
    console.error("Error getting person:", error);
    res.status(500).json({ error: "Error getting person" });
  }
};

const createPerson = async (req, res) => {
  let connection;
  try {
    const { error } = personSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, document_type, document, type } = req.body;
    //Remove masks!
    const cleanDocument = document.replace(/[./-]/g, "");
    const personData = {
      name,
      document_type, //Uses the new type
      document: cleanDocument, //Uses the document NO FORMAT
      type, // Include the 'type'
    };
    connection = await db.getConnection();
    await connection.beginTransaction();

    const personId = await Person.create(personData); //Add to database
    await connection.commit();
    res
      .status(201)
      .json({ message: "Person created successfully!", id: personId });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error creating person:", error);
    res.status(500).json({ error: "Error creating person" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const updatePerson = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = personUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, document_type, document, type } = req.body;
    const cleanDocument = document.replace(/[./-]/g, ""); // Clean again!

    const personData = {
      name,
      document_type,
      document: cleanDocument, // <---  NO FORMATTED DOCUMENTS
      type, // Include the 'type'
    };
    const affectedRows = await Person.update(id, personData);

    if (affectedRows === 0) {
      return res.status(404).json({ error: "Person not found" });
    }

    res.status(200).json({ message: "Person updated successfully!" });
  } catch (error) {
    console.error("Error updating person:", error);
    res.status(500).json({ error: "Error updating person" });
  }
};

const deletePerson = async (req, res) => {
  try {
    const { id } = req.params;
    const affectedRows = await Person.delete(id);
    if (affectedRows === 0) {
      return res.status(404).json({ message: "Person not found." });
    }

    res.status(200).json({ message: "Person deleted sucessfully!" });
  } catch (error) {
    console.error("Error deleting Person: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllPersons,
  getAllOwners, //Added to separeted routes, if needed
  getAllPossessors, //Added to separeted routes, if needed
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
};
