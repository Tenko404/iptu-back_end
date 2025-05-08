import * as PropertyService from "../services/propertyService.js";
import * as PropertyModel from "../models/property.js";
import { validationResult } from "express-validator";
import { isValidCPF, isValidCNPJ } from "../services/utils.js";
import { unflatten } from "flat";

export const createProperty = async (req, res) => {
  const unflattenedBody = unflatten(req.body || {});

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // --- CPF/CNPJ Validation ---
    if (unflattenedBody.owner?.document_type === "CPF") {
      if (!isValidCPF(unflattenedBody.owner.document)) {
        return res.status(400).json({ message: "Invalid CPF" });
      }
    } else if (unflattenedBody.owner?.document_type === "CNPJ") {
      if (!isValidCNPJ(unflattenedBody.owner.document)) {
        return res.status(400).json({ message: "Invalid CNPJ" });
      }
    }

    // --- Conditional Validation for Possessor/Executor ---
    if (unflattenedBody.possessor) {
      if (unflattenedBody.possessor.document_type === "CPF") {
        if (!isValidCPF(unflattenedBody.possessor.document)) {
          return res.status(400).json({ message: "Invalid Possessor CPF" });
        }
      } else if (unflattenedBody.possessor.document_type === "CNPJ") {
        if (!isValidCNPJ(unflattenedBody.possessor.document)) {
          return res.status(400).json({ message: "Invalid Possessor CNPJ" });
        }
      }
    }

    if (unflattenedBody.executor) {
      if (unflattenedBody.executor.document_type === "CPF") {
        if (!isValidCPF(unflattenedBody.executor.document)) {
          return res.status(400).json({ message: "Invalid Executor CPF" });
        }
      } else if (unflattenedBody.executor.document_type === "CNPJ") {
        if (!isValidCNPJ(unflattenedBody.executor.document)) {
          return res.status(400).json({ message: "Invalid Executor CNPJ" });
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
      ...unflattenedBody,
      front_photo: frontPhotoPath,
      above_photo: abovePhotoPath,
    };

    const newProperty = await PropertyService.createProperty(propertyData);
    res.status(201).json({
      message: "Propriedade criada com sucesso!",
      property: newProperty,
    });
  } catch (error) {
    console.error("Error in createProperty controller:", error);
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
    if (error.message === "Propriedade não encontrada") {
      return res.status(404).json({ message: "Propriedade não encontrada" });
    }
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const getAllProperties = async (req, res) => {
  try {
    const properties = await PropertyService.getAllProperties(req.query);
    res.status(200).json(properties);
  } catch (error) {
    console.error("Erro em getAllProperties controller: ", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const updateProperty = async (req, res) => {
  const propertyId = req.params.id;

  const unflattenedBody = unflatten(req.body || {});

  // --- Controller-Side Existence Check ---
  /*
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
*/

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    //const propertyId = req.params.id;

    if (Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: "Request body cannot be empty for a PUT request." });
    }

    // --- CPF/CNPJ Validation ---
    if (unflattenedBody.owner?.document_type === "CPF") {
      if (!isValidCPF(unflattenedBody.owner.document)) {
        return res.status(400).json({ message: "Invalid CPF" });
      }
    } else if (unflattenedBody.owner?.document_type === "CNPJ") {
      if (!isValidCNPJ(unflattenedBody.owner.document)) {
        return res.status(400).json({ message: "Invalid CNPJ" });
      }
    }

    // --- Conditional Validation for Possessor/Executor ---
    if (unflattenedBody.possessor) {
      if (unflattenedBody.possessor.document_type === "CPF") {
        if (!isValidCPF(unflattenedBody.possessor.document)) {
          return res.status(400).json({ message: "Invalid Possessor CPF" });
        }
      } else if (unflattenedBody.possessor.document_type === "CNPJ") {
        if (!isValidCNPJ(unflattenedBody.possessor.document)) {
          return res.status(400).json({ message: "Invalid Possessor CNPJ" });
        }
      }
    }

    if (unflattenedBody.executor) {
      if (unflattenedBody.executor.document_type === "CPF") {
        if (!isValidCPF(unflattenedBody.executor.document)) {
          return res.status(400).json({ message: "Invalid Executor CPF" });
        }
      } else if (unflattenedBody.executor.document_type === "CNPJ") {
        if (!isValidCNPJ(unflattenedBody.executor.document)) {
          return res.status(400).json({ message: "Invalid Executor CNPJ" });
        }
      }
    }

    let frontPhotoPath = undefined;
    if (req.files?.["front_photo"]) {
      frontPhotoPath = `/uploads/${req.files["front_photo"][0].filename}`;
    } else if (
      req.body.front_photo === null ||
      req.body.front_photo === "null"
    ) {
      frontPhotoPath = null;
    }

    let abovePhotoPath = undefined;
    if (req.files?.["above_photo"]) {
      abovePhotoPath = `/uploads/${req.files["above_photo"][0].filename}`;
    } else if (
      req.body.above_photo === null ||
      req.body.above_photo === "null"
    ) {
      abovePhotoPath = null;
    }

    const propertyData = {
      ...unflattenedBody,
      front_photo: frontPhotoPath,
      above_photo: abovePhotoPath,
    };

    const updatedProperty = await PropertyService.updateProperty(
      propertyId,
      propertyData
    );

    res.status(200).json({
      message: "Propriedade atualizada com sucesso!",
      property: updatedProperty,
    });
  } catch (error) {
    console.error("9. Error in updateProperty controller:", error);
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
    return res.status(statusCode).json({ message });
  }
};

export const deleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    await PropertyService.deleteProperty(propertyId);

    res.status(200).json({ message: "Property deleted successfully!" });
  } catch (error) {
    console.error("Error in deleteProperty controller:", error);
    if (error.message === "Property not found") {
      res.status(404).json({ message: "Property not found" });
    } else {
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
};
