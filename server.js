'use strict'

let express = require('express'), // const bodyParser = require('body-parser'); // const path = require('path');
    fs = require('fs'),
    environmentVars = require('dotenv').config(),
// Google Cloud

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
    isProduction = false,
    recognizeStream = null,
    _secretKey = "some-unique-key";

app.use('/assets', express.static(__dirname + '/public'));
app.use('/session/assets', express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.use(cors())
app.use(helmet())
app.use(cookieParser())
//app.use(compression());

/*app.use(session({secret: 'conduit', cookie: {maxAge: 60000}, resave: false, saveUninitialized: false}));*/
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json()),
    isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
    connectionString = 'mongodb://heroku_k8jg7mpj:b8h5mecg2l4g7osa7pk0f0dfur@ds235658.mlab.com:35658/heroku_k8jg7mpj'
    connection = mongoose.connect(connectionString, mongooseOptions).then(function () {
        console.log('DB connection made:' + port)
    }).catch(function (err) {

    });
} else {
    app.use(errorhandler());
    connectionString = 'mongodb://localhost/limbiclabs' //
    //connectionString = 'mongodb://db:27017/limbiclabs'
    connection = mongoose.connect(connectionString, mongooseOptions).then(function () {
        console.log('DB connection made:' + port)
        // autoIncrement.initialize(connection);
    }).catch(function (err) {

    });
    mongoose.set('debug', true);
}

// =========================== ROUTERS ================================ //
app.post('/api/login', userController.login);
app.post('/api/signup', userController.start_signup);
app.get('/', function (req, res) {
    res.status(SUCCESS_RESPONSE_CODE).render('login')
});
app.get('/:page/', function (req, res) {
    let page = req.params.page;
    let url = req.protocol + "://" + req.headers.host;
    let baseUrl = "";
    if (!url.includes("localhost")) {
        baseUrl = "https://limitless-citadel-62887.herokuapp.com/";
    } else {
        baseUrl = "http://localhost:3000/";
    }
    switch (page) {
        case 'login':
            res.status(SUCCESS_RESPONSE_CODE).render('login')
            break

        case 'logout':
            res.clearCookie('userData', {path: '/'})
            res.clearCookie('accessToken', {path: '/'})
            res.clearCookie('gameId', {path: '/'})
            res.clearCookie('userId', {path: '/'})
            res.status(SUCCESS_RESPONSE_CODE).redirect(baseUrl + 'login')
            break

        case 'signup':
            res.status(SUCCESS_RESPONSE_CODE).render('signup')
            break

        case 'speak':
            res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            try {
                let userDetails = JSON.parse(req.cookies.userData)
                let code = userDetails.code
                if (code == 200) {
                    res.render('speak', {userData: userDetails});
                } else {
                    res.status(SUCCESS_RESPONSE_CODE).redirect(baseUrl + 'login')// res.redirect('/login', {});
                }
            } catch (e) {
                res.status(SUCCESS_RESPONSE_CODE).redirect(baseUrl + 'login')
            }
            break

        default:
            res.status(SUCCESS_RESPONSE_CODE).redirect(baseUrl + 'login')
            break
    }
});
app.use('/', function (req, res, next) {
    next(); // console.log(`Request Url: ${req.url}`);
});

// =========================== SOCKET.IO ================================ //

io.on('connection', function (client) {
    console.log(io.toString() + "====")
    console.log('Client Connected to server through--- socket');
    recognizeStream = null;

    client.on('join', function (data) {
        client.emit('messages', 'Socket Connected to Server');
    });

    client.on('messages', function (data) {
        client.emit('broad', data);
    });

    client.on('startGoogleCloudStream', function (data) {
        startRecognitionStream(client, data);
    });

    client.on('endGoogleCloudStream', function (data) {
        stopRecognitionStream();
    });

    client.on('binaryData', function (data) {
        // console.log(data); //log binary data
        if (recognizeStream !== null) {
            recognizeStream.write(data);
        }
    });

});

function startRecognitionStream(client, data) {
    recognizeStream = speechClient.streamingRecognize(request)
        .on('error', console.error)
        .on('data', (data) => {
            process.stdout.write(
                (data.results[0] && data.results[0].alternatives[0])
                    ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
                    : `\n\nReached transcription time limit, press Ctrl+C\n`);
            client.emit('speechData', data);

            // if end of utterance, let's restart stream
            // this is a small hack. After 65 seconds of silence, the stream will still throw an error for speech length limit
            if (data.results[0] && data.results[0].isFinal) {
                stopRecognitionStream();
                startRecognitionStream(client);
                // console.log('restarted stream serverside');
            }
        });
}

function stopRecognitionStream() {
    if (recognizeStream) {
        recognizeStream.end();
    }
    recognizeStream = null;
}


// =========================== GOOGLE CLOUD SETTINGS ================================ //

// The encoding of the audio file, e.g. 'LINEAR16'
// The sample rate of the audio file in hertz, e.g. 16000
// The BCP-47 language code to use, e.g. 'en-US'
const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US'; //en-US

const request = {
    config: {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: languageCode,
        profanityFilter: false,
        enableWordTimeOffsets: true,
        // speechContexts: [{
        //     phrases: ["hoful","shwazil"]
        //    }] // add your own speech context for better recognition
    },
    interimResults: true // If you want interim results, set this to true
};
// =========================== START SERVER ================================ //

server.listen(port, "127.0.0.1", function () { //http listen, to make socket work
    // app.address = "127.0.0.1";
    console.log('Server started on port:' + port)
    console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS)
});