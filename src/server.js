// ./src/server.js
import express from "express";
import cors from "cors";
import routes from "./routes/routes.js";
import dotenv from "dotenv";
import multer from "multer"; // Import multer
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// --- Middleware ---

// CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies (for form data)
app.use(express.urlencoded({ extended: true }));

// --- Multer Configuration (for file uploads) ---

// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public", "uploads")); // Store files in an 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Create a unique filename (e.g., using a timestamp and the original file extension)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Create the multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // Limit file size to 5MB (adjust as needed)
  },
  fileFilter: function (req, file, cb) {
    //checks the file extension
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, and PNG files are allowed"));
    }
  },
});

// --- Routes ---
app.use(routes);

// --- Serve Static Files (Uploaded Images) ---
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
// --- Error Handling Middleware (Centralized) ---

app.use((err, req, res, next) => {
  console.error(err); // Log the error

  if (err instanceof multer.MulterError) {
    // Handle multer errors (e.g., file too large, invalid file type)
    res.status(400).json({ message: err.message });
  } else {
    // Handle other errors (including errors thrown from controllers/services)
    res.status(500).json({ message: "Ocorreu um erro no servidor." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { upload }; //export the configured multer
