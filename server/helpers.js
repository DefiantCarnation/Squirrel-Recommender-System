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

  var numerator = mins.reduce(add);
  var denominator = maxes.reduce(add);
  return numerator/denominator;
};

var initialiseSimmilarities = function(simmilarityArray, userId) {
  if (simmilarityArray.length !== 0) {
    return simmilarityArray;
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

var findGreatest = function(index) {
  var max = 0;
  var greatest = '';
  for (var key in index) {
    if (index[key] > max) {
      greatest = key;
      max = index[key];
    }
  }
  return greatest;
}

var indexToOrderedArray = function(index) {
  var orderedArray = [];
  for (var key in index) {
    orderedArray.push(findGreatest(index));
    index[key] = 0;
  }
  return orderedArray;
}

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
      var keywords = keywordText.split(',').map(function(keyword){
        return keyword.trim();
      });
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
    return db.Simmilarity.findAll({where: {userId1: userId}})
    .then(function(simmilarityArray) {
      return initialiseSimmilarities(simmilarityArray, userId);
    })
    .then(function(simmilarityArray) {
      simmilarityArray.forEach(function(simmilarity) {
        promiseArray.push(db.KeyVector.findById(userId));
        promiseArray.push(db.KeyVector.findById(simmilarity.get('userId2')));
        Promise.all(promiseArray)
        .then(function(resolveArray) {
          var keyVector1 = resolveArray[0];
          var keyVector2 = resolveArray[1];
          var vector1 = JSON.parse(keyVector1['vector']);
          var vector2 = JSON.parse(keyVector2['vector']);
          simmilarity.set('score', Jaccard(vector1, vector2));
          simmilarity.save();
        })
        .catch(function(err) {
          console.log('Error updating a simmilarity ', err);
        })
      });
    })
    .catch(function(err) {
      console.log('Error updating simmilarities ', err);
    });
  },

  updateRecommendations: function() {
    var threshold = 3;
    db.KeyVector.all()
    .then(function(keyVectorArray) {
      keyVectorArray.forEach(function(keyVectorMain) {
        var id = keyVectorMain.get('userId');
        var urlCount = {};
        db.Simmilarity.findAll({where: {userId1: id}, order: [['score', 'DESC']]})
        .then(function(simmilarityArray) {
          var simmilars = simmilarityArray.slice(0, threshold);
          var promiseArray = [];
          simmilars.forEach(function(simmilarity) {
            promiseArray.push(
              db.KeyVector.findById(simmilarity.get('userId2'))
              .then(function(keyVector) {
                return keyVector.getLinks();
              })
              .then(function(linkArray) {
                linkArray.forEach(function(link) {
                  var url = link.get('url');
                  urlCount[url] ? urlCount[url]++ : urlCount[url] = 1;
                })
              })
            );
          });
          return Promise.all(promiseArray);
        })
        .then(function(){
          return keyVectorMain.getLinks();
        })
        .then(function(linkArrayMain){
          var urlsMain = linkArrayMain.map(function(link){
            return link.get('url');
          });

          var recs = indexToOrderedArray(urlCount).filter(function(url) {
            if (urlsMain.indexOf === -1) {
              return true;
            } else {
              return false;
            }
          });

          keyVectorMain.set('recommendations', JSON.stringify(recs));
          keyVectorMain.save();    
        });
      });
    })   
  },

};
