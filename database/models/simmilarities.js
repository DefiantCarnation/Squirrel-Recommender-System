var Sequelize = require('sequelize');

module.exports = function(db) {
  var Simmilarity = db.define('simmilarities', {
    score: {
      type: Sequelize.REAL,
      defaultValue: 0, 
    },
  });
  return Simmilarity;
};