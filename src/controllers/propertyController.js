// ./src/Controllers/PropertyController.js
import * as PropertyService from "../Services/PropertyService.js";
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
      .json({ message: "Property created successfully", id: newProperty.id });
  } catch (error) {
    console.error("Error in createProperty controller:", error);
    if (error.code === "ER_DUP_ENTRY") {
      //Handle duplicate property registration number
      res
        .status(409)
        .json({
          message: "A property with this registration number already exists.",
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
      return res.status(404).json({ message: "Property not found" });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error("Error in getPropertyById controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//get all properties
export const getAllProperties = async (req, res) => {
  try {
    const properties = await PropertyService.getAllProperties(req.query);
    res.status(200).json(properties);
  } catch (error) {
    console.error("Error in getAllProperties controller: ", error);
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

    res.status(200).json({ message: "Property updated successfully" });
  } catch (error) {
    console.error("Error in updateProperty controller:", error);
    if (error.code === "ER_DUP_ENTRY") {
      // Handle duplicate property registration number
      res
        .status(409)
        .json({
          message: "A property with this registration number already exists.",
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

    res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Error in deleteProperty controller: ", error);
    if (error.message === "Property not found") {
      res.status(404).json({ message: "Property not found" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
