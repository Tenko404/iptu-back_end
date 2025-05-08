# Imóveis Backend API 🏢 v0.1.0

[![Node.js CI](https://github.com/<your_username>/<your_repo>/actions/workflows/node.js.yml/badge.svg)](https://github.com/<your_username>/<your_repo>/actions/workflows/node.js.yml) <!-- Optional: Replace with your actual CI badge URL -->

This repository contains the **Version 0.1.0** backend API for the **Imóveis** system, a Brazilian property registration platform. Built with Node.js and Express, it provides endpoints for managing properties, associated people (owners, possessors, executors), user authentication, and role-based authorization. This version represents a functionally tested core suitable for initial integration.

## ✨ Features (v0.1.0)

- **Property Management:** CRUD operations for properties (address, registration details, areas, tax types).
- **People Management:**
  - Implicit creation/update of associated people (owners, possessors, executors) during property creation/update.
  - Ensures unique people based on `document_type` and `document`.
  - Direct read (`GET`) and update (`PUT`) endpoints for existing people.
  - **Note:** Direct deletion of people via API is disabled by design; people are only deleted if orphaned when their last associated property is deleted.
- **User Authentication:** Secure login for registered system users (`users` table) via JWT.
- **Authorization (RBAC):** Role-Based Access Control implemented (`admin`, `staff`, `dev`). Specific endpoints restricted based on user roles (see Endpoints & Authorization sections).
- **File Uploads:** Handles uploads for property photos (`front_photo`, `above_photo`) using `multer`, with file type (JPG/PNG) and size validation (currently 10MB limit).
- **Data Validation:** Request validation using `express-validator`.
- **Database Transactions:** Atomic operations for property creation, update, and deletion.
- **Relational Integrity:** Foreign keys and unique constraints enforced at the database level.
- **Performance:** Includes N+1 query optimization for the `GET /api/properties` endpoint.

## 💻 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL (`mysql2/promise`)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Validation:** `express-validator`
- **File Uploads:** `multer`
- **Environment Variables:** `dotenv`
- **CORS:** `cors` middleware
- **Request Body Handling:** `flat` (for unflattening multipart form data within controllers)

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/)

## 🚀 Installation & Setup

1.  **Clone:** `git clone <your-repository-url> && cd IPTU-BACK_END`
2.  **Install:** `npm install` (or `yarn install`)
3.  **Database Setup:**
    - Ensure MySQL is running. Connect as `root` or equivalent user.
    - Execute the schema script: `mysql -u root -p < imoveis_db.sql`
    - _(The script creates `imoveis_db` database and `imoveis_app_user`. Note the password used)_.
4.  **Environment Variables:**

    - Create `.env` in the project root.
    - Populate with necessary values (referencing `.env.example` if available):

      ```dotenv
      # Database Configuration
      DB_HOST=localhost
      DB_USER=imoveis_app_user # Recommended user
      DB_PASSWORD=your_app_password # Password from imoveis_db.sql
      DB_NAME=imoveis_db

      # JWT Configuration
      JWT_SECRET=your_very_strong_and_secret_jwt_key # Use a secure random string

      # Server Configuration
      PORT=3000
      ```

    - **SECURITY:** Add `.env` to `.gitignore`. **Never commit `.env` files.**

## ▶️ Running the Application

1.  **Start:** `npm start` (or check `package.json` scripts)
2.  Server runs on `http://localhost:PORT` (default 3000).

## API Endpoints (v0.1.0)

Defined in `src/routes/routes.js`. Requires Authentication unless noted.

- **Authentication:**
  - `POST /api/users/login`: Log in (No Auth required). Returns JWT.
- **Properties:**
  - `POST /api/properties`: Create property & link/create people. (Auth: Any)
  - `GET /api/properties`: List properties (includes owners only). (Auth: Any)
  - `GET /api/properties/:id`: Get specific property (includes owners, possessor, executor). (Auth: Any)
  - `PUT /api/properties/:id`: Update property & link/create/remove people (except owner). (Auth: Any)
  - `DELETE /api/properties/:id`: Delete property (cleans up orphaned people). (Auth: `admin`, `dev`)
- **People:**
  - `GET /api/people`: List all people. (Auth: Any)
  - `GET /api/people/:id`: Get specific person. (Auth: Any)
  - `PUT /api/people/:id`: Update specific person's details. (Auth: `admin`, `dev`)
  - `DELETE /api/people/:id`: **(REMOVED)**

## 🔐 Authentication & Authorization

- **Authentication:** Provide JWT via `Authorization: Bearer <token>` header.
- **Authorization:**
  - Login is public.
  - Most property/people read endpoints: Any authenticated role (`admin`, `staff`, `dev`).
  - Property Create/Update: Any authenticated role.
  - Property Delete: `admin`, `dev` only.
  - Person Update: `admin`, `dev` only.
  - Middleware: `verifyToken`, `hasRole` (in `src/middleware/`).

## 🗄️ Database

- **Type:** MySQL
- **DB Name:** `imoveis_db`
- **Tables:** `users`, `people`, `properties`, `property_people`
- **Schema:** See `imoveis_db.sql`.

## 🧪 Testing (v0.1.0)

- Tested manually via Insomnia based on a detailed plan covering CRUD, validation, auth, file uploads, and database states.
- **Future Work:** Implement automated testing suite (Jest/Supertest recommended).

## V0 Notes & Known Areas for Improvement

- This version is functionally tested based on the current requirements.
- Refer to the project's STASH list or issue tracker for planned refinements, including:
  - Integrating a dedicated logging library (e.g., Winston/Pino).
  - Moving all validation logic (incl. CPF/CNPJ) to `request/` validators.
  - Adding automated tests.
  - Implementing client-side image resizing (recommended before production).
  - Minor code cleanup and configuration enhancements.

---
