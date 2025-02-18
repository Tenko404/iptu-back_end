// ./src/Routes/routes.js
import express from "express";
import * as UserController from "../Controllers/UserController.js";
import * as PeopleController from "../Controllers/PeopleController.js";
import * as PropertyController from "../Controllers/PropertyController.js";
import { loginRequest } from "../Request/UserRequest.js";
import { createPersonRequest } from "../Request/PersonRequest.js";
import {
  createPropertyRequest,
  updatePropertyRequest,
} from "../Request/PropertyRequest.js";
import { upload } from "../server.js"; //import the configured multer

const router = express.Router();

// --- User Routes ---
router.post("/api/users/login", loginRequest, UserController.login);

// --- People Routes ---
router.post("/api/people", createPersonRequest, PeopleController.createPerson);

// --- Property Routes ---
router.post(
  "/api/properties",
  upload.fields([
    { name: "front_photo", maxCount: 1 },
    { name: "above_photo", maxCount: 1 },
  ]),
  createPropertyRequest,
  PropertyController.createProperty
);
router.get("/api/properties/:id", PropertyController.getPropertyById);
router.get("/api/properties", PropertyController.getAllProperties);
router.put(
  "/api/properties/:id",
  upload.fields([
    { name: "front_photo", maxCount: 1 },
    { name: "above_photo", maxCount: 1 },
  ]),
  updatePropertyRequest,
  PropertyController.updateProperty
);
router.delete("/api/properties/:id", PropertyController.deleteProperty);

export default router;
