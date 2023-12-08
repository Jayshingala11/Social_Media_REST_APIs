const Sequelize = require("sequelize");

const sequelize = require("../utils/database");

const Subscriptionplan = sequelize.define("subscriptionplan", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  product_id: {
    type: Sequelize.STRING,
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

Subscriptionplan.associate = (models) => {
  // Subscriptionplan.hasMany(models.SubscriptionModel);
};

module.exports = Subscriptionplan;
