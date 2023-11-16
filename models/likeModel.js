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

Like.associate = (models) => {
  Like.belongsTo(models.postModel, { onDelete: "CASCADE" });
  Like.belongsTo(models.userModel);
};

module.exports = Like;
