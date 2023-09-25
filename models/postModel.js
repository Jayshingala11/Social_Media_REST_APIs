const Sequelize = require("sequelize");

const sequelize = require("../utils/database");

const Post = sequelize.define(
  "post",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    editable: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    draft: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    paranoid: true,
  }
);

module.exports = Post;
