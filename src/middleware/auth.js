const jwt = require("jsonwebtoken");
const config = require("../../config"); //Imports configs from project root
require("dotenv").config({ path: config.envPath });

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    //Verify token on Protected Routes
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user; //Valid token
    next();
  });
}
module.exports = { authenticateToken };
