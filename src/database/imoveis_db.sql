CREATE TABLE owners (
    owner_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    owner_document VARCHAR(14) NOT NULL UNIQUE  -- CPF: 11 caracteres ou CNPJ: 14 caracteres
);

CREATE TABLE possessors (
    possessor_id INT AUTO_INCREMENT PRIMARY KEY,
    possessor_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    possessor_document VARCHAR(14) NOT NULL UNIQUE  -- CPF: 11 caracteres ou CNPJ: 14 caracteres
);

CREATE TABLE inventories (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_name VARCHAR(100) NOT NULL,
    inventory_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_login (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_password VARCHAR(255) NOT NULL,
    employee_role ENUM('admin', 'staff') NOT NULL
);

CREATE TABLE properties (
    property_id INT AUTO_INCREMENT PRIMARY KEY,
    zip_code CHAR(8) NOT NULL,
    street VARCHAR(100) NOT NULL,
    house_number VARCHAR(10) NOT NULL,
    neighborhood VARCHAR(50) NOT NULL,
    complement VARCHAR(50),
    city VARCHAR(50) NOT NULL,
    br_state VARCHAR(50) NOT NULL,
    property_registration VARCHAR(50) NOT NULL UNIQUE,
    tax_type ENUM('building', 'residential', 'both') NOT NULL,
    land_area DECIMAL(10,2) NOT NULL,
    built_area DECIMAL(10,2) NOT NULL,
    front_image VARCHAR(255),
    top_image VARCHAR(255),
    owner_id INT NOT NULL,
    possessor_id INT,
    inventory_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(owner_id),
    FOREIGN KEY (possessor_id) REFERENCES possessors(possessor_id),
    FOREIGN KEY (inventory_id) REFERENCES inventories(inventory_id)
);