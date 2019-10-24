const
    service = require('./functions.js'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Game = mongoose.model('Game'),
    GamePlay = mongoose.model('GamePlay'),
    Joi = require('@hapi/joi'),
    // rp = require('request-promise'),
    //axios = require('axios'),
    unirest = require("unirest"),
    moment = require('moment'),
    sha1 = require('sha1'),
    momentTimeZone = require('moment-timezone');
momentTimeZone().tz("Africa/Lagos").format();


module.exports.start_signup = function (req, res) {
    //res.status(SUCCESS_RESPONSE_CODE).json({status:1})
    if (isSet(req.body.fullName) && isSet(req.body.email) && isSet(req.body.password) && isSet(req.body.phone)) {
        const newUser = new User()
        const fullName = req.body.fullName.trim()
        const email = req.body.email.trim()
        const phone = req.body.phone.trim()
        const password = req.body.password.trim()
        const schema = Joi.object().keys({
            fullName: Joi.string().required(),
            email: Joi.string().email({minDomainSegments: 2}),
            // email: Joi.string().required(),
            password: Joi.string().required(),
            phone: Joi.string().min(11).required()
        })
        let data = {fullName, email, password, phone}
        Joi.validate(data, schema, (err, value) => {
                if (err) {
                    res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse)
                } else {
                    let singleFlag = email + "_" + phone
                    newUser.createUser(fullName, phone, email, hashPass(password), singleFlag)
                    newUser.save().then(function (user) {
                        //user.password = null
                        SuccessResponse.response_string = 'Registration started successfully. Please proceed to login'
                        user.password = null
                        SuccessResponse.data = user
                        res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse)
                        /*const phoneVerificationCode = generateVerificationCode()
                        const message = "Hey buddy, welcome to Bingo9ja. Your verification code is: " + phoneVerificationCode
                        sendVerificationCode(phone, message).end(function (response) {
                            if (response.code === 200)//code sent successfully
                            {
                                User.findOneAndUpdate({phone: phone}, {$set: {phoneVerificationCode: phoneVerificationCode}}, {new: true}, function (err, doc) {
                                    if (err) {
                                        handleErrorClient(null, res, "Error! Registration could not continue.")
                                    } else {
                                        SuccessResponse.response_string = "Success! Registration successful. Verification code has been sent to your provide mobile number."
                                        doc.phoneVerificationCode = null
                                        doc.password = null
                                        SuccessResponse.data = doc//{phoneVerificationCode: phone}
                                        res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse)
                                    }
                                })
                            } else {
                                SuccessResponse.response_string = "Success! Registration successfully but verification code not be sent. Please request 'Resend Code' to retry sending it"
                                res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse)
                            }
                        })*/
                    }).catch(function (err) {
                        if (err.code === 11000)
                            ServerErrorResponse.error_string = "Duplicate record exist. Try password reset should you forget your password"
                        else
                            ServerErrorResponse.error_string = "Registration could not proceed. Please retry your action"
                        handleErrorServer(null, res, ServerErrorResponse.error_string)
                    })
                }
            }
        )
    } else {
        handleErrorClient(null, res, "One or more mandatory fields are missing. Please retry your action")
    }
}
module.exports.login = function (req, res) {
    if (isSet(req.body.email) && isSet(req.body.password)) {
        const phone = req.body.email.trim()
        const password = hashPass(req.body.password)
        const accessToken = makeAccessToken()
        let query = User.findOneAndUpdate({
            email: phone,
            password: password,
        }, {$set: {accessToken: accessToken}}, {new: true})
        query.exec().then(function (doc) {  // <- this is the Promise interface.
            if (doc != null) {
                SuccessResponse.response_string = "Success! Login successful."
                SuccessResponse.data = doc
                res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse)
            } else {
                handleErrorServer(null, res, "Error! Invalid login credentials. Please retry with valid details")
            }
        }, function (err) {
            handleErrorServer(null, res, "")
        })

    } else {
        handleErrorClient(null, res, "One or more mandatory fields are missing. Please retry your action")
    }
}
module.exports.logout = function (req, res) {
    if (isSet(req.body.accessToken)) {
        const accessToken = req.body.accessToken
        let query = User.findOneAndUpdate({
            accessToken: accessToken
        }, {$set: {accessToken: ''}}, {new: true})
        query.exec().then(function (doc) {  // <- this is the Promise interface.
            if (doc != null) {
                SuccessResponse.response_string = "Success! Logout successful."
                SuccessResponse.data = {}
                res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse)
            } else {
                handleErrorServer(null, res, "Error! Invalid credentials. Please retry with valid details")
            }
        }, function (err) {
            handleErrorServer(null, res, "")
        })
    } else {
        handleErrorClient(null, res, "One or more mandatory fields are missing. Please retry your action")
    }
}//user_access_logout


function countStudents(height) {
    let count = 0;
    if (height.length == 0)
        return 0;
    if (height.length == 1)
        return 1;
    let newHeight = height.slice();
    newHeight.sort();
    for (let i = 0; i < height.length; i++) {
        if (newHeight[i] != height[i])
            count++;
    }
    console.log(count);
    return
    // Write your code here
}

