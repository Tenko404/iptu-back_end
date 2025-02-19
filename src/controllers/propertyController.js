import * as PropertyService from "../services/propertyService.js";
import { validationResult } from "express-validator";

export const createProperty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Access uploaded file paths (if files were uploaded)
    const frontPhotoPath = req.files["front_photo"]
      ? `/uploads/${req.files["front_photo"][0].filename}`
      : null;
    const abovePhotoPath = req.files["above_photo"]
      ? `/uploads/${req.files["above_photo"][0].filename}`
      : null;

    const propertyData = {
      ...req.body,
      front_photo: frontPhotoPath, // Add to propertyData
      above_photo: abovePhotoPath, // Add to propertyData
    };

    const newProperty = await PropertyService.createProperty(propertyData);
    res
      .status(201)
      .json({ message: "Propriedade criada com sucesso!", id: newProperty.id });
  } catch (error) {
    console.error("Erro em createProperty controller:", error);
    if (error.code === "ER_DUP_ENTRY") {
      //Handle duplicate property registration number
      res.status(409).json({
        message: "Uma propriedade com esse registro já existe.",
      });
    } else if (error.message === "One or more owners not found") {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
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
    console.error("Erro em getPropertyById controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//get all properties
export const getAllProperties = async (req, res) => {
  try {
    const properties = await PropertyService.getAllProperties(req.query);
    res.status(200).json(properties);
  } catch (error) {
    console.error("Erro em getAllProperties controller: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProperty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const propertyId = req.params.id;

    // Access uploaded file paths (if files were uploaded)
    const frontPhotoPath = req.files["front_photo"]
      ? `/uploads/${req.files["front_photo"][0].filename}`
      : null;
    const abovePhotoPath = req.files["above_photo"]
      ? `/uploads/${req.files["above_photo"][0].filename}`
      : null;

    const propertyData = {
      ...req.body,
      front_photo: frontPhotoPath, // Add to propertyData
      above_photo: abovePhotoPath, // Add to propertyData
    };

    const updatedProperty = await PropertyService.updateProperty(
      propertyId,
      propertyData
    );

    res.status(200).json({ message: "Propriedade atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro em updateProperty controller:", error);
    if (error.code === "ER_DUP_ENTRY") {
      // Handle duplicate property registration number
      res.status(409).json({
        message: "Uma propriedade com esse registro já existe.",
      });
    } else if (error.message === "Property not found") {
      res.status(404).json({ message: "Property not found" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const deleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    await PropertyService.deleteProperty(propertyId);

    res.status(200).json({ message: "Propriedade deletada com sucesso!" });
  } catch (error) {
    console.error("Erro em deleteProperty controller: ", error);
    if (error.message === "Propriedade não encontrada") {
      res.status(404).json({ message: "Propriedade não encontrada" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
