var handlers = require('./routeHandlers');

module.exports = function(app){

  app.get('/', function(req, res, next) {
    res.send('Here I am.');
  })

  app.post('/rec/link/:userid', handlers.update);
  app.get('/rec/:userid', handlers.retrieve);  
}