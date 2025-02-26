import { body, param } from "express-validator";
import { isValidCPF, isValidCNPJ } from "../services/utils.js";

const createPropertyRequest = [
  // --- Property Address ---
  body("street")
    .isLength({ max: 150 })
    .withMessage("Street must be less than 150 characters")
    .notEmpty()
    .withMessage("Street is required"),
  body("house_number")
    .isLength({ max: 10 })
    .withMessage("House number must be less than 10 characters")
    .notEmpty()
    .withMessage("House number is required"),
  body("neighborhood")
    .isLength({ max: 100 })
    .withMessage("Neighborhood must be less than 100 characters")
    .notEmpty()
    .withMessage("Neighborhood is required"),
  body("complement")
    .isLength({ max: 100 })
    .withMessage("Complement must be less than 100 characters")
    .optional(),

  // --- Property Information ---
  body("property_registration")
    .isInt()
    .withMessage("Property registration must be a number")
    .isLength({ min: 6, max: 6 })
    .withMessage("Property registration must have 6 digits")
    .notEmpty()
    .withMessage("Property registration is required"),
  body("tax_type")
    .isIn(["residential", "commercial", "mixed", "territorial"])
    .withMessage("Invalid tax type")
    .notEmpty()
    .withMessage("Tax type is required"),
  body("land_area")
    .isFloat()
    .withMessage("Land area must be a number")
    .notEmpty()
    .withMessage("Land area is required"),
  body("built_area")
    .isFloat()
    .withMessage("Built area must be a number")
    .notEmpty()
    .withMessage("Built area is required"),
  body("front_photo").optional(),
  body("above_photo").optional(),

  // --- Owner Information ---
  body("owner.name")
    .isLength({ max: 150 })
    .withMessage("Owner name must be less than 150 characters")
    .notEmpty()
    .withMessage("Owner name is required"),
  body("owner.email")
    .isEmail()
    .withMessage("Invalid owner email format")
    .notEmpty()
    .withMessage("Owner email is required"),
  body("owner.phone_number")
    .matches(/^\+55 \(\d{2}\) \d{4,5}-\d{4}$/)
    .withMessage("Invalid owner phone number format")
    .notEmpty()
    .withMessage("Owner phone number is required"),
  body("owner.document_type")
    .isIn(["CPF", "CNPJ"])
    .withMessage("Owner document type must be CPF or CNPJ")
    .notEmpty()
    .withMessage("Owner document type is required"),
  body("owner.document")
    .notEmpty()
    .withMessage("Owner document is required")
    .custom((value, { req }) => {
      if (req.body.owner.document_type === "CPF") {
        if (!isValidCPF(value)) {
          throw new Error("Invalid CPF");
        }
      } else if (req.body.owner.document_type === "CNPJ") {
        if (!isValidCNPJ(value)) {
          throw new Error("Invalid CNPJ");
        }
      }
      return true;
    }),

  // --- Possessor/Executor Information (Conditional) ---
  // These validations are tricky with express-validator.  We'll do basic
  // presence/type checks here, and more robust conditional logic in the controller.
  body("possessor.name")
    .if(body("possessor").exists())
    .isLength({ max: 150 })
    .withMessage("Possessor name must be less than 150 characters")
    .notEmpty()
    .withMessage("Possessor name is required"),
  body("possessor.email")
    .if(body("possessor").exists())
    .isEmail()
    .withMessage("Invalid possessor email format")
    .notEmpty()
    .withMessage("Possessor email is required"),
  body("possessor.phone_number")
    .if(body("possessor").exists())
    .matches(/^\+55 \(\d{2}\) \d{4,5}-\d{4}$/)
    .withMessage("Invalid possessor phone number format")
    .notEmpty()
    .withMessage("Possessor phone number is required"),
  body("possessor.document_type")
    .if(body("possessor").exists())
    .isIn(["CPF", "CNPJ"])
    .withMessage("Possessor document type must be CPF or CNPJ")
    .notEmpty()
    .withMessage("Possessor document type is required"),
  body("possessor.document")
    .if(body("possessor").exists())
    .custom((value, { req }) => {
      if (req.body.possessor.document_type === "CPF") {
        if (!isValidCPF(value)) {
          throw new Error("Invalid CPF");
        }
      } else if (req.body.possessor.document_type === "CNPJ") {
        if (!isValidCNPJ(value)) {
          throw new Error("Invalid CNPJ");
        }
      }
      return true;
    }),
  body("possessor.relationship_type")
    .if(body("possessor").exists())
    .isIn(["possessor", "executor"])
    .withMessage("Invalid relationship type")
    .notEmpty()
    .withMessage("You must select between possessor and executor"),

  body("executor.name")
    .if(body("executor").exists())
    .isLength({ max: 150 })
    .withMessage("Executor name must be less than 150 characters")
    .notEmpty()
    .withMessage("Executor name is required"),
  body("executor.email")
    .if(body("executor").exists())
    .isEmail()
    .withMessage("Invalid executor email format")
    .notEmpty()
    .withMessage("Executor email is required"),
  body("executor.phone_number")
    .if(body("executor").exists())
    .matches(/^\+55 \(\d{2}\) \d{4,5}-\d{4}$/)
    .withMessage("Invalid executor phone number format")
    .notEmpty()
    .withMessage("Executor phone number is required"),
  body("executor.document_type")
    .if(body("executor").exists())
    .isIn(["CPF", "CNPJ"])
    .withMessage("Executor document type must be CPF or CNPJ")
    .notEmpty()
    .withMessage("Executor document type is required"),
  body("executor.document")
    .if(body("executor").exists())
    .custom((value, { req }) => {
      if (req.body.executor.document_type === "CPF") {
        if (!isValidCPF(value)) {
          throw new Error("Invalid CPF");
        }
      } else if (req.body.executor.document_type === "CNPJ") {
        if (!isValidCNPJ(value)) {
          throw new Error("Invalid CNPJ");
        }
      }
      return true;
    }),
  body("executor.relationship_type")
    .if(body("executor").exists())
    .isIn(["possessor", "executor"])
    .withMessage("Invalid relationship type")
    .notEmpty()
    .withMessage("You must select between possessor and executor"),
];

