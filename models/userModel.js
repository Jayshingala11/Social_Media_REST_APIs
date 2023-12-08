const Sequelize = require("sequelize");

const sequelize = require("../utils/database");

const User = sequelize.define(
  "user",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    resetToken: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    paranoid: true,
  }
);

User.associate = (models) => {
  User.hasMany(models.postModel, { onDelete: "CASCADE" });
  User.hasMany(models.likeModel, { onDelete: "CASCADE" });
  User.hasMany(models.commentModel, { onDelete: "CASCADE" });
  User.hasMany(models.collaborationModel, { onDelete: "CASCADE" });
  User.belongsTo(models.subscriptionplanModel);
};

module.exports = User;
