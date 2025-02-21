// src/middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization; // Get the Authorization header

  if (!authHeader) {
    return res
      .status(403)
      .json({ message: "Token de autenticação não fornecido." }); // 403 Forbidden
  }

  // The header should be in the format: "Bearer <token>"
  const token = authHeader.split(" ")[1]; // Split by space and take the second part

  if (!token) {
    return res
      .status(403)
      .json({ message: "Token de autenticação não fornecido." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
    req.user = decoded; // Attach the decoded user information to the request object
    next(); // Call the next middleware/route handler
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Token de autenticação inválido." }); // 401 Unauthorized
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next(); // User is an admin, proceed
  } else {
    res.status(403).json({
      message: "Acesso não autorizado. Requer permissão de administrador.",
    }); // 403 Forbidden
  }
};

export { verifyToken, isAdmin };
