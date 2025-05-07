import express from "express";
import cors from "cors";
import routes from "./routes/routes.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// --- Middleware ---

// CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies (for form data)
app.use(express.urlencoded({ extended: true }));

//app.use((req, res, next) => {
//  if (req.body) {
//    req.body = unflatten(req.body);
//  }
//  next();
//});

// --- Routes ---
app.use(routes);

// --- Serve Static Files (Uploaded Images) ---
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// --- Error Handling Middleware (Centralized) ---
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  } else if (err.message === "Only JPG, JPEG, and PNG files are allowed") {
    return res.status(400).json({ message: err.message });
  } else {
    return res
      .status(500)
      .json({ message: "Ocorreu um erro interno no servidor." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
