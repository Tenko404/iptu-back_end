// ./src/Request/PropertyRequest.js
import { body, param } from "express-validator";
import { isValidCPF, isValidCNPJ } from "../Services/utils.js";
import * as PeopleService from "../Services/PeopleService.js";

const createPropertyRequest = [
  body("zip_code")
    .matches(/^\d{5}-\d{3}$/)
    .withMessage("Invalid zip code format")
    .notEmpty()
    .withMessage("Zip code is required"),
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
    .withMessage("Complement must be less than 100 characters"),
  body("city")
    .isLength({ max: 50 })
    .withMessage("City must be less than 50 characters")
    .notEmpty()
    .withMessage("City is required"),
  body("state")
    .isLength({ min: 2, max: 2 })
    .withMessage("State must be a 2-letter code")
    .notEmpty()
    .withMessage("State is required"),
  body("property_registration")
    .isInt()
    .withMessage("Property registration must be a number")
    .isLength({ min: 6, max: 6 })
    .withMessage("Property registration must have 6 digits")
    .notEmpty()
    .withMessage("Property registration is required"),
  body("tax_type")
    .isIn(["residential", "commercial", "both"])
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
  body("owner_ids")
    .notEmpty()
    .withMessage("At least one owner is required")
    .isArray()
    .withMessage("Needs to be an array")
    .custom(async (ownerIds, { req }) => {
      // Add { req } here
      // Validate each owner_id as CPF/CNPJ
      const invalidIds = [];
      for (const ownerId of ownerIds) {
        try {
          const person = await PeopleService.checkPerson(ownerId);
          if (!person) {
            invalidIds.push(ownerId);
          } else {
            if (person.document_type === "CPF") {
              if (!isValidCPF(person.document)) {
                invalidIds.push(ownerId);
              }
            } else if (person.document_type === "CNPJ") {
              if (!isValidCNPJ(person.document)) {
                invalidIds.push(ownerId);
              }
            }
          }
        } catch (error) {
          console.error(error);
          throw new Error("Error validating the owners");
        }
      }

      if (invalidIds.length > 0) {
        throw new Error(`Invalid owner IDs: ${invalidIds.join(", ")}`);
      }
      return true; // This was missing!
    }),
  body("possessor.person_id")
    .optional()
    .custom(async (personId, { req }) => {
      // Add { req } here
      if (personId) {
        try {
          const person = await PeopleService.checkPerson(personId);
          if (!person) {
            throw new Error("Invalid possessor ID");
          } else {
            if (person.document_type === "CPF") {
              if (!isValidCPF(person.document)) {
                throw new Error("Invalid possessor ID");
              }
            } else if (person.document_type === "CNPJ") {
              if (!isValidCNPJ(person.document)) {
                throw new Error("Invalid possessor ID");
              }
            }
          }
        } catch (error) {
          console.error(error);
          throw new Error("Error validating the possessor");
        }
      }
      return true; // This was missing!
    }),
  body("possessor.description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Possessor description must be less than 500 characters"),

  body("executor.person_id")
    .optional()
    .custom(async (personId, { req }) => {
      // Add { req } here
      if (personId) {
        try {
          const person = await PeopleService.checkPerson(personId);
          if (!person) {
            throw new Error("Invalid executor ID");
          } else {
            if (person.document_type === "CPF") {
              if (!isValidCPF(person.document)) {
                throw new Error("Invalid executor ID");
              }
            } else if (person.document_type === "CNPJ") {
              if (!isValidCNPJ(person.document)) {
                throw new Error("Invalid executor ID");
              }
            }
          }
        } catch (error) {
          console.error(error);
          throw new Error("Error validating the executor");
        }
      }
      return true; // This was missing!
    }),
  body("executor.description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Executor description must be less than 500 characters"),
];

const updatePropertyRequest = [
  param("id").isInt().withMessage("Invalid property ID"),
  body("zip_code")
    .matches(/^\d{5}-\d{3}$/)
    .withMessage("Invalid zip code format")
    .optional(),
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
  body("city")
    .isLength({ max: 50 })
    .withMessage("City must be less than 50 characters")
    .optional(),
  body("state")
    .isLength({ min: 2, max: 2 })
    .withMessage("State must be a 2-letter code")
    .optional(),
  body("property_registration")
    .isInt()
    .withMessage("Property registration must be a number")
    .isLength({ min: 6, max: 6 })
    .withMessage("Property registration must have 6 digits")
    .optional(),
  body("tax_type")
    .isIn(["residential", "commercial", "both"])
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
  body("owner_ids")
    .optional()
    .isArray()
    .withMessage("Needs to be an array")
    .custom(async (ownerIds, { req }) => {
      //add {req}
      if (ownerIds && ownerIds.length > 0) {
        // Check if ownerIds exists and has elements
        const invalidIds = [];
        for (const ownerId of ownerIds) {
          try {
            const person = await PeopleService.checkPerson(ownerId);
            if (!person) {
              invalidIds.push(ownerId);
            } else {
              if (person.document_type === "CPF") {
                if (!isValidCPF(person.document)) {
                  invalidIds.push(ownerId);
                }
              } else if (person.document_type === "CNPJ") {
                if (!isValidCNPJ(person.document)) {
                  invalidIds.push(ownerId);
                }
              }
            }
          } catch (error) {
            console.error(error);
            throw new Error("Error validating the owners");
          }
        }

        if (invalidIds.length > 0) {
          throw new Error(`Invalid owner IDs: ${invalidIds.join(", ")}`);
        }
      }
      return true; // This was missing!
    }),
  body("possessor.person_id")
    .optional()
    .custom(async (personId, { req }) => {
      // Add { req } here
      if (personId) {
        try {
          const person = await PeopleService.checkPerson(personId);
          if (!person) {
            throw new Error("Invalid possessor ID");
          } else {
            if (person.document_type === "CPF") {
              if (!isValidCPF(person.document)) {
                throw new Error("Invalid possessor ID");
              }
            } else if (person.document_type === "CNPJ") {
              if (!isValidCNPJ(person.document)) {
                throw new Error("Invalid possessor ID");
              }
            }
          }
        } catch (error) {
          console.error(error);
          throw new Error("Error validating the possessor");
        }
      }
      return true; // This was missing!
    }),
  body("possessor.description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Possessor description must be less than 500 characters"),

  body("executor.person_id")
    .optional()
    .custom(async (personId, { req }) => {
      // Add { req } here
      if (personId) {
        try {
          const person = await PeopleService.checkPerson(personId);
          if (!person) {
            throw new Error("Invalid executor ID");
          } else {
            if (person.document_type === "CPF") {
              if (!isValidCPF(person.document)) {
                throw new Error("Invalid executor ID");
              }
            } else if (person.document_type === "CNPJ") {
              if (!isValidCNPJ(person.document)) {
                throw new Error("Invalid executor ID");
              }
            }
          }
        } catch (error) {
          console.error(error);
          throw new Error("Error validating the executor");
        }
      }
      return true; // This was missing!
    }),
  body("executor.description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Executor description must be less than 500 characters"),
];

export { createPropertyRequest, updatePropertyRequest };
