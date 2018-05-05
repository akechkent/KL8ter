require('dotenv').load();
var express = require('express');

var http = require('http');
var path = require('path');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
//var uglifyJs = require("uglify-js");
//var fs = require('fs');
var bodyParser = require('body-parser');
var routes = require('./app_server/routes/index');
var routesApi = require('./api/routes/index');
var users = require('./app_server/routes/users');
var app = express();
//var passport = require('passport');
require('./api/models/db');

//require('./api/config/passport');

// view engine setup
app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'jade');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'app_client')));
//app.use(passport.initialize());

app.use('/', routes);
app.use('/api', routesApi);

app.use('/users', users);
 

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
