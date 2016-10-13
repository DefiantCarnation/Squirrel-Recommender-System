var Sequelize = require('sequelize');
var keys = require('./keys.js');

var database = new Sequelize('Squirrel_Recommender_DB', keys.aws.username, keys.aws.password, {
  host: keys.aws.host,
  dialect: 'mysql',
  port: '3306',
});

var KeyVector = require('./models/keyVectors.js')(database);
var Keyword = require('./models/keywords.js')(database);
var Link = require('./models/links.js')(database);
var Simmilarity = require('./models/simmilarities.js')(database);
var User = require('./models/users.js')(database);

Keyword.belongsToMany(Link, {as: {singular: 'link', plural: 'links'}, through: 'keyLinks'});
Link.belongsToMany(Keyword, {as: {singular: 'keyword', plural: 'keywords'}, through: 'keyLinks'});

Link.belongsToMany(User, {as: {singular: 'user', plural: 'users'}, through: 'userLink'});
User.belongsToMany(Link, {as: {singular: 'stashedLink', plural: 'stashedLinks'}, through: 'userLink'});

User.belongsToMany(Keyword, {as: {singular: 'keyword', plural: 'keywords'}, through: 'keyVectors'});
Keyword.belongsToMany(User, {as: {singular: 'user', plural: 'users'}, through: 'keyVectors'});

User.belongsToMany(User, {as: {singular: 'otherUser', plural: 'otherUsers'}, through: 'simmilarities'});


module.exports = {
  database: database,
  KeyVector: KeyVector,
  Keyword: Keyword,
  Link: Link,
  Simmilarity: Simmilarity,
  User: User,
};