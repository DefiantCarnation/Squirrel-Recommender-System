var Sequelize = require('sequelize');

module.exports = function(db) {
  var Simmilarity = db.define('simmilarities', {
    score: {
      type: Sequelize.REAL,
      defaultValue: 0, 
    },
    userId1 : {
      type: Sequelize.STRING,
      unique: 'composite',
    },
    userId2: {
      type: Sequelize.STRING,
      unique: 'composite',
    },
  });
  return Simmilarity;
};