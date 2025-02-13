const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("../config"); // Access the config file
const routes = require("./routes"); //Import from route file

const app = express();

// CORS (configure for production)
const allowedOrigins = ["https://your-frontend-domain.com"]; // Your Frontend
app.use(
  cors({
    origin: function (origin, callback) {
      //Allow requests with no origin
      if (!origin) return callback(null, true);
      //If the origin is not on list
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin";
        return callback(new Error(msg), false);
      }

      return callback(null, true);
    },
  })
);

app.use(express.json());
//Static files (Make sure public exists.)
app.use(express.static(path.join(__dirname, "../public")));

// Use Routes
app.use("/api/v1", routes); //All API

// Optional: if frontend on backend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

app.listen(config.port, () => {
  //Uses Port from config file
  console.log(`Server is running on port ${config.port}`);
});
