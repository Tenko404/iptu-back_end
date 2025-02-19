import mysql from "mysql2/promise"; // Import the promise-based version
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env

// Create a connection pool (recommended for better performance)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0, // 0 means no limit
});

// Test the database connection (optional, but good practice)
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Database conectada com sucesso!");
    connection.release(); // Release the connection back to the pool
  } catch (error) {
    console.error("Conexão com a database falhou:", error);
    process.exit(1); // Exit the process if the database connection fails
  }
}

testConnection();

export default pool; // Export the connection pool
