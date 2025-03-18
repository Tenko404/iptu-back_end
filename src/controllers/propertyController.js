import * as PropertyService from "../services/propertyService.js";
import * as PropertyModel from "../models/property.js"; // Import PropertyModel
import { validationResult } from "express-validator";
import { isValidCPF, isValidCNPJ } from "../services/utils.js"; // Import validation functions

export const createProperty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // --- CPF/CNPJ Validation (Moved to Controller) ---
    if (req.body.owner?.document_type === "CPF") {
      if (!isValidCPF(req.body.owner.document)) {
        return res.status(400).json({ message: "Invalid CPF" });
      }
    } else if (req.body.owner?.document_type === "CNPJ") {
      if (!isValidCNPJ(req.body.owner.document)) {
        return res.status(400).json({ message: "Invalid CNPJ" });
      }
    }

    // --- Conditional Validation for Possessor/Executor
    if (req.body.possessor) {
      if (req.body.possessor.document_type === "CPF") {
        if (!isValidCPF(req.body.possessor.document)) {
          return res.status(400).json({ message: "Invalid CPF" });
        }
      } else if (req.body.possessor.document_type === "CNPJ") {
        if (!isValidCNPJ(req.body.possessor.document)) {
          return res.status(400).json({ message: "Invalid CNPJ" });
        }
      }
    }

    if (req.body.executor) {
      if (req.body.executor.document_type === "CPF") {
        if (!isValidCPF(req.body.executor.document)) {
          return res.status(400).json({ message: "Invalid CPF" });
        }
      } else if (req.body.executor.document_type === "CNPJ") {
        if (!isValidCNPJ(req.body.executor.document)) {
          return res.status(400).json({ message: "Invalid CNPJ" });
        }
      }
    }

    const frontPhotoPath =
      req.files && req.files["front_photo"]
        ? `/uploads/${req.files["front_photo"][0].filename}`
        : null;
    const abovePhotoPath =
      req.files && req.files["above_photo"]
        ? `/uploads/${req.files["above_photo"][0].filename}`
        : null;

    const propertyData = {
      ...req.body,
      front_photo: frontPhotoPath,
      above_photo: abovePhotoPath,
    };

    const newProperty = await PropertyService.createProperty(propertyData);
    res.status(201).json({
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
      statusCode = 409;
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
// PRESTENSAOOOOOOOOOOOOOOOOOOOOOOOOOOOO
export const updateProperty = async (req, res) => {
  console.log("--- updateProperty (Controller) ---");
  console.log("1. req.params:", req.params);
  console.log("2. req.body:", req.body);
  const propertyId = req.params.id;
  console.log("4. propertyId:", propertyId);

  // --- Controller-Side Existence Check (Your Friend's Suggestion) ---
  try {
    const propertyExists = await PropertyModel.propertyExists(propertyId);
    if (!propertyExists) {
      console.log("Property does not exist (Controller Check)");
      return res.status(404).json({ message: "Propriedade não encontrada" });
    }
  } catch (error) {
    console.error("Error checking property existence:", error);
    return res
      .status(500)
      .json({ message: "Erro ao verificar existência da propriedade." });
  }

  console.log("Property exists (Controller Check), proceeding...");

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("3. Validation Errors:", errors.array()); // ADDED
      return res.status(400).json({ errors: errors.array() });
    }
    const propertyId = req.params.id;
    console.log("4. propertyId:", propertyId); // ADDED

    if (Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: "Request body cannot be empty for a PUT request." });
    }

    // --- CPF/CNPJ Validation (Moved to Controller) ---
    if (req.body.owner?.document_type === "CPF") {
      console.log("5. Checking CPF:", req.body.owner.document); // ADDED
      // Use optional chaining here OR MAYBE REMOVE ?????
      if (!isValidCPF(req.body.owner.document)) {
        return res.status(400).json({ message: "Invalid CPF" });
      }
    } else if (req.body.owner?.document_type === "CNPJ") {
      console.log("6. Checking CNPJ:", req.body.owner.document); // ADDED
      // Use optional chaining here OR MAYBE REMOVE ?????
      if (!isValidCNPJ(req.body.owner.document)) {
        return res.status(400).json({ message: "Invalid CNPJ" });
      }
    }

    // --- Conditional Validation for Possessor/Executor
    if (req.body.possessor) {
      if (req.body.possessor.document_type === "CPF") {
        if (!isValidCPF(req.body.possessor.document)) {
          return res.status(400).json({ message: "Invalid CPF" });
        }
      } else if (req.body.possessor.document_type === "CNPJ") {
        if (!isValidCNPJ(req.body.possessor.document)) {
          return res.status(400).json({ message: "Invalid CNPJ" });
        }
      }
    }

    if (req.body.executor) {
      if (req.body.executor.document_type === "CPF") {
        if (!isValidCPF(req.body.executor.document)) {
          return res.status(400).json({ message: "Invalid CPF" });
        }
      } else if (req.body.executor.document_type === "CNPJ") {
        if (!isValidCNPJ(req.body.executor.document)) {
          return res.status(400).json({ message: "Invalid CNPJ" });
        }
      }
    }
    const frontPhotoPath = req.files?.["front_photo"]
      ? `/uploads/${req.files["front_photo"][0].filename}`
      : null;
    const abovePhotoPath = req.files?.["above_photo"]
      ? `/uploads/${req.files["above_photo"][0].filename}`
      : null;

    const propertyData = {
      ...req.body,
      front_photo: frontPhotoPath,
      above_photo: abovePhotoPath,
    };

    console.log(
      "7. Calling PropertyService.updateProperty with propertyData:",
      propertyData
    ); // ADDED

    const updatedProperty = await PropertyService.updateProperty(
      propertyId,
      propertyData
    );

    console.log("8. updateProperty service returned:", updatedProperty); // ADDED

    res.status(200).json({
      message: "Propriedade atualizada com sucesso!",
      property: updatedProperty,
    }); // Return the updated object
  } catch (error) {
    console.error("9. Error in updateProperty controller:", error); // ADDED ERROR NUMBER
    let statusCode = 500;
    let message = "Erro interno do servidor.";

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
      statusCode = 409;
      message = error.message;
    } else if (error.code === "ER_DUP_ENTRY") {
      statusCode = 409;
      message = "Já existe uma propriedade com este número de inscrição.";
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
