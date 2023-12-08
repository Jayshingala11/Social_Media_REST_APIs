const Sequelize = require("sequelize");

const sequelize = require("../utils/database");

const Chat = sequelize.define(
  "chat",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    sender_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
        deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE,
        name: "senderId_fk",
      },
    },
    receiver_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
        deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE,
        name: "receiverId_fk",
      },
    },
    message: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    req_status: {
      type: Sequelize.BOOLEAN,
    },
  },
  {
    paranoid: true,
  }
);

Chat.associate = (models) => {
  Chat.belongsTo(models.userModel, { foreignKey: "sender_id" });
  Chat.belongsTo(models.userModel, { foreignKey: "receiver_id" });
};

module.exports = Chat;
