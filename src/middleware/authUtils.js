// Middleware to check if user has AT LEAST ONE of the specified roles
const hasRole = (allowedRoles) => {
  // Ensure allowedRoles is always an array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    // verifyToken should have run first and attached req.user
    if (!req.user || !req.user.role) {
      // This shouldn't happen if verifyToken is used, but good failsafe
      return res
        .status(401)
        .json({ message: "Authentication required with valid user role." });
    }

    // Check if the user's role is included in the allowed roles
    if (roles.includes(req.user.role)) {
      next(); // User has one of the allowed roles, proceed
    } else {
      // User role not allowed
      res.status(403).json({
        message: `Acesso não autorizado. Requer uma das seguintes permissões: ${roles.join(
          ", "
        )}.`,
      });
    }
  };
};

export { hasRole };
