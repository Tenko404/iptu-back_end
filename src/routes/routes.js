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
import upload from "../middleware/multerConfig.js"; // IMPORT FROM THE NEW FILE
import { verifyToken, isAdmin, isStaff, isDev } from "../middleware/auth.js"; // Import the middleware
import { hasRole } from "../middleware/authUtils.js";

const router = express.Router();

// --- User Routes ---
router.post("/api/users/login", loginRequest, UserController.login); // No authentication required for login

// --- People Routes ---
router.get("/api/people/:id", verifyToken, PeopleController.getPersonById); // Requires authentication
router.get("/api/people", verifyToken, PeopleController.getAllPeople); // Requires authentication
router.put(
  "/api/people/:id",
  verifyToken,
  isDev,
  updatePersonRequest,
  PeopleController.updatePerson
); // Requires authentication AND dev role
router.delete(
  "/api/people/:id",
  verifyToken,
  isDev,
  PeopleController.deletePerson
); // Requires authentication AND dev role

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
); // Requires authentication
router.get(
  "/api/properties/:id",
  verifyToken,
  PropertyController.getPropertyById
); // Requires authentication
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
); // Requires authentication
router.delete(
  "/api/properties/:id",
  verifyToken,
  // isDev, // <<<--- REMOVE the single role check
  hasRole(["admin", "dev"]), // <<<--- ADD check for multiple roles
  PropertyController.deleteProperty
);

export default router;
