// ./src/Routes/routes.js
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
import { upload } from "../server.js"; //import the configured multer
import { verifyToken, isAdmin } from "../middleware/auth.js"; // Import the middleware

const router = express.Router();

// --- User Routes ---
router.post("/api/users/login", loginRequest, UserController.login); // No authentication required for login

// --- People Routes ---
router.post(
  "/api/people",
  verifyToken,
  createPersonRequest,
  PeopleController.createPerson
); // Requires authentication
router.get("/api/people/:id", verifyToken, PeopleController.getPersonById); // Requires authentication
router.get("/api/people", verifyToken, PeopleController.getAllPeople); // Requires authentication
router.put(
  "/api/people/:id",
  verifyToken,
  updatePersonRequest,
  PeopleController.updatePerson
); // Requires authentication
router.delete("/api/people/:id", verifyToken, PeopleController.deletePerson); // Requires authentication

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
  PropertyController.deleteProperty
); // Requires authentication

export default router;
