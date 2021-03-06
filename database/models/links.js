var Sequelize = require('sequelize');

module.exports = function(db) {
  var Link = db.define('links', {
    url: {
      type: Sequelize.STRING(200),
      unique: true,
      allowNull: false,
    },
  });
  return Link;
};