import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization; // Get Auth header

  if (!authHeader) {
    return res
      .status(403)
      .json({ message: "Token de autenticação não fornecido." });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .json({ message: "Token de autenticação não fornecido." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Token de autenticação inválido." });
  }
};

// admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      message: "Acesso não autorizado. Requer permissão de administrador.",
    });
  }
};

// staff role
const isStaff = (req, res, next) => {
  if (req.user && req.user.role === "staff") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Acesso não autorizado. Requer permissão de staff." });
  }
};

// dev role
const isDev = (req, res, next) => {
  if (req.user && req.user.role === "dev") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Acesso não autorizado. Requer permissão de dev." });
  }
};

export { verifyToken, isAdmin, isStaff, isDev };
