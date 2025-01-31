require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API de Cadastro de Imóveis rodando!");
});

app.listen(port, () => {
  console.log(`Servidor rodando em: http://localhost:${port}`);
});
