var Sequelize = require('sequelize');
var keys = require('./keys.js');

var database = new Sequelize('Squirrel_Recommender_DB', keys.aws.username, keys.aws.password, {
  host: keys.aws.host,
  dialect: 'mysql',
  port: '3306',
});

var KeyVector = require('./models/keyVectors.js')(database);
var Link = require('./models/links.js')(database);
var Simmilarity = require('./models/simmilarities.js')(database);

KeyVector.belongsToMany(KeyVector, {as: 'userId2', through: Simmilarity, foreignKey: 'userId2', otherKey: 'userId1'});

KeyVector.belongsToMany(Link, {through: 'VectorLink'});
Link.belongsToMany(KeyVector, {through: 'VectorLink'});


module.exports = {
  database: database,
  KeyVector: KeyVector,
  Link: Link,
  Simmilarity: Simmilarity,
};