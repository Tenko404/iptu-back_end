import mysql from "mysql2/promise"; // Promise-based version
import dotenv from "dotenv";

dotenv.config(); // Load .env

// Connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Database conectada com sucesso!");
    connection.release(); // Release connection back to pool
  } catch (error) {
    console.error("Conexão com a database falhou:", error);
    process.exit(1); // Exit process if database connection fails
  }
}

testConnection();

export default pool; // Export connection pool
