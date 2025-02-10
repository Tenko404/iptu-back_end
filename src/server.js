require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
}); // Carrega as variáveis de ambiente do arquivo .env
const bcrypt = require("bcryptjs"); // Importa o bcryptjs para manipulação de senhas (hashing e comparação)
const express = require("express"); // Importa o Express para criar o servidor e definir rotas
const cors = require("cors"); // Importa o CORS para permitir requisições de diferentes origens
const multer = require("multer"); // Importa o Multer para gerenciar uploads de arquivos
const path = require("path"); // Importa o módulo path para trabalhar com caminhos de arquivos
const db = require("./config/db"); // Importa o módulo de conexão com o banco de dados

const app = express(); // Cria a aplicação Express
const port = process.env.PORT || 3000; // Define a porta que o servidor irá usar (padrão 3000 ou conforme variável de ambiente)

app.use(cors()); // Habilita o CORS para permitir acesso de outras origens
app.use(express.json()); // Configura o Express para interpretar requisições com JSON no corpo

app.use(express.static(path.join(__dirname, "public"))); // Define a pasta "public" como fonte de arquivos estáticos (por exemplo, imagens, HTML, CSS)

const storage = multer.diskStorage({
  // Configuração do Multer para armazenamento dos arquivos enviados
  destination: (req, file, cb) => {
    // Define o diretório onde os arquivos serão salvos
    cb(null, path.join(__dirname, "public/uploads"));
  },
  filename: (req, file, cb) => {
    // Define o nome do arquivo: usa a data atual (timestamp) e a extensão original
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }); // Inicializa o Multer com a configuração de armazenamento definida acima

app.get("/", (req, res) => {
  // Rota principal para teste, exibindo uma mensagem simples
  res.send("API de Cadastro de Imóveis rodando!");
});

// Endpoint para listar todas as propriedades
app.get("/properties", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM properties");

    if (rows.length === 0) {
      return res.status(404).json({ error: "Nenhuma propriedade encontrada" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar propriedades:", error);
    res.status(500).send("Erro ao buscar propriedades");
  }
});

// Endpoint para upload de imagens de propriedade
// Permite o upload de até 2 arquivos no campo "photos"
app.post("/upload", upload.array("photos", 2), (req, res) => {
  const files = req.files;
  if (!files) {
    return res.status(400).send("Nenhum arquivo enviado.");
  }
  res.send(files.map((file) => `/uploads/${file.filename}`)); // Retorna os caminhos dos arquivos enviados
});

// Endpoint para recuperar os detalhes de todas as propriedades cadastradas
app.get("/properties/:id", async (req, res) => {
  const { id } = req.params; // Pega o ID enviado na URL

  try {
    const [rows] = await db.query("SELECT * FROM properties WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Propriedade não encontrada" });
    }

    res.json(rows[0]); // Retorna o primeiro imóvel encontrado
  } catch (error) {
    console.error("Erro ao buscar propriedade:", error);
    res.status(500).send("Erro ao buscar propriedade");
  }
});

// Endpoint para registrar um novo funcionário
app.post("/register", async (req, res) => {
  const { employee_password, employee_role } = req.body; // Extrai os dados enviados no corpo da requisição

  if (!employee_password || !employee_role) {
    // Verifica se os dados necessários foram fornecidos
    return res.status(400).send("Informe a senha e o cargo do funcionário.");
  }

  const saltRounds = 10; // Define o número de salt rounds para o bcrypt (quanto maior, mais seguro)

  try {
    // Gera o hash da senha usando o bcrypt
    const hashedPassword = await bcrypt.hash(employee_password, saltRounds);
    db.query(
      // Insere o novo funcionário no banco, armazenando o hash da senha
      "INSERT INTO user_login (employee_password, employee_role) VALUES (?, ?)",
      [hashedPassword, employee_role],
      (err, result) => {
        if (err) {
          console.error("Erro ao registrar funcionário:", err);
          return res.status(500).send("Erro ao registrar funcionário");
        }
        res.status(201).send("Funcionário registrado com sucesso!");
      }
    );
  } catch (error) {
    console.error("Erro ao gerar hash da senha:", error);
    res.status(500).send("Erro ao processar a senha");
  }
});

// Endpoint para realizar o login do funcionário
app.post("/login", (req, res) => {
  const { employee_id, employee_password } = req.body; // Extrai o ID e a senha enviados no corpo da requisição

  if (!employee_id || !employee_password) {
    // Verifica se os dados necessários foram fornecidos
    return res.status(400).send("Informe o ID e a senha do funcionário.");
  }

  // Consulta o funcionário no banco de dados pelo ID
  db.query(
    "SELECT * FROM user_login WHERE employee_id = ?",
    [employee_id],
    async (err, results) => {
      if (err) {
        console.error("Erro ao buscar funcionário:", err);
        return res.status(500).send("Erro no login");
      }

      // Se nenhum funcionário for encontrado, retorna erro
      if (results.length === 0) {
        return res.status(400).send("Funcionário não encontrado");
      }

      // Pega o primeiro funcionário encontrado (já que o ID é único)
      const user = results[0];

      try {
        const match = await bcrypt.compare(
          // Compara a senha enviada com o hash armazenado no banco
          employee_password,
          user.employee_password
        );
        if (match) {
          res.send("Login efetuado com sucesso!");
        } else {
          res.status(400).send("Senha incorreta");
        }
      } catch (error) {
        console.error("Erro na comparação da senha:", error);
        res.status(500).send("Erro no login");
      }
    }
  );
});

