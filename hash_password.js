import bcrypt from "bcryptjs";

const password = "Duda$2005"; // password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error("Error hashing password:", err);
    return;
  }
  console.log("Hashed password:", hash); // Copy this output to SQL INSERT statements
});

//INSERT INTO users (employee_id, employee_password, employee_role)
//VALUES (
//    '7654321',
//    '$2a$10$someLongHashedString', -- Paste the hashed password here
//    'staff'
//);
