// src/controllers/propertiesController.js
const Property = require("../models/property");
const Person = require("../models/person"); // Use the new Person model
const multer = require("multer");
const path = require("path");
const config = require("../../config");
const Joi = require("joi");
const db = require("../config/db");

// Multer setup (remains the same)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// --- Joi Validation Schemas ---
const propertySchema = Joi.object({
  zip_code: Joi.string().required(),
  street: Joi.string().required(),
  house_number: Joi.string().required(),
  neighborhood: Joi.string().required(),
  complement: Joi.string().allow(null, ""),
  city: Joi.string().required(),
  state: Joi.string().length(2).required(),
  property_registration: Joi.string().required(),
  tax_type: Joi.string().valid("commercial", "residential", "both").required(),
  land_area: Joi.number().required(),
  built_area: Joi.number().required(),
  owner_name: Joi.string().required(),
  owner_document_type: Joi.string().valid("CPF", "CNPJ").required(),
  owner_document: Joi.string().max(18).required(), //Changed here,
  possessor_name: Joi.string().allow(null, ""),
  possessor_document_type: Joi.string().valid("CPF", "CNPJ").allow(null, ""), // allowNull = optional
  possessor_document: Joi.string().max(18).allow(null, ""), //Changed to max(18)
  hasPossessor: Joi.boolean(), //New field!
})
  .when(
    Joi.object({ owner_document_type: Joi.string().valid("CPF") }).unknown(),
    {
      then: Joi.object({
        owner_document: Joi.string()
          .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
          .required(), // Format Mask to help!
      }),
    }
  )
  .when(
    Joi.object({ owner_document_type: Joi.string().valid("CNPJ") }).unknown(),
    {
      then: Joi.object({
        owner_document: Joi.string()
          .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
          .required(),
      }),
    }
  )
  .when(
    Joi.object({
      possessor_document_type: Joi.string().valid("CPF"),
    }).unknown(),
    {
      then: Joi.object({
        possessor_document: Joi.string()
          .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
          .allow(null, ""), //optional
      }),
    }
  )
  .when(
    Joi.object({
      possessor_document_type: Joi.string().valid("CNPJ"),
    }).unknown(),
    {
      then: Joi.object({
        possessor_document: Joi.string()
          .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
          .allow(null, ""),
      }),
    }
  );

const propertyUpdateSchema = Joi.object({
  zip_code: Joi.string().required(),
  street: Joi.string().required(),
  house_number: Joi.string().required(),
  neighborhood: Joi.string().required(),
  complement: Joi.string().allow(null, ""),
  city: Joi.string().required(),
  state: Joi.string().length(2).required(),
  property_registration: Joi.string().required(),
  tax_type: Joi.string().valid("commercial", "residential", "both").required(),
  land_area: Joi.number().required(),
  built_area: Joi.number().required(),
});

// --- Controller Functions ---

const getProperties = async (req, res) => {
  try {
    const properties = await Property.findAll();
    if (properties.length === 0) {
      return res.status(404).json({ error: "Nenhuma propriedade encontrada." });
    }
    res.json(properties);
  } catch (error) {
    console.error("Error getting properties:", error);
    res.status(500).json({ error: "Error getting properties" }); // Consistent JSON error
  }
};

const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);

    if (property.length === 0) {
      return res
        .status(404)
        .json({ error: "No property found with the given ID." });
    }

    res.json(property[0]);
  } catch (error) {
    console.error("Error getting property by ID:", error);
    res.status(500).json({ error: "Error getting property by ID" });
  }
};
const createProperty = async (req, res) => {
  let connection;
  try {
    const { error } = propertySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      zip_code,
      street,
      house_number,
      neighborhood,
      complement,
      city,
      state,
      property_registration,
      tax_type,
      land_area,
      built_area,
      owner_name,
      owner_document_type, // Changed
      owner_document, // Changed
      possessor_name,
      possessor_document_type, // Changed
      possessor_document, // Changed
      hasPossessor, //Bool value
    } = req.body;

    const front_photo = req.files?.front_photo
      ? `/uploads/${req.files.front_photo[0].filename}`
      : null;
    const above_photo = req.files?.above_photo
      ? `/uploads/${req.files.above_photo[0].filename}`
      : null;

    // --- Transaction Begins ---
    connection = await db.getConnection();
    await connection.beginTransaction();

    // --- 1. Insert Property ---
    const propertyData = {
      zip_code,
      street,
      house_number,
      neighborhood,
      complement,
      city,
      state,
      property_registration,
      tax_type,
      land_area,
      built_area,
      front_photo,
      above_photo,
    };

    const propertyId = await Property.create(propertyData);

    // --- 2.  Handle Owner (REQUIRED) ---

    let ownerId;
    //Clean Documents BEFORE checking!
    const cleanOwnerDocument = owner_document.replace(/[./-]/g, "");

    //Check if person exists
    const existingOwner = await Person.findByDocument(
      owner_document_type,
      cleanOwnerDocument
    ); // Changed

    if (existingOwner) {
      ownerId = existingOwner.id;
    } else {
      const ownerData = {
        // Create data object to insert
        name: owner_name,
        document_type: owner_document_type, // Use document_type/document
        document: cleanOwnerDocument, // Use document_type/document and clean!
        type: "owner",
      };
      ownerId = await Person.create(ownerData);
    }
    await db.query(
      // Create Relation
      "INSERT INTO property_people (property_id, person_id, relationship_type) VALUES (?, ?, ?)",
      [propertyId, ownerId, "Owner"] //Always be an owner
    );

    // --- 3. Handle Possessor (Optional) ---
    //If hasPossessor it's true:
    if (hasPossessor) {
      if (possessor_name && possessor_document && possessor_document_type) {
        let possessorId;
        const cleanPossessorDocument = possessor_document.replace(/[./-]/g, ""); // Clean!
        const existingPossessor = await Person.findByDocument(
          possessor_document_type,
          cleanPossessorDocument
        );

        if (existingPossessor) {
          possessorId = existingPossessor.id;
        } else {
          const possessorData = {
            name: possessor_name,
            document_type: possessor_document_type,
            document: cleanPossessorDocument, // Cleans up the document.
            type: "possessor",
          };
          possessorId = await Person.create(possessorData);
        }

        await db.query(
          "INSERT INTO property_people (property_id, person_id, relationship_type) VALUES (?, ?,?)",
          [propertyId, possessorId, "Possessor"] //Always possessor,
        );
      } else {
        await connection.rollback();
        return res
          .status(400)
          .json({
            error:
              "Possessor name, document and document type are required when hasPossessor is true.",
          });
      }
    }

    // --- Transaction Ends ---
    await connection.commit();
    res
      .status(201)
      .json({ message: "Property created successfully!", id: propertyId });
  } catch (error) {
    if (connection) {
      await connection.rollback(); // Rollback if something was wrong
    }
    console.error("Error creating property:", error);
    res.status(500).json({ error: "Error creating property" });
  } finally {
    if (connection) {
      connection.release(); //Releases connections
    }
  }
};
//Put remains the same...
// ... (updateProperty, deleteProperty, uploadPhotos remain the same )
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = propertyUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const {
      zip_code,
      street,
      house_number,
      neighborhood,
      complement,
      city,
      state,
      property_registration,
      tax_type,
      land_area,
      built_area,
    } = req.body;

    const front_photo = req.files?.front_photo
      ? `/uploads/${req.files.front_photo[0].filename}`
      : null;
    const above_photo = req.files?.above_photo
      ? `/uploads/${req.files.above_photo[0].filename}`
      : null;

    const propertyData = {
      zip_code,
      street,
      house_number,
      neighborhood,
      complement,
      city,
      state,
      property_registration,
      tax_type,
      land_area,
      built_area,
      front_photo,
      above_photo,
    };
    const affectedRows = await Property.update(id, propertyData); // Use Model
    if (affectedRows === 0) {
      return res.status(404).json({ error: "Propriedade não encontrada!" });
    }
    res.status(200).json({ message: "Propriedade atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar a propriedade", error);
    res.status(500).json({ error: "Erro ao atualizar propriedade" });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const affectedRows = await Property.delete(id);

    if (affectedRows === 0) {
      return res.status(404).json({ error: "Propriedade não encontrada" });
    }
    res.status(200).json({ message: "Propriedade deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar a propriedade", error);
    res.status(500).json({ message: "Erro ao deletar propriedade!" });
  }
};

const uploadPhotos = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const filePaths = files.map((file) => `/uploads/${file.filename}`);
    res.status(200).json(filePaths); // Retorna os caminhos dos arquivos
  } catch (error) {
    console.error("Erro uploading photos:", error);
    res.status(500).json({ error: "Erro during upload processing" });
  }
};
module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  upload,
  uploadPhotos,
};
