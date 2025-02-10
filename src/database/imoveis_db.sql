CREATE TABLE owners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    document VARCHAR(14) NOT NULL UNIQUE  -- CPF: 11 caracteres ou CNPJ: 14 caracteres
);

CREATE TABLE possessors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    document VARCHAR(14) NOT NULL UNIQUE  -- CPF: 11 caracteres ou CNPJ: 14 caracteres
);

CREATE TABLE inventories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_login (
    id INT AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL
);

CREATE TABLE properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    zip_code CHAR(9) NOT NULL,
    street VARCHAR(100) NOT NULL,
    house_number VARCHAR(10) NOT NULL,
    neighborhood VARCHAR(50) NOT NULL,
    complement VARCHAR(50),
    city VARCHAR(50) NOT NULL,
    state CHAR(2) NOT NULL,
    property_registration VARCHAR(50) NOT NULL,
    tax_type ENUM('building', 'residential', 'both') NOT NULL,
    land_area DECIMAL(10, 2) NOT NULL,
    built_area DECIMAL(10, 2) NOT NULL,
    front_photo VARCHAR(255),
    above_photo VARCHAR(255)
);