const path = require("path");

module.exports = {
  rootDir: path.resolve(__dirname, "."),
  envPath: path.resolve(__dirname, ".env"),
  uploadDir: path.resolve(__dirname, "public", "uploads"), // Public/upload
  port: process.env.PORT || 3000,
};
