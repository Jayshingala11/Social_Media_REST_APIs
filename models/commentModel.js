const Sequelize = require("sequelize");

const sequelize = require("../utils/database");

const Comment = sequelize.define(
  "comment",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    comment: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    comm_id: {
      type: Sequelize.INTEGER,
      defaultValue: null,
    },
  },
  {
    paranoid: true,
  }
);

Comment.associate = (models) => {
  Comment.belongsTo(models.postModel, { onDelete: "CASCADE" });
  Comment.belongsTo(models.userModel);
};

module.exports = Comment;
