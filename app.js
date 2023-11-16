const express = require("express");
const bodyParser = require("body-parser");

const sequelize = require("./utils/database");
const models = require("./models/indexModel");

const app = express();

// Router Import
const indexRoutes = require("./routes/indexRoutes");

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type",
    "Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// Routes
app.use(indexRoutes);

// Error Handler
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

// Server Running
sequelize
  .sync() // { force: true }
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
