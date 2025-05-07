import express from "express";
import * as UserController from "../controllers/userController.js";
import * as PeopleController from "../controllers/peopleController.js";
import * as PropertyController from "../controllers/propertyController.js";
import { loginRequest } from "../request/userRequest.js";
import {
  createPersonRequest,
  updatePersonRequest,
} from "../request/personRequest.js";
import {
  createPropertyRequest,
  updatePropertyRequest,
} from "../request/propertyRequest.js";
import upload from "../middleware/multerConfig.js";
import { verifyToken, isAdmin, isStaff, isDev } from "../middleware/auth.js";
import { hasRole } from "../middleware/authUtils.js";

const router = express.Router();

// --- User Routes ---
router.post("/api/users/login", loginRequest, UserController.login);

// --- People Routes ---
router.get("/api/people/:id", verifyToken, PeopleController.getPersonById);
router.get("/api/people", verifyToken, PeopleController.getAllPeople);

router.put(
  "/api/people/:id",
  verifyToken,
  hasRole(["admin", "dev"]),
  updatePersonRequest,
  PeopleController.updatePerson
);
/*
router.delete(
  "/api/people/:id",
  verifyToken,
  hasRole(["admin", "dev"]),
  PeopleController.deletePerson
);
*/
// --- Property Routes ---
router.post(
  "/api/properties",
  verifyToken,
  upload.fields([
    { name: "front_photo", maxCount: 1 },
    { name: "above_photo", maxCount: 1 },
  ]),
  createPropertyRequest,
  PropertyController.createProperty
);
router.get(
  "/api/properties/:id",
  verifyToken,
  PropertyController.getPropertyById
);
router.get("/api/properties", verifyToken, PropertyController.getAllProperties); // Requires authentication
router.put(
  "/api/properties/:id",
  verifyToken,
  upload.fields([
    { name: "front_photo", maxCount: 1 },
    { name: "above_photo", maxCount: 1 },
  ]),
  updatePropertyRequest,
  PropertyController.updateProperty
);
router.delete(
  "/api/properties/:id",
  verifyToken,
  hasRole(["admin", "dev"]),
  PropertyController.deleteProperty
);

export default router;