const updatePropertyRequest = [
  param("id").isInt().withMessage("Invalid property ID"),
  body("street")
    .isLength({ max: 150 })
    .withMessage("Street must be less than 150 characters")
    .optional(),
  body("house_number")
    .isLength({ max: 10 })
    .withMessage("House number must be less than 10 characters")
    .optional(),
  body("neighborhood")
    .isLength({ max: 100 })
    .withMessage("Neighborhood must be less than 100 characters")
    .optional(),
  body("complement")
    .isLength({ max: 100 })
    .withMessage("Complement must be less than 100 characters")
    .optional(),
  body("property_registration")
    .isInt()
    .withMessage("Property registration must be a number")
    .isLength({ min: 6, max: 6 })
    .withMessage("Property registration must have 6 digits")
    .optional(),
  body("tax_type")
    .isIn(["residential", "commercial", "mixed", "territorial"])
    .withMessage("Invalid tax type")
    .optional(),
  body("land_area")
    .isFloat()
    .withMessage("Land area must be a number")
    .optional(),
  body("built_area")
    .isFloat()
    .withMessage("Built area must be a number")
    .optional(),
  body("front_photo").optional(),
  body("above_photo").optional(),
  body("owner.name")
    .isLength({ max: 150 })
    .withMessage("Owner name must be less than 150 characters")
    .optional(),
  body("owner.email")
    .isEmail()
    .withMessage("Invalid owner email format")
    .optional(),
  body("owner.phone_number")
    .matches(/^\+55 \(\d{2}\) \d{4,5}-\d{4}$/)
    .withMessage("Invalid owner phone number format")
    .optional(),
  body("owner.document_type")
    .isIn(["CPF", "CNPJ"])
    .withMessage("Owner document type must be CPF or CNPJ")
    .optional(),
  body("owner.document")
    .optional()
    .custom((value, { req }) => {
      if (req.body.owner && req.body.owner.document_type === "CPF") {
        if (!isValidCPF(value)) {
          throw new Error("Invalid CPF");
        }
      } else if (req.body.owner && req.body.owner.document_type === "CNPJ") {
        if (!isValidCNPJ(value)) {
          throw new Error("Invalid CNPJ");
        }
      }
      return true;
    }),
  body("possessor.name")
    .if(body("possessor").exists())
    .isLength({ max: 150 })
    .withMessage("Possessor name must be less than 150 characters")
    .notEmpty()
    .withMessage("Possessor name is required")
    .optional(),
  body("possessor.email")
    .if(body("possessor").exists())
    .isEmail()
    .withMessage("Invalid possessor email format")
    .notEmpty()
    .withMessage("Possessor email is required")
    .optional(),
  body("possessor.phone_number")
    .if(body("possessor").exists())
    .matches(/^\+55 \(\d{2}\) \d{4,5}-\d{4}$/)
    .withMessage("Invalid possessor phone number format")
    .notEmpty()
    .withMessage("Possessor phone number is required")
    .optional(),
  body("possessor.document_type")
    .if(body("possessor").exists())
    .isIn(["CPF", "CNPJ"])
    .withMessage("Possessor document type must be CPF or CNPJ")
    .notEmpty()
    .withMessage("Possessor document type is required")
    .optional(),
  body("possessor.document")
    .if(body("possessor").exists())
    .optional()
    .custom((value, { req }) => {
      if (req.body.possessor.document_type === "CPF") {
        if (!isValidCPF(value)) {
          throw new Error("Invalid CPF");
        }
      } else if (req.body.possessor.document_type === "CNPJ") {
        if (!isValidCNPJ(value)) {
          throw new Error("Invalid CNPJ");
        }
      }
      return true;
    }),
  body("possessor.relationship_type")
    .if(body("possessor").exists())
    .isIn(["possessor", "executor"])
    .withMessage("Invalid relationship type")
    .notEmpty()
    .withMessage("You must select between possessor and executor")
    .optional(),

  body("executor.name")
    .if(body("executor").exists())
    .isLength({ max: 150 })
    .withMessage("Executor name must be less than 150 characters")
    .notEmpty()
    .withMessage("Executor name is required")
    .optional(),
  body("executor.email")
    .if(body("executor").exists())
    .isEmail()
    .withMessage("Invalid executor email format")
    .notEmpty()
    .withMessage("Executor email is required")
    .optional(),
  body("executor.phone_number")
    .if(body("executor").exists())
    .matches(/^\+55 \(\d{2}\) \d{4,5}-\d{4}$/)
    .withMessage("Invalid executor phone number format")
    .notEmpty()
    .withMessage("Executor phone number is required")
    .optional(),
  body("executor.document_type")
    .if(body("executor").exists())
    .isIn(["CPF", "CNPJ"])
    .withMessage("Executor document type must be CPF or CNPJ")
    .notEmpty()
    .withMessage("Executor document type is required")
    .optional(),
  body("executor.document")
    .if(body("executor").exists())
    .optional()
    .custom((value, { req }) => {
      if (req.body.executor.document_type === "CPF") {
        if (!isValidCPF(value)) {
          throw new Error("Invalid CPF");
        }
      } else if (req.body.executor.document_type === "CNPJ") {
        if (!isValidCNPJ(value)) {
          throw new Error("Invalid CNPJ");
        }
      }
      return true;
    }),
  body("executor.relationship_type")
    .if(body("executor").exists())
    .isIn(["possessor", "executor"])
    .withMessage("Invalid relationship type")
    .notEmpty()
    .withMessage("You must select between possessor and executor")
    .optional(),
];

export { createPropertyRequest, updatePropertyRequest };
