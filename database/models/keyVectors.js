var Sequelize = require('sequelize');

module.exports = function(db) {
  var KeyVector = db.define('keyVectors', {
    strength: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
    },
  });

  return KeyVector;
};