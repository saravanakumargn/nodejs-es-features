var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonfile = require('jsonfile');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require('./db');

// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
  extended: false
})

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
  function (username, password, cb) {
    db.users.findByUsername(username, function (err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
  }));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function (user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
  db.users.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});


app.set('port', (process.env.PORT || 5000));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function (request, response) {
  response.render('pages/index', { user: request.user });
});

app.get('/login',
  function (req, res) {
    res.render('pages/login');
  });

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/admin/home');
  });

app.get('/logout',
  function (req, res) {
    req.logout();
    res.redirect('/');
  });

var pathEndpoint = '';
if (process.env.NODE_ENV == 'production') {
  pathEndpoint = './data/production';
}
else {
  pathEndpoint = './data/dev';
}
var updateDescFile = `${pathEndpoint}/update.json`;
var updateAgentsFile = `${pathEndpoint}/agents.json`;
var updateDataFile = `${pathEndpoint}/data.json`;

function requireLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect("/login");
  }
}


app.all("/admin/*", requireLogin, function (req, res, next) {
  next(); // if the middleware allowed us to get here,
  // just move on to the next route handler
});

app.get('/admin/home',
  function (req, res) {
    res.render('pages/admin/index', { user: req.user });
  });

app.get('/admin/profile',
  function (req, res) {
    res.render('pages/admin/profile', { user: req.user });
  });


app.route('/admin/update')
  .get(function (request, response) {
    response.render('pages/admin/update', { user: request.user });
  })
  .post(urlencodedParser, function (request, response) {
    update = {
      v: new Date().getTime(),
      desc: request.body.desc
    }
    jsonfile.writeFile(updateDescFile, update, function (err) {
      response.redirect('/admin/home');
    })
  });

app.route('/admin/agents-update')
  .get(function (request, response) {
    response.render('pages/admin/agents-update', { user: request.user });
  })
  .post(urlencodedParser, function (request, response) {
    jsonfile.writeFile(updateAgentsFile, JSON.parse(request.body.agents), function (err) {
      response.redirect('/admin/home');
    })
  });

app.route('/admin/data-update')
  .get(function (request, response) {
    response.render('pages/admin/data-update', { user: request.user });
  })
  .post(urlencodedParser, function (request, response) {
    jsonfile.writeFile(updateDataFile, JSON.parse(request.body.jsdata), function (err) {
      response.redirect('/admin/home');
    })
  });

app.get('/api/v1/update', function (request, response) {
  jsonfile.readFile(updateDescFile, function (err, obj) {
    response.json(obj);
  })
});

app.get('/api/v1/agents', function (request, response) {
  jsonfile.readFile(updateAgentsFile, function (err, obj) {
    response.json(obj);
  })
});

app.get('/api/v1/data', function (request, response) {
  jsonfile.readFile(updateDataFile, function (err, obj) {
    response.json(obj);
  })
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});