# Imóveis Backend API 🏢

This repository contains the backend API for the **Imóveis** system, a Brazilian property registration platform. Built with Node.js and Express, it provides endpoints for managing properties, associated people (owners, possessors, executors), user authentication, and authorization.

## ✨ Features

*   **Property Management:** CRUD operations for properties (address, registration details, areas, tax types).
*   **People Management:** Implicit creation/update of associated people (owners, possessors, executors) linked to properties via the `property_people` join table. Ensures unique people based on `document_type` and `document`.
*   **User Authentication:** Secure login for registered system users (`users` table) via JWT (JSON Web Tokens).
*   **Authorization (RBAC):** Role-Based Access Control implemented with three roles: `admin`, `staff`, and `dev`. Specific endpoints restricted based on user roles.
*   **File Uploads:** Handles uploads for property photos (`front_photo`, `above_photo`) using `multer`, with file type and size validation.
*   **Data Validation:** Robust request validation using `express-validator` for incoming data formats, types, and presence.
*   **Database Transactions:** Ensures atomicity for complex operations like creating or updating properties and their associated people links.
*   **Relational Integrity:** Utilizes foreign keys and unique constraints in the database schema for data consistency.

## 💻 Tech Stack

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MySQL (using `mysql2/promise`)
*   **Authentication:** JSON Web Tokens (`jsonwebtoken`)
*   **Password Hashing:** `bcryptjs`
*   **Validation:** `express-validator`
*   **File Uploads:** `multer`
*   **Environment Variables:** `dotenv`
*   **CORS:** `cors` middleware
*   **Request Body Handling:** `flat` (for unflattening multipart form data)

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   [MySQL Server](https://dev.mysql.com/downloads/mysql/)

## 🚀 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd IPTU-BACK_END
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Setup the Database:**
    *   Ensure your MySQL server is running.
    *   Connect to MySQL as a user with privileges to create databases and users (e.g., `root`).
    *   Execute the schema script to create the database, tables, and the application user:
        ```bash
        # Example using MySQL CLI (enter password when prompted)
        mysql -u root -p < imoveis_db.sql
        ```
    *   **Note:** The script creates a database `imoveis_db` and a user `imoveis_app_user`. Remember the password you set for this user in the script!

4.  **Configure Environment Variables:**
    *   Create a `.env` file in the project root directory.
    *   Copy the contents of `.env.example` (if provided) or add the following variables, replacing placeholders with your actual values:
        ```dotenv
        # Database Configuration
        DB_HOST=localhost
        DB_USER=imoveis_app_user # Recommended: Use the dedicated app user
        DB_PASSWORD=your_app_password # The password set in imoveis_db.sql
        DB_NAME=imoveis_db

        # JWT Configuration
        JWT_SECRET=your_very_strong_and_secret_jwt_key # Use a long, random string

        # Server Configuration
        PORT=3000 # Or any other port you prefer
        ```
    *   **SECURITY:** Ensure the `.env` file is added to your `.gitignore` and **never** committed to version control.

## ▶️ Running the Application

1.  **Start the server:**
    ```bash
    npm start
    # or potentially 'node src/server.js' depending on your package.json scripts
    ```

2.  The server should now be running on the port specified in your `.env` file (default: `http://localhost:3000`). You'll see a confirmation message in the console.

##  API Endpoints

The API routes are defined in `src/routes/routes.js`. Key endpoints include:

*   **Authentication:**
    *   `POST /api/users/login`: Log in a user, returns JWT.
*   **Properties:**
    *   `POST /api/properties`: Create a new property (handles owner/possessor/executor creation/linking and photo uploads). (Requires Auth)
    *   `GET /api/properties`: Get a list of all properties (includes owners). (Requires Auth)
    *   `GET /api/properties/:id`: Get details of a specific property (includes owners, possessor, executor). (Requires Auth)
    *   `PUT /api/properties/:id`: Update a specific property. (Requires Auth)
    *   `DELETE /api/properties/:id`: Delete a specific property. (Requires Auth + `dev` role)
*   **People:** (No direct POST endpoint by design)
    *   `GET /api/people`: Get a list of all people. (Requires Auth)
    *   `GET /api/people/:id`: Get details of a specific person. (Requires Auth)
    *   `PUT /api/people/:id`: Update a specific person. (Requires Auth + `dev` role)
    *   `DELETE /api/people/:id`: Delete a specific person. (Requires Auth + `dev` role)

*(For detailed request/response structures, please refer to the code or API testing tools like Insomnia/Postman used during development).*

## 🔐 Authentication & Authorization

*   **Authentication:** Requests to protected endpoints must include an `Authorization` header with a valid JWT Bearer token: `Authorization: Bearer <your_jwt_token>`. Obtain a token via the `/api/users/login` endpoint.
*   **Authorization:**
    *   Most endpoints require any authenticated user (`admin`, `staff`, `dev`).
    *   `DELETE /api/properties/:id`, `PUT /api/people/:id`, `DELETE /api/people/:id` specifically require the `dev` role.
    *   Access control is enforced by middleware (`verifyToken`, `isDev`, `isStaff`, `isAdmin`) defined in `src/middleware/auth.js`.

## 🗄️ Database

*   **Type:** MySQL
*   **Database Name:** `imoveis_db`
*   **Tables:**
    *   `users`: Stores employee login credentials and roles.
    *   `people`: Stores details of individuals/entities (owners, possessors, executors).
    *   `properties`: Stores details of the registered properties.
    *   `property_people`: Join table linking properties to people with a specific relationship type.
*   **Schema:** See `imoveis_db.sql` for detailed column definitions, constraints, and relationships.

## 🧪 Testing

This API has been tested manually using [Insomnia](https://insomnia.rest/) following a detailed test plan covering:

*   CRUD operations success cases for different roles.
*   Data validation errors.
*   File upload scenarios (success and failure).
*   Authorization checks (no token, invalid token, wrong role).
*   Not found errors.
*   Database integrity checks after mutations.

---
