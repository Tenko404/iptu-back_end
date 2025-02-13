const mysql = require("mysql2/promise");
const config = require("../../config");
require("dotenv").config({ path: config.envPath });

// Validate environment variables
if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_NAME
) {
  console.error("ERROR: Missing required database environment variables.");
  process.exit(1);
}

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
  .then(() => console.log("✅ Database connected successfully!"))
  .catch((err) => console.error("❌ Database connection error:", err));

// Async query function
async function query(sql, params) {
  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query(sql, params);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error; // Re-throw the error for handling by caller
  } finally {
    if (connection) {
      connection.release(); // *Always* release the connection
    }
  }
}
module.exports = { query };
