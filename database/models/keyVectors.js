var Sequelize = require('sequelize');

module.exports = function(db) {
  var KeyVector = db.define('keyVectors', {
    userId: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },
    vector: {
      type: Sequelize.STRING(700), //JSON object
      defaultValue: '{}',
    },
    recommendations: {
      type: Sequelize.STRING(700), //JSON object
      defaultValue: '[]',
    }
  });

  return KeyVector;
};