// Endpoint para registrar uma propriedade com upload de imagens
// Recebe dois campos de upload: "front_photo" e "above_photo"
// Endpoint para registrar uma propriedade com upload de imagens
app.post(
  "/properties",
  upload.fields([{ name: "front_photo" }, { name: "above_photo" }]),
  async (req, res) => {
    try {
      const {
        zip_code,
        street,
        house_number,
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

      const front_photo = req.files?.front_photo
        ? req.files.front_photo[0].path
        : null;
      const above_photo = req.files?.above_photo
        ? req.files.above_photo[0].path
        : null;

      // Inserção da propriedade no banco de dados
      const [result] = await db.query(
        "INSERT INTO properties (zip_code, street, house_number, neighborhood, complement, city, state, property_registration, tax_type, land_area, built_area, front_photo, above_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          zip_code,
          street,
          house_number,
          neighborhood,
          complement || null,
          city,
          state,
          property_registration,
          tax_type,
          land_area,
          built_area,
          front_photo || null,
          above_photo || null,
        ]
      );

      const property_id = result.insertId; // Pegamos o ID da propriedade cadastrada

      // Inserção do proprietário, se fornecido
      if (owner_name && owner_cpf_cnpj) {
        const [ownerResult] = await db.query(
          "INSERT INTO owners (name, cpf_cnpj) VALUES (?, ?)",
          [owner_name, owner_cpf_cnpj]
        );
        const owner_id = ownerResult.insertId;

        await db.query(
          "INSERT INTO property_owners (property_id, owner_id) VALUES (?, ?)",
          [property_id, owner_id]
        );
      }

      // Inserção do possuidor, se fornecido
      if (possessor_name && possessor_cpf_cnpj) {
        const [possessorResult] = await db.query(
          "INSERT INTO possessors (name, cpf_cnpj) VALUES (?, ?)",
          [possessor_name, possessor_cpf_cnpj]
        );
        const possessor_id = possessorResult.insertId;

        await db.query(
          "INSERT INTO property_possessors (property_id, possessor_id) VALUES (?, ?)",
          [property_id, possessor_id]
        );
      }

      res.status(201).send("Propriedade registrada com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar propriedade:", error);
      res.status(500).send("Erro ao registrar propriedade");
    }
  }
);
// Endpoint para atualizar uma propriedade existente
app.put(
  "/properties/:id",
  upload.fields([{ name: "front_photo" }, { name: "above_photo" }]),
  async (req, res) => {
    const { id } = req.params;
    console.log("Dados recebidos:", req.body); // 🔍 Verifica se os dados estão chegando

    const {
      zip_code,
      street,
      house_number,
      neighborhood,
      complement,
      city,
      state,
      property_registration,
      tax_type,
      land_area,
      built_area,
    } = req.body;

    const front_photo = req.files?.front_photo
      ? req.files.front_photo[0].path
      : null;
    const above_photo = req.files?.above_photo
      ? req.files.above_photo[0].path
      : null;

    try {
      const [result] = await db.query(
        "UPDATE properties SET zip_code=?, street=?, house_number=?, neighborhood=?, complement=?, city=?, state=?, property_registration=?, tax_type=?, land_area=?, built_area=?, front_photo=?, above_photo=? WHERE id=?",
        [
          zip_code || null,
          street || null,
          house_number || null,
          neighborhood || null,
          complement || null,
          city || null,
          state || null,
          property_registration || null,
          tax_type || null,
          land_area || null,
          built_area || null,
          front_photo || null,
          above_photo || null,
          id,
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Propriedade não encontrada" });
      }

      res.json({ message: "Propriedade atualizada com sucesso!" });
    } catch (error) {
      console.error(
        "Erro ao atualizar propriedade:",
        error.sqlMessage || error
      );
      res.status(500).json({
        error: error.sqlMessage || "Erro desconhecido ao atualizar propriedade",
      });
    }
  }
);

// Endpoint para deletar uma propriedade existente
app.delete("/properties/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Verifica se a propriedade existe antes de deletar
    const [existingProperty] = await db.query(
      "SELECT * FROM properties WHERE id = ?",
      [id]
    );

    if (existingProperty.length === 0) {
      return res.status(404).json({ error: "Propriedade não encontrada" });
    }

    // Deleta a propriedade
    const [result] = await db.query("DELETE FROM properties WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Erro ao deletar a propriedade" });
    }

    res.json({ message: "Propriedade deletada com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar propriedade:", error);
    res.status(500).send("Erro ao deletar propriedade");
  }
});

// Inicia o servidor na porta definida e exibe uma mensagem no console
app.listen(port, () => {
  console.log(`Servidor rodando em: http://localhost:${port}`);
});
