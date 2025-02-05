require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const db = require("./db");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.send("API de Cadastro de Imóveis rodando!");
});

// Endpoint to upload property images
app.post("/upload", upload.array("photos", 2), (req, res) => {
  const files = req.files;
  if (!files) {
    return res.status(400).send("No files were uploaded.");
  }
  res.send(files.map((file) => `/uploads/${file.filename}`));
});

// Endpoint to retrieve property details
app.get("/properties", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM properties");
    res.json(rows);
  } catch (error) {
    res.status(500).send("Error retrieving properties");
  }
});

app.post(
  "/properties",
  upload.fields([{ name: "front_photo" }, { name: "above_photo" }]),
  (req, res) => {
    const {
      zip_code,
      street,
      number,
      neighborhood,
      complement,
      city,
      state,
      property_registration,
      tax_type,
      land_area,
      built_area,
      owner_name,
      owner_cpf_cnpj,
      possessor_name,
      possessor_cpf_cnpj,
    } = req.body;

    const front_photo = req.files.front_photo[0].path;
    const above_photo = req.files.above_photo[0].path;

    db.query(
      "INSERT INTO properties (zip_code, street, number, neighborhood, complement, city, state, property_registration, tax_type, land_area, built_area, front_photo, above_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        zip_code,
        street,
        number,
        neighborhood,
        complement,
        city,
        state,
        property_registration,
        tax_type,
        land_area,
        built_area,
        front_photo,
        above_photo,
      ],
      (err, result) => {
        if (err) {
          console.error("Erro ao inserir propriedade:", err);
          return res.status(500).send("Erro ao inserir propriedade");
        }

        const property_id = result.insertId;

        if (owner_name && owner_cpf_cnpj) {
          db.query(
            "INSERT INTO owners (name, cpf_cnpj) VALUES (?, ?)",
            [owner_name, owner_cpf_cnpj],
            (err, result) => {
              if (err) {
                console.error("Erro ao inserir proprietário:", err);
                return res.status(500).send("Erro ao inserir proprietário");
              }

              const owner_id = result.insertId;

              db.query(
                "INSERT INTO property_owners (property_id, owner_id) VALUES (?, ?)",
                [property_id, owner_id],
                (err) => {
                  if (err) {
                    console.error(
                      "Erro ao associar proprietário à propriedade:",
                      err
                    );
                    return res
                      .status(500)
                      .send("Erro ao associar proprietário à propriedade");
                  }
                }
              );
            }
          );
        }

        if (possessor_name && possessor_cpf_cnpj) {
          db.query(
            "INSERT INTO possessors (name, cpf_cnpj) VALUES (?, ?)",
            [possessor_name, possessor_cpf_cnpj],
            (err, result) => {
              if (err) {
                console.error("Erro ao inserir possuidor:", err);
                return res.status(500).send("Erro ao inserir possuidor");
              }

              const possessor_id = result.insertId;

              db.query(
                "INSERT INTO property_possessors (property_id, possessor_id) VALUES (?, ?)",
                [property_id, possessor_id],
                (err) => {
                  if (err) {
                    console.error(
                      "Erro ao associar possuidor à propriedade:",
                      err
                    );
                    return res
                      .status(500)
                      .send("Erro ao associar possuidor à propriedade");
                  }
                }
              );
            }
          );
        }

        res.status(201).send("Propriedade registrada com sucesso");
      }
    );
  }
);

app.listen(port, () => {
  console.log(`Servidor rodando em: http://localhost:${port}`);
});
