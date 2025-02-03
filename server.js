require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const db = require("./db");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("API de Cadastro de Imóveis rodando!");
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
