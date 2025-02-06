const mysql = require("mysql2/promise");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection()
  .then(() => console.log("✅ Conectado ao banco de dados com sucesso!"))
  .catch((err) => console.error("❌ Erro ao conectar ao banco de dados:", err));

module.exports = db;
