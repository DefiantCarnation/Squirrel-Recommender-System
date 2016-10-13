var Sequelize = require('sequelize');

module.exports = function(db) {
  var Keyword = db.define('keywords', {
    word: {
      type: Sequelize.STRING(20),
      unique: true,
      allowNull: false,
    },
  });

  return Keyword;
};