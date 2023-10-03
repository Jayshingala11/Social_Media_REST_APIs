const Sequelize = require("sequelize");

const sequelize = require("../utils/database");

const Collaboration = sequelize.define(
  "collaboration",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    collab_content: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    paranoid: true,
  }
);

module.exports = Collaboration;
