var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonfile = require('jsonfile');

// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
  extended: false
})

app.set('port', (process.env.PORT || 5000));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (request, response) {
  response.render('pages/index');
});


var updateDescFile = './data/update.json';

app.route('/update')
  .get(function (request, response) {
    response.render('pages/update');
  })
  .post(urlencodedParser, function (request, response) {
    update = {
      v: new Date().getTime(),
      desc: request.body.desc
    }
    // console.log(request.body.desc, update);
    //response.end('Saved');
    jsonfile.writeFile(updateDescFile, update, function (err) {
      // console.error(err);
      // response.end('Saved');
      response.render('pages/update');
    })
  });

app.get('/api/update', function (request, response) {
  jsonfile.readFile(updateDescFile, function (err, obj) {
    // console.dir(obj)
    response.json(obj);
  })
  // response.json({ na: 'te' });
})
  ;

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});