const Sequelize = require("sequelize");

const sequelize = require("../utils/database");

const Subscription = sequelize.define("subscription", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  sub_id: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  active: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
  },
  start_date: {
    type: Sequelize.DATE,
  },
  end_date: {
    type: Sequelize.DATE,
  },
});

Subscription.associate = (models) => {
  Subscription.belongsTo(models.customerModel);
  Subscription.belongsTo(models.subscriptionplanModel);
  Subscription.belongsTo(models.userModel);
};

module.exports = Subscription;
