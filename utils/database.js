const Sequelize = require('sequelize');

const sequelize = new Sequelize("final-project", 'root', 'jay@3011', {
    dialect: "mysql",
    host: "localhost",
    timezone: '+05:30',
});

module.exports = sequelize;