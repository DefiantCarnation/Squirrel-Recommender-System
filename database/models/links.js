var Sequelize = require('sequelize');

module.exports = function(db) {
  var Link = db.define('links', {
    url: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    keywords: {
      type: Sequelize.STRING //JSON array
    },
  });

  return Link;
};