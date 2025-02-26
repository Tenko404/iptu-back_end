CREATE DATABASE IF NOT EXISTS imoveis_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE imoveis_db;

CREATE TABLE people (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    document_type ENUM('CPF', 'CNPJ') NOT NULL,
    document VARCHAR(14) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_document (document_type, document),
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL UNIQUE,
    employee_password VARCHAR(255) NOT NULL,
    employee_role ENUM('admin', 'staff', 'dev') NOT NULL,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    street VARCHAR(100) NOT NULL,
    house_number VARCHAR(10) NOT NULL,
    neighborhood VARCHAR(50) NOT NULL,
    complement VARCHAR(50) NULL DEFAULT NULL,
    property_registration VARCHAR(50) NOT NULL,
    tax_type ENUM('commercial', 'residential', 'mixed', 'territorial') NOT NULL,
    land_area DECIMAL(10, 2) NOT NULL,
    built_area DECIMAL(10, 2) NOT NULL,
    front_photo VARCHAR(255) NULL DEFAULT NULL,
    above_photo VARCHAR(255) NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE property_people (
    property_id INT NOT NULL,
    person_id INT NOT NULL,
    relationship_type ENUM('owner', 'possessor', 'executor') NOT NULL,
    description TEXT NULL DEFAULT NULL,
    PRIMARY KEY (property_id, person_id, relationship_type),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
);

-- User creation (remember to replace with strong passwords!)
-- DROP USER 'root'@'localhost'; -- Keep this commented out!
CREATE USER 'root'@'localhost' IDENTIFIED BY 'your_very_strong_root_password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;

CREATE USER 'imoveis_app_user'@'localhost' IDENTIFIED BY 'your_app_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON imoveis_db.* TO 'imoveis_app_user'@'localhost';

FLUSH PRIVILEGES;