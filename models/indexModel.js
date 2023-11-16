const fs = require("fs");
const path = require("path");

const directory = __dirname;

const files = fs.readdirSync(directory);

const models = {};

files.forEach((file) => {
  if (file !== "indexModel.js" && file.endsWith(".js")) {
    const modelName = path.basename(file, ".js");
    const model = require(`./${file}`);
    models[modelName] = model;
  }
});

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
