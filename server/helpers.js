var cheerio = require('cheerio');
var request = require('request-promise');
var Sequelize = require('sequelize');
var db = require('../database/config.js');


var Jaccard = function(vector1, vector2) {
  var mins = [];
  var maxes = [];
  for (var keyWord in vector1) {
    var value1 = vector1[keyWord];
    var value2 = vector2[keyWord];
    value2 = value2 || 0;
    mins.push(Math.min(value1, value2));
    maxes.push(Math.max(value1, value2));
  }
  var add = function(n, m) {
    return n + m;
  };

  mins.reduce(add);
  maxes.reduce(add);
  return mins/maxes;
};

var initialiseSimmilarities = function(simmilarityArray, userId) {
  if (simmilarityArray.length !== 0) {
    return;
  } else {
    var promiseArray = []
    return db.KeyVector.findAll({attributes: ['userId']})
    .then(function(keyVectorArray){
      keyVectorArray.forEach(function(keyVector){
        var id = keyVector.get('userId');
        promiseArray.push(db.Simmilarity.create({
          userId1: userId,
          userId2: id,
        }));
      })
      return Promise.all(promiseArray)
    })
    .then(function(resolveArray){
      return resolveArray;
    })
    .catch(function(err){
      console.log('Error initialising simmilarities ', err);
    });
  }
};

module.exports = {

  getKeywords: function(url) {

    var options = {
      uri: url,
      transform: function(htmlString) {
        return cheerio.load(htmlString);
      },
    };

    return request(options)
    .then(function($) {
      var keywordText = $('meta[name=keywords]').attr('content');
      var keywords = keywordText.split(',');
      return keywords;
    })
    .catch(function(err) {
      console.log('Error getting keywords', err);
    })
  },

  updateVector: function(keywordArray, userId) {
    return db.KeyVector.findOrCreate({where: {userId: userId}})
    .then(function(keyVectorArray) {
      var keyVector = keyVectorArray[0];
      var vector = JSON.parse(keyVector.get('vector'));
      keywordArray.forEach(function(keyword) {
        vector[keyword] ? vector[keyword]++ : vector[keyword] = 1;
      });
      keyVector.set('vector', JSON.stringify(vector));
      keyVector.save();
      return keyVector;
    })
    .catch(function(err) {
      console.log('Error updating keyword vector ', err);
    });
  },
  
  updateSimmilarities: function(userId) {
    var promiseArray = [];
    return db.Simmilarity.findAll({where: Sequelize.or({userId1: userId}, {userId2: userId})})
    .then(function(simmilarityArray) {
      return initialiseSimmilarities(simmilarityArray, userId);
    })
    .then(function(simmilarityArray) {
      simmilarityArray.forEach(function(simmilarity){
        promiseArray.push(db.KeyVector.findById(simmilarity.get('userId1')))
        promiseArray.push(db.KeyVector.findById(simmilarity.get('userId2')));
        Promise.all(promiseArray)
        .then(function(resolveArray){
          var keyVector1 = resolveArray[0];
          var keyVector2 = resolveArray[1];
          var vector1 = JSON.parse(keyVector1['vector']);
          var vector2 = JSON.parse(keyVector2['vector']);
          simmilarity.set('score', Jaccard(vector1, vector2));
        })
        .catch(function(err){
          console.log('Error updating a simmilarity ', err);
        })
      });
    })
    .catch(function(err) {
      console.log('Error updating simmilarities ', err);
    });
  },

  updateRecommendations: function() {
    db.KeyVectors.all().
    then(function(keyVectors){
      keyVectors.forEach(function(keyVector){
        
      })
    })   
  },
}
