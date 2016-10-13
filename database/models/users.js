var Sequelize = require('sequelize');

module.exports = function(db) {
  var User = db.define('users', {
    username: {
      type: Sequelize.STRING(20),
    },
  });
  return User;
};