// src/routes/index.js
const express = require("express");
const router = express.Router();
const propertiesController = require("../controllers/propertiesController");
const personsController = require("../controllers/personsController"); // Use new controller
const usersController = require("../controllers/usersController");
const { authenticateToken } = require("../middleware/auth");

// --- PROPERTIES ROUTES ---
router.get("/properties", propertiesController.getProperties);
router.get(
  "/properties/:id",
  authenticateToken,
  propertiesController.getPropertyById
); // Protected
router.post(
  "/properties",
  propertiesController.upload.fields([
    { name: "front_photo" },
    { name: "above_photo" },
  ]),
  propertiesController.createProperty
);
router.put(
  "/properties/:id",
  propertiesController.upload.fields([
    { name: "front_photo" },
    { name: "above_photo" },
  ]),
  propertiesController.updateProperty
);
router.delete("/properties/:id", propertiesController.deleteProperty);

// --- PERSONS ROUTES (Owners and Possessors) ---
router.get("/persons", personsController.getAllPersons); // Get all people
router.get("/persons/:id", personsController.getPersonById); // Get a person by ID
router.post("/persons", personsController.createPerson); // Create a person
router.put("/persons/:id", personsController.updatePerson); // Update a person
router.delete("/persons/:id", personsController.deletePerson); // Delete a person
router.get("/owners", personsController.getAllOwners);
router.get("/possessors", personsController.getAllPossessors);

// --- USERS ROUTES ---
router.post("/register", usersController.registerUser);
router.post("/login", usersController.loginUser);

// --- Upload Routes ---

router.post(
  "/upload",
  propertiesController.upload.array("photos", 2),
  propertiesController.uploadPhotos
);
module.exports = router;
