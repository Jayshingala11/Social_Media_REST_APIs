const Sequelize = require("sequelize");

const sequelize = require("../utils/database");

const Subscription = sequelize.define("subscription", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  plan_name: {
    type: Sequelize.STRING,
  },
  posts_limit: {
    type: Sequelize.INTEGER,
  },
  collab_limit: {
    type: Sequelize.INTEGER,
  },
});

module.exports = Subscription;
