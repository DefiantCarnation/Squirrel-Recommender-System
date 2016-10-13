
var Promise = require('bluebird');
var db = require('../database/config.js');
var helpers = require('./helpers.js');

module.exports = {
  update: function(req, res, next) {
    var url = req.body.url;
    var username = req.params.userid;
    var inputLink = {};
    var linkCreated = false;
    var inputUser = {};
    var userCreated = false;

    helpers.makeLink(url)
    .then(function(linkTuple) {
      inputLink = linkTuple[0];
      linkCreated = linkTuple[1];
      return helpers.makeUser(username, inputLink);
    })
    .then(function(userTuple) {
      inputUser = userTuple[0];
      userCreated = userTuple[1];
      return helpers.getWords(url);
    })
    .then(function(wordArray) {
      return helpers.makeKeyWords(wordArray);
    })
    .then(function(keywordArray) {
      return helpers.createKeyAssociations(keywordArray, inputLink, linkCreated, inputUser);
    })
    .then(function() {
      if (userCreated) {
        return helpers.createUserAssociations(inputUser);
      }
    })
    .then(function() {
      helpers.updateSimmilarities();
      res.header('yo');
      res.send('Everything\'s cool');
    })
    .catch(function(err) {
      console.log('Error updating ', err);
      res.send('Error!');
    });
  },

  retrieve: function(req, res, next) {
    username = req.params.userid;
    helpers.getRecommendations(username)
    .then(function(recommendations) {
      res.send(recommendations);
    })
  },

};