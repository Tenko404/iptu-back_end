import * as PropertyService from "../services/propertyService.js";
import { validationResult } from "express-validator";

export const createProperty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const frontPhotoPath = req.files["front_photo"]
      ? `/uploads/${req.files["front_photo"][0].filename}`
      : null;
    const abovePhotoPath = req.files["above_photo"]
      ? `/uploads/${req.files["above_photo"][0].filename}`
      : null;

    const propertyData = {
      ...req.body,
      front_photo: frontPhotoPath,
      above_photo: abovePhotoPath,
    };

    const newProperty = await PropertyService.createProperty(propertyData);
    res
      .status(201)
      .json({
        message: "Propriedade criada com sucesso!",
        property: newProperty,
      }); // Return the created property object
  } catch (error) {
    console.error("Error in createProperty controller:", error);
    let statusCode = 500;
    let message = "Erro interno do servidor.";

    // More specific error handling.
    if (error.message.startsWith("Invalid owner ID")) {
      statusCode = 400;
      message = error.message;
    } else if (error.message === "Invalid possessor ID") {
      statusCode = 400;
      message = error.message;
    } else if (error.message === "Invalid executor ID") {
      statusCode = 400;
      message = error.message;
    } else if (
      error.message === "Já existe uma pessoa cadastrada com este documento."
    ) {
      //from PeopleService
      statusCode = 409; //Conflict
      message = error.message;
    } else if (error.code === "ER_DUP_ENTRY") {
      statusCode = 409;
      message = "Já existe uma propriedade com este número de inscrição.";
    }
    res.status(statusCode).json({ message });
  }
};

export const getPropertyById = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const property = await PropertyService.getPropertyById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Propriedade não encontrada" });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error("Error in getPropertyById controller:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const getAllProperties = async (req, res) => {
  try {
    const properties = await PropertyService.getAllProperties(req.query); // Keep req.query for potential future use (filtering, etc.)
    res.status(200).json(properties);
  } catch (error) {
    console.error("Erro em getAllProperties controller: ", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const updateProperty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const propertyId = req.params.id;

    const frontPhotoPath = req.files["front_photo"]
      ? `/uploads/${req.files["front_photo"][0].filename}`
      : null;
    const abovePhotoPath = req.files["above_photo"]
      ? `/uploads/${req.files["above_photo"][0].filename}`
      : null;

    const propertyData = {
      ...req.body,
      front_photo: frontPhotoPath,
      above_photo: abovePhotoPath,
    };

    const updatedProperty = await PropertyService.updateProperty(
      //changed to reflect service
      propertyId,
      propertyData
    );

    res
      .status(200)
      .json({
        message: "Propriedade atualizada com sucesso!",
        property: updatedProperty,
      }); // Return the updated object
  } catch (error) {
    console.error("Error in updateProperty controller:", error);
    let statusCode = 500;
    let message = "Erro interno do servidor.";

    // More specific error handling.
    if (error.message.startsWith("Invalid owner ID")) {
      statusCode = 400;
      message = error.message;
    } else if (error.message === "Invalid possessor ID") {
      statusCode = 400;
      message = error.message;
    } else if (error.message === "Invalid executor ID") {
      statusCode = 400;
      message = error.message;
    } else if (
      error.message === "Já existe uma pessoa cadastrada com este documento."
    ) {
      //from PeopleService
      statusCode = 409; //Conflict
      message = error.message;
    } else if (error.code === "ER_DUP_ENTRY") {
      statusCode = 409;
      message = "Já existe uma propriedade com este número de inscrição.";
    } else if (error.message === "Propriedade não encontrada") {
      statusCode = 404;
      message = error.message;
    }
    res.status(statusCode).json({ message });
  }
};

export const deleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    await PropertyService.deleteProperty(propertyId);

    res.status(200).json({ message: "Propriedade excluída com sucesso!" });
  } catch (error) {
    console.error("Error in deleteProperty controller: ", error);
    if (error.message === "Propriedade não encontrada") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
};
