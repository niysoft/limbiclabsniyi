var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var apiRouter = require('./routes/api'),
    pageRouter = require('./routes/page'),
    environmentVars = require('dotenv').config(),
    app = express(),
    port = process.env.PORT || 8080,
    speech = require('@google-cloud/speech'),
    speechClient = new speech.SpeechClient(),// Creates a client
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    path = require('path'),
    helmet = require('helmet'),
    cookieParser = require('cookie-parser'),
    bodyParser = require("body-parser"),
    session = require('express-session'),
    cors = require('cors'),
    mongoose = require('mongoose'),
    errorhandler = require('errorhandler'),
    mongooseOptions = {useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true},
    autoIncrement = require('mongoose-auto-increment'),
    connection = null,
    connectionString = '',
    userController = require('./controllers/controller.js'),
    recognizeStream = null;

_secretKey = "some-unique-key";

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cors())
app.use(helmet())
app.use(cookieParser())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json()),

    initializeMongo()
    makeRoutes(app)
    // error handler
    handleError(app)


function initializeMongo() {
    //let isDocker = false
    let isDocker = true
    //isProduction = process.env.NODE_ENV === 'production';
    if (isDocker) {
        connectionString = 'mongodb://db:27017/limbiclabs'
    } else {
        connectionString = 'mongodb://localhost:27017/limbiclabs'
        mongoose.set('debug', true);
    }
    connection = mongoose.connect(connectionString, mongooseOptions).then(function () {
        console.log('DB connection made. App listening on: ' + port)
    }).catch(function (err) {

    });
}

function makeRoutes(app) {
    app.use('/', pageRouter);
    app.use('/api', apiRouter);
    app.use('/', function (req, res, next) {
        next(); // console.log(`Request Url: ${req.url}`);
    });
    app.use(function (req, res, next) {
        next(createError(404));
    });
}

function handleError(app) {
    app.use(function (err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });
}

module.exports = app;
