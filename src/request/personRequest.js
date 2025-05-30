import { body, param } from "express-validator";
import { isValidCPF, isValidCNPJ } from "../services/utils.js";

const createPersonRequest = [
  body("name")
    .isLength({ max: 150 })
    .withMessage("Name must be less than 150 characters")
    .notEmpty()
    .withMessage("Name is required"),
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .notEmpty()
    .withMessage("Email is required"),
  body("phone_number")
    .matches(/^\+55 \(\d{2}\) \d{4,5}-\d{4}$/)
    .withMessage("Invalid Brazilian phone number format")
    .notEmpty()
    .withMessage("Phone number is required"),
  body("document_type")
    .isIn(["CPF", "CNPJ"])
    .withMessage("Document type must be CPF or CNPJ")
    .notEmpty()
    .withMessage("Document type is required"),
  body("document")
    .notEmpty()
    .withMessage("Document is required")
    .custom((value, { req }) => {
      if (req.body.document_type === "CPF") {
        if (!isValidCPF(value)) {
          throw new Error("Invalid CPF");
        }
      } else if (req.body.document_type === "CNPJ") {
        if (!isValidCNPJ(value)) {
          throw new Error("Invalid CNPJ");
        }
      }
      return true;
    }),
];

const updatePersonRequest = [
  param("id").isInt().withMessage("Id must be an integer"),
  body("name")
    .isLength({ max: 150 })
    .withMessage("Name must be less than 150 characters")
    .optional(),
  body("email").isEmail().withMessage("Invalid email format").optional(),
  body("phone_number")
    .matches(/^\+55 \(\d{2}\) \d{4,5}-\d{4}$/)
    .withMessage("Invalid Brazilian phone number format")
    .optional(),
  body("document_type")
    .isIn(["CPF", "CNPJ"])
    .withMessage("Document type must be CPF or CNPJ")
    .optional(),
  body("document")
    .optional()
    .custom((value, { req }) => {
      if (req.body.document_type === "CPF") {
        if (!isValidCPF(value)) {
          throw new Error("Invalid CPF");
        }
      } else if (req.body.document_type === "CNPJ") {
        if (!isValidCNPJ(value)) {
          throw new Error("Invalid CNPJ");
        }
      }
      return true;
    }),
  body("residential_street")
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage("Residential street too long"),
  body("residential_house_number")
    .optional()
    .isString()
    .isLength({ max: 10 })
    .withMessage("Residential house number too long"),
  body("residential_neighborhood")
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage("Residential neighborhood too long"),
  body("residential_complement").optional().isString().isLength({ max: 50 }),
  body("residential_city")
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage("Residential city too long"),
  body("residential_state")
    .optional()
    .isString()
    .isLength({ min: 2, max: 2 })
    .withMessage("Residential state must be 2 characters"),
  body("residential_zip_code")
    .optional()
    .isString()
    .matches(/^\d{5}-\d{3}$/)
    .withMessage("Residential ZIP code invalid (e.g., 12345-678)"),
];

export { createPersonRequest, updatePersonRequest };
