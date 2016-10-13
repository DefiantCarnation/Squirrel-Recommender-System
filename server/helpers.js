var cheerio = require('cheerio');
var request = require('request-promise');
var Sequelize = require('sequelize');
var db = require('../database/config.js');


var makeVector = function(userId) {
  var vector = {};
  return db.KeyVector.findAll({
    where: {
      userId: userId
    }
  })
  .then(function(keyVectorArray) {
    var promiseArray = [];
    keyVectorArray.forEach(function(keyVector) {
      promiseArray.push(db.Keyword.findById(keyVector.get('keywordId'))
      .then(function(keyword) {
        var word = keyword.get('word');
        vector[word] = keyVector.get('strength');
      }));
    });
    return Promise.all(promiseArray)
  })
  .then(function() {
    return vector;
  })
  .catch(function(err) {
    console.log('Error making vector ', err);
  })
};

var jaccard = function(vector1, vector2) {
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

var makeUrlCounter = function(userId, threshold) {
  var urlCounter = {};

  return db.Simmilarity.findAll({
    where: {userId: userId},
    order: [['score', 'DESC']]
  })
  .then(function(simmilarityArray) {
    var mostSimilar = simmilarityArray.slice(0, threshold);
    var promiseArray = [];
    mostSimilar.forEach(function(simmilarity) {
      promiseArray.push(db.User.findById(simmilarity.get('otherUserId'))
      .then(function(user) {
        return user.getStashedLinks()
      })
      .then(function(linksArray) {
        linksArray.forEach(function(link) {
          var url = link.get('url');
          urlCounter[url] ? urlCounter[url]++ : urlCounter[url] = 1;
        })
      }));
    });
    return Promise.all(promiseArray);
  })
  .then(function() {
    return urlCounter;
  })
  .catch(function(err) {
    console.log('Error creating url Counter ', err);
  })
};

counterToArray = function(counter) {
  var keyArray = Object.keys(counter);
  keyArray.sort(function(key1, key2) {
    return counter[key2] - counter[key1]
  });
  return keyArray;
}

module.exports = {

  makeLink: function(url) {
    return db.Link.findOrCreate({
      where: {
        url: url,
      }
    }).spread(function(link, created) {
      return [link, created];
    });
  },

  makeUser: function(username, link) {
    return db.User.findOrCreate({
      where: {
        username: username,
      }
    })
    .spread(function(user, created){
      user.addStashedLink(link);
      return [user, created];
    });
  },

  getWords: function(url) {
    var options = {
      uri: url,
      transform: function(htmlString) {
        return cheerio.load(htmlString);
      },
    };
    return request(options)
    .then(function($) {
      var keywordText = $('meta[name=keywords]').attr('content');
      console.log('keyword text', keywordText);
      var words = keywordText.split(',').map(function(keyword){
        return keyword.trim();
      });
      return words;
    })
    .catch(function(err) {
      console.log('Error getting words ', err);
    });
  },

  makeKeyWords: function(wordArray) {
    var promiseArray = [];
    wordArray.forEach(function(word) {
      word = word.slice(0, 20);
      promiseArray.push(db.Keyword.findOrCreate({
        where: {
          word: word
        }
      }));
    });
    return Promise.all(promiseArray);
  },

  createKeyAssociations: function(keywordArray, link, linkCreated, user) {
    keywordArray = keywordArray.map(function(keywordTuple) {
      return keywordTuple[0];
    });
    var promiseArray = [];
    if (linkCreated) {
      promiseArray.push(link.addKeywords(keywordArray));
    }
    keywordArray.forEach(function(keyword){
      user.hasKeyword(keyword)
      .then(function(boolean) {
        if (!boolean) {
          promiseArray.push(user.addKeyword(keyword));
        } else {
          promiseArray.push(db.KeyVector.find({
            where: {
              userId: user.get('id'),
              keywordId: keyword.get('id'),
            }
          })
          .then(function(keyVector) {
            var newStrength = keyVector.get('strength') + 1;
            keyVector.set('strength', newStrength);
            keyVector.save();
          })
          .catch(function(err) {
            console.log('Error making new association between keyword and user', err);
          }));
        }
      })
      .catch(function(err){
        console.log('Error association user and keyword', err);
      })
      return Promise.all(promiseArray);
    })
  },

  createUserAssociations: function(user) {
    return db.User.all()
    .then(function(userArray) {
      console.log('the user Array\n', userArray);
      return user.setOtherUsers(userArray);
    })
    .then(function() {
      user.save();
    })
    .catch(function(err) {
      console.log('Error creating user association', err);
    });
  },

  updateSimmilarities: function() {
    var outerPromiseArray = [];
    db.Simmilarity.all()
    .then(function(simmilarityArray) {
      simmilarityArray.forEach(function(simmilarity) {
        var userId1 = simmilarity.get('userId');
        var userId2 = simmilarity.get('otherUserId');
        var innerPromiseArray = [makeVector(userId1), makeVector(userId2)];
        outerPromiseArray.push(Promise.all(innerPromiseArray)
        .then(function(resolveArray) {
          var vector1 = resolveArray[0];
          var vector2 = resolveArray[1];
          var score = jaccard(vector1, vector2);
          simmilarity.set('score', score);
          simmilarity.save();
        }));
      });
    });
    return Promise.all(outerPromiseArray);
  },

  getRecommendations: function(username) {
    return db.User.find({
      where: {username: username},
    })
    .then(function(user) {
      var userId = user.get('id');
      return makeUrlCounter(userId, 5);
    })
    .then(function(urlCounter) {
      return counterToArray(urlCounter);
    })
    .catch(function(err) {
      console.log('Error getting recommendations ', err);
    })
  },

};