module.exports.play_game = async function (req, res) {
    let newGamePlay = new GamePlay()
    if (isSet(req.body.gameType) && isSet(req.body.gameId) && isSet(req.body.playerId)
        && isSet(req.body.stakeAmount) && isSet(req.body.pick) && isSet(req.body.spot) && isSet(req.body.accessToken)) {
        let pick = req.body.pick
        let gameType = req.body.gameType
        let stakeAmount = parseFloat(req.body.stakeAmount)
        let playerId = req.body.playerId
        let gameId = req.body.gameId
        let spot = req.body.spot
        let initialBalance = 0
        let finalBalance = 0
        let flag = false
        let pickArray = JSON.parse("[" + pick + "]")
        switch (gameType) {
            case 'PICK_THREE':
                flag = (pickArray.length === 3)
                break

            case 'PICK_FOUR'://Mega bingo
                flag = (pickArray.length === 4)
                break

            case 'MEGA_BINGO'://Mega bingo
                flag = (pickArray.length === 6)//BINGO_PERM
                break

            case 'BINGO_PERM'://Mega bingo
                flag = (pickArray.length === 5)//
                break

            case 'KENO'://Mega bingo
                flag = (pickArray.length === parseInt(spot))//
                break

            default:
                flag = false
        }
        if (flag) {
            User.find({'_id': req.body.accessToken}).then(user_ => {
                if (user_ != null) {
                    let user = user_[0]
                    initialBalance = parseFloat(user.accountBalance)
                    finalBalance = initialBalance - stakeAmount
                    if (finalBalance > 1) {
                        let query = User.findOneAndUpdate({'_id': req.body.playerId},
                            {$set: {accountBalance: parseFloat(finalBalance)}},
                            {new: true})
                        query.exec().then(function (user) {  // <- this is the Promise interface.
                            if (user != null) {
                                newGamePlay.createGamePlay(//gameType, gameId, playerId, initialBalance, stakeAmount, finalBalance, pick, spot
                                    gameType, gameId, playerId, initialBalance, stakeAmount, finalBalance, pick, spot
                                )
                                newGamePlay.save()
                                    .then(function (game) {
                                        SuccessResponse.response_string = "Success! Your game was successful"
                                        SuccessResponse.data = game
                                        res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse)
                                    }).catch(err => handleErrorClient(null, res, err.toString()))
                            } else {
                                handleErrorServer(null, res, "Error! phone could not be updated at the moment")
                            }
                        }, function (err) {
                            handleErrorServer(null, res, "Error! Error finding player by specified details")
                        })
                    } else {
                        handleErrorClient(null, res, "Error! Insufficient account balance. game could not be initiated")
                    }
                } else {
                    handleErrorClient(null, res, "Can't find user specified as player")
                }
            }).catch(err => handleErrorClient(null, res, "Error! Error finding player by specified details"))
        } else {
            handleErrorClient(null, res, "Invalid game request. Please retry your action")
        }
    } else {
        handleErrorClient(null, res, "One or more mandatory fields are missing. Please retry your action")
    }
}

module.exports.load_balance = function (req, res) {//
    service.userUpdatePin(req, res)
}

module.exports.load_transaction_history = function (req, res) {//
    service.userUpdatePassword(req, res)
}

module.exports.load_game_history = function (req, res) {//

}
module.exports.fund_wallet = function (req, res) {//

}
module.exports.load_game_history = function (req, res) {//

}

function makeAccessToken(pass, phone) {
    return sha1(pass + phone + moment() + generateVerificationCode())
}

function handleErrorClient(err, res, message) {
    if (message != "") {
        ClientErrorResponse.error_string = message
    } else {
        ClientErrorResponse.error_string = "Error! Something went wrong. Request could not continue."
    }
    res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse)
}

function handleErrorServer(err, res, message) {
    if (err != null && err.code == 11000) {
        ServerErrorResponse.error_string = "Error! Duplicate key update discovered. Please retry"
    } else if (message != "") {
        // console.log(message)
        ServerErrorResponse.error_string = message
    } else {
        ServerErrorResponse.error_string = "Error! Something went wrong. Request could not continue."
    }
    res.status(SERVER_ERROR_RESPONSE_CODE).json(ServerErrorResponse)
}

function sendVerificationCode(phone, message) {
    let req = unirest("POST", "https://nexmo-nexmo-messaging-v1.p.rapidapi.com/send-sms")
    req.query({
        "text": message,
        "from": "Bingo9ja",
        "to": phone
    })
    req.headers({
        "x-rapidapi-host": "nexmo-nexmo-messaging-v1.p.rapidapi.com",
        "x-rapidapi-key": "f676b36206mshd98e3c1ffdd7e7ap109bb1jsnbd2648fee358",
        "content-type": "application/x-www-form-urlencoded"
    })
    req.form({})
    return req
}

function hashPass(item) {
    return sha1(item)
}

isSet = function (item) {
    return (typeof item !== "undefined")
}
generateVerificationCode = function () {
    var numbers = ""
    for (var i = 0; i < 6; i++) {
        numbers += "" + Math.floor(Math.random() * (9 - 0 + 1) + 0)
    }
    return numbers
}

generatePassword = function () {
    var numbers = ""
    for (var i = 0; i < 8; i++) {
        numbers += "" + Math.floor(Math.random() * (9 - 0 + 1) + 0)
    }
    return numbers
}


makeDateFlag = function (today) {
    let firstExplode = today.split(",");
    let secondExplode = firstExplode[0].trim().split("/")
    return secondExplode[2] + "_" + secondExplode[0] + "_" + secondExplode[1];
}
