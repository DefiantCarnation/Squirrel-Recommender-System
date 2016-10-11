var express = require('express');
var bodyParser = require('body-parser');
var db = require('../database/config').database;
var routes = require('./routes');


db.authenticate()
.then(function() {
  console.log('Connected to databse');
})
.catch(function(err) {
  console.log('Error connecting to databse, ', err)
})

// db.sync({force: true})
// .then(function(){
//   console.log('Sync successful')
// })
// .catch(function(err){
//   console.log('err syncing', err);
// });

var app = express();
app.use(bodyParser.json());

routes(app);

var port = process.env.PORT || 3121;


app.listen(port, function() {
  console.log('app listening on port ', + port);
});

