const hasRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res
        .status(401)
        .json({ message: "Authentication required with valid user role." });
    }

    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        message: `Acesso não autorizado. Requer uma das seguintes permissões: ${roles.join(
          ", "
        )}.`,
      });
    }
  };
};

export { hasRole };
