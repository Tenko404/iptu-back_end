// ./src/Request/UserRequest.js
import { body } from "express-validator";

const loginRequest = [
  body("employee_id")
    .isInt({ min: 1000000, max: 9999999 })
    .withMessage("Employee ID must be a 7-digit number")
    .notEmpty()
    .withMessage("Employee ID is required"),
  body("password")
    .isLength({ min: 8, max: 12 })
    .withMessage("Password must be between 8 and 12 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^a-zA-Z0-9\s]/)
    .withMessage("Password must contain at least one special character")
    .notEmpty()
    .withMessage("Password is required"),
];

export { loginRequest };
