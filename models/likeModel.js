const Sequelize = require("sequelize");

const sequelize = require("../utils/database");

const Like = sequelize.define(
  "like",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    liked: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    paranoid: true,
  }
);

module.exports = Like;
