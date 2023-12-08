const Sequelize = require("sequelize");

const sequelize = require("../utils/database");

const Customer = sequelize.define(
  "customer",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    customer_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    paranoid: true,
  }
);

Customer.associate = (models) => {
  Customer.belongsTo(models.userModel);
  Customer.hasMany(models.subscriptionModel);
};

module.exports = Customer;
