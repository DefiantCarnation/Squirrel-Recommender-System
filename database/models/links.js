var Sequelize = require('sequelize');

module.exports = function(db) {
  var Link = db.define('links', {
    url: {
      type: Sequelize.STRING(50),
      unique: true,
      allowNull: false,
    },
    keywords: {
      type: Sequelize.STRING(700) //JSON array
    },
  });

  return Link;
};