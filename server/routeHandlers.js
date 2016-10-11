
var Promise = require('bluebird');
var db = require('../database/config.js');
var helpers = require('./helpers.js');

module.exports = {
  update: function(req, res, next) {
    var url = req.body.url;
    var userId = req.params.userid;
    var promiseArray = []
    helpers.getKeywords(url)
    .then(function(keywords){
      promiseArray.push(helpers.updateVector(keywords, userId));
      var keyString = JSON.stringify(keywords);
      promiseArray.push(db.Link.findOrCreate({where: {url: url, keywords: keyString}}));
      return Promise.all(promiseArray);
    })
    .then(function(resolveArray) {
      var keyVector = resolveArray[0];
      var link = resolveArray[1][0];
      link.addKeyVector(keyVector);
    })
    .then(function(){
      return helpers.updateSimmilarities(userId);
    })
    .then(function(){
      helpers.updateRecommendations();
    })
    .then(function(){
      res.status(204).send();
    })
    .catch(function(err){
      console.log('Error updating recommender state ', err);
    })
  },

  retrieve: function(req, res, next) {
    var userId = req.params.userid;
    db.KeyVector.findById(userId)
    .then(function(keyVector) {
      res.send(JSON.parse(keyVector.get('recommendations')));
    });
  },
};