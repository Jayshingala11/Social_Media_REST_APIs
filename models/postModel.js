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

Post.associate = (models) => {
  Post.belongsTo(models.userModel);
  Post.hasMany(models.likeModel, { onDelete: "CASCADE" });
  Post.hasMany(models.commentModel, { onDelete: "CASCADE" });
  Post.hasMany(models.collaborationModel, { onDelete: "CASCADE" });
};

module.exports = Post;
