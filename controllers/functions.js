//const config = require('../configs/local')
const config = require('../configs')
var request = require("request");
const axios = require('axios');
//const {check, validationResult} = require('express-validator');
const Joi = require('@hapi/joi');
const sha1 = require('sha1');
const moment = require('moment')

const mysql = require('mysql');
const connection = mysql.createPool(config);
module.exports = connection;

const mongoose = require('mongoose');
require('../models/Models.js');
//const User = mongoose.model('User');



module.exports.submitSignupDetails = function (req, res) {/*
    const newUser = new User();
    newUser.fullName = "Adeniyi Salaudeen"
    newUser.username = "Adeniyi Salaudeen"
    newUser.email = "niyi2ous1@gmail.com"
    newUser.password = "niyious@gmail.com"*/
    newUser.save().then(function (product) {
        res.status(200).send({status: 1, saved:true})
    }).catch(function (err) {
        res.status(400).send({status: 0, saved:false, error:err})
    })

    return
    if (isSet(req.body.fullName) && isSet(req.body.email) && isSet(req.body.password)) {
        const fullName = req.body.fullName.trim();
        const email = req.body.email.trim();
        const password = hashPass(req.body.password.trim());
        const schema = Joi.object().keys({
            fullName: Joi.string().required(),
            email: Joi.string().required(),
            password: Joi.string().required(),
        });
        let data = {fullName, email, password};
        Joi.validate(data, schema, (err, value) => {
                if (err) {
                    res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                } else {
                    let stmt = `INSERT INTO users (fullName, email, password) VALUES(?, ?, ?)`;
                    let param = [fullName, email, password];
                    connection.query(stmt, param, (err, results, fields) => {
                        if (err) {
                            console.log(err)
                            ServerErrorResponse.error_string = "Registration could not proceed. Please retry your action";
                            if (err.errno === 1062) {
                                ServerErrorResponse.error_string = "Provided email/mobile number is already registered. Please proceed to login page to continue";
                            }
                            res.status(SERVER_ERROR_RESPONSE_CODE).json(ServerErrorResponse);
                        } else {
                            SuccessResponse.response_string = 'Registration started successfully. Please proceed to the next stage';
                            SuccessResponse.data = {id: results.insertId};
                            res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                        }
                    });
                }
            }
        );
    } else {
        ClientErrorResponse.error_string = "Error! One or more fields are missing!"
        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
    }
}
module.exports.sendVerificationCode = function (req, res) {
    const phone = req.body.phone;
    const id = req.body.id;
    const schema = Joi.object().keys({
        phone: Joi.number().required(),
        id: Joi.number().required()
    });
    let data = {phone, id};
    Joi.validate(data, schema, (err, value) => {
        if (err) {
            res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
        } else {
            try {
                const phoneVerificationCode = generateVerificationCode();

                req.body.phoneVerificationCode = phoneVerificationCode;
                const fields = ['phone', 'phoneVerificationCode'];
                //const values = [phone, phoneVerificationCode];
                let condition = 'WHERE id = ' + id + ' LIMIT 1';
                WaitForRunUpdateQuery(req.body, res, fields, 'users', condition).then(function (result) {
                    if (result) {
                        let unirest = require("unirest");
                        let req = unirest("POST", "https://nexmo-nexmo-messaging-v1.p.rapidapi.com/send-sms");
                        req.query({
                            "text": "Hey buddy, welcome to Dyces. Your code is: " + phoneVerificationCode,
                            "from": "Dyces",
                            "to": phone
                        });
                        req.headers({
                            "x-rapidapi-host": "nexmo-nexmo-messaging-v1.p.rapidapi.com",
                            "x-rapidapi-key": "f676b36206mshd98e3c1ffdd7e7ap109bb1jsnbd2648fee358",
                            "content-type": "application/x-www-form-urlencoded"
                        });
                        req.form({});
                        req.end(function (ress) {
                            if (res.error) {
                                ClientErrorResponse.error_string = "Error! Registration could not continue."
                                res.status(SERVER_ERROR_RESPONSE_CODE).json(ServerErrorResponse);
                            } else {
                                SuccessResponse.response_string = "Success! Verification code was sent successfully."
                                SuccessResponse.data = {id: id, phoneVerificationCode: phoneVerificationCode}
                                res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                            }
                        });


                        /*client.messages.create({
                            body: 'Welcome to Dyces. Your verification is: ' + phoneVerificationCode,
                            to: phone,  // Text this number
                            from: TWILIO_PHONE // From a valid Twilio number
                        }).then(
                            (message) => {
                                SuccessResponse.response_string = "Success! Verification code was sent successfully."
                                SuccessResponse.data = {id: id, phoneVerificationCode: phoneVerificationCode}
                                res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                            }
                        ).catch(error => {
                            ClientErrorResponse.error_string = "Error! Registration could not continue."
                            res.status(SERVER_ERROR_RESPONSE_CODE).json(ServerErrorResponse);
                        });*/
                    } else {
                        ClientErrorResponse.error_string = "Error! Registration could not continue."
                        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                    }
                });
            } catch (e) {
                ServerErrorResponse.error_string = "Error! Registration could not proceed. Please retry your action";
                res.status(SERVER_ERROR_RESPONSE_CODE).json(ServerErrorResponse);
            }
        }
    });

}
module.exports.verifyVerificationCode = function (req, res) {
    if (isSet(req.body.id) && isSet(req.body.phoneVerificationCode)) {
        const id = req.body.id.trim();
        const phoneVerificationCode = req.body.phoneVerificationCode.trim();
        const schema = Joi.object().keys({
            id: Joi.number().required(),
            phoneVerificationCode: Joi.number().required(),
        });
        let data = {id, phoneVerificationCode};
        Joi.validate(data, schema, (err, value) => {
            if (err) {
                ClientErrorResponse.error_string = "Invalid details provided. Please retry your action"
                res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
            } else {
                try {
                    let stmt = `SELECT * FROM users WHERE id = ? AND phoneVerificationCode = ? LIMIT 1`;
                    let param = [id, phoneVerificationCode];
                    connection.query(stmt, param, (err, results, fields) => {
                        if (err) {
                            ClientErrorResponse.error_string = "Invalid details provided. Please retry your action"
                            res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                        } else {
                            if (results.length === 1) {
                                results[0].isMobileVerified = 1;
                                results[0].password = null;
                                SuccessResponse.data = results;
                                SuccessResponse.response_string = "Phone verification successful"
                                stmt = 'UPDATE users SET isMobileVerified = 1 WHERE  id = ? AND phoneVerificationCode = ? LIMIT 1';
                                connection.query(stmt, param, (err, results, fields) => {
                                    if (!err) {
                                        res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                                    }
                                });
                            } else {
                                ClientErrorResponse.error_string = "Invalid verification code"
                                res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                            }
                        }
                    });
                } catch (e) {
                    ClientErrorResponse.error_string = "Invalid verification code"
                    res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                }
            }
        });
    } else {
        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
    }
}
module.exports.userLogin = function (req, res) {
    if (isSet(req.body.phoneEmail) && isSet(req.body.password)) {
        const phoneEmail = req.body.phoneEmail.trim();
        const password = hashPass(req.body.password.trim());
        let stmt = `SELECT * FROM users WHERE (phone = ? ||  email = ?) AND password = ? LIMIT 1`;
        const param = [phoneEmail, phoneEmail, password];
        connection.query(stmt, param, (err, details, fields) => {
            if (!err) {
                if (details.length === 1) {
                    const accessToken = makeAccessToken(password);
                    details[0].accessToken = accessToken;//details
                    details[0].password = "";//details
                    let stmt = `UPDATE users SET accessToken = ? WHERE (phone = ? ||  email = ?) LIMIT 1`;
                    const param = [accessToken, phoneEmail, phoneEmail];
                    connection.query(stmt, param, (err, results, fields) => {
                        if (!err) {
                            connection.query(stmt);
                            SuccessResponse.response_string = "Success! Login successful";
                            SuccessResponse.data = details;
                            res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                        } else {
                            res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                        }
                    });
                } else {
                    ClientErrorResponse.error_string = "Invalid login credentials. Please retry your action"
                    res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                }
            } else {
                res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
            }
        });
    } else {

        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
    }
}
module.exports.userLogout = function (req, res) {
    if (isSet(req.body.phoneEmail) && isSet(req.body.accessToken)) {
        const phoneEmail = req.body.phoneEmail.trim();
        const accessToken = req.body.accessToken.trim()
        let stmt = `UPDATE users SET accessToken = ? WHERE (phone = ? ||  email = ?) AND accessToken = ? LIMIT 1`;
        const newtoken = "";
        const param = [newtoken, phoneEmail, phoneEmail, accessToken];
        connection.query(stmt, param, (err, results, fields) => {
            if (!err) {
                if (results.affectedRows === 1) {
                    SuccessResponse.response_string = 'Logout successful. Enjoy!';
                    SuccessResponse.data = {};
                    res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                } else {
                    res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                }
            } else {
                res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
            }
        });
    } else {
        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
    }
}
module.exports.userUpdateProfileDetails = function (req, res) {
    const fields = ['address', 'dob', 'email'];
    if (isSet(req.body.address) && isSet(req.body.dob) && isSet(req.body.email) && isSet(req.body.accessToken)) {
        const address = req.body.address.trim();
        const dob = req.body.dob.trim();
        const email = req.body.email.trim();
        const schema = Joi.object().keys({
            email: Joi.string().email().required(),
        });
        let data = {email};
        Joi.validate(data, schema, (err, value) => {
            if (err) {
                ClientErrorResponse.error_string = "Invalid details provided. Please retry your action"
                res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
            } else {
                let condition = 'WHERE accessToken = "' + req.body.accessToken + '" LIMIT 1';
                WaitForRunUpdateQuery(req.body, res, fields, 'users', condition).then(function (result) {
                    if (result) {
                        SuccessResponse.response_string = "Update operation was successful"
                        res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                    } else {
                        ClientErrorResponse.error_string = "Error! Update operation could not be completed."
                        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                    }
                });
            }
        });
    } else {
        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
    }
}//userSetPin
module.exports.userSetPin = function (req, res) {//userResetPin
    if (isSet(req.body.transactionPin) && isSet(req.body.accessToken)) {
        const transactionPin = req.body.transactionPin.trim();
        const accessToken = req.body.accessToken.trim();
        const schema = Joi.object().keys({
            accessToken: Joi.string().required(),
            transactionPin: Joi.number().required(),
        });
        let data = {transactionPin, accessToken};
        Joi.validate(data, schema, (err, value) => {
            if (err) {
                ClientErrorResponse.error_string = "Invalid details provided. Please retry your action"
                res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
            } else {
                //console.log(req.body);
                req.body.transactionPin = hashPin(req.body.transactionPin);
                let condition = 'WHERE accessToken = "' + accessToken + '" LIMIT 1';
                const fields = ['transactionPin'];
                WaitForRunUpdateQuery(req.body, res, fields, 'users', condition).then(function (result) {
                    if (result) {
                        SuccessResponse.response_string = "Success! Pin set successfully"
                        res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                    } else {
                        ClientErrorResponse.error_string = "Error! Pin could not be set at the moment"
                        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                    }
                });
            }
        });
    } else {
        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
    }
}//userSetPin
module.exports.userResetPin = function (req, res) {//userResetPin
    if (isSet(req.body.phone) && isSet(req.body.dob) && isSet(req.body.bvn) && isSet(req.body.accessToken)) {
        const phone = req.body.phone.trim();
        const dob = req.body.dob.trim();
        const bvn = req.body.bvn.trim();
        const accessToken = req.body.accessToken.trim();
        const schema = Joi.object().keys({
            phone: Joi.number().required(),
            dob: Joi.string().required(),
            bvn: Joi.number().required(),
            accessToken: Joi.string().required(),
        });
        let data = {phone, dob, bvn, accessToken};
        Joi.validate(data, schema, (err, value) => {
            if (err) {
                res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
            } else {
                console.log(req.body);
                req.body.phoneVerificationCode = generateVerificationCode();
                let condition = 'WHERE accessToken = "' + accessToken + '" AND bvn = "' + bvn + '" AND dob = "' + dob + ' "LIMIT 1';
                const fields = ['phoneVerificationCode'];
                WaitForRunUpdateQuery(req.body, res, fields, 'users', condition).then(function (result) {
                    if (result) {
                        //res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                        client.messages.create({
                            body: 'Hi, your PIN reset code is : ' + req.body.phoneVerificationCode,
                            to: phone,  // Text this number
                            from: TWILIO_PHONE // From a valid Twilio number
                        }).then(
                            (message) => {
                                SuccessResponse.response_string = "Success! Pin reset code was sent successfully"
                                res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                            }
                        ).catch(error => {
                            ServerErrorResponse.error_string = "Error! PIN reset code could not be sent at the moment."
                            res.status(SERVER_ERROR_RESPONSE_CODE).json(ServerErrorResponse);
                        });
                    } else {
                        ServerErrorResponse.error_string = "Error! PIN reset code could not be sent at the moment."
                        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                    }
                });
            }
        });
    } else {
        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
    }
}//userSetPin
module.exports.userUpdatePin = function (req, res) {//userResetPin
    if (isSet(req.body.phoneVerificationCode) && isSet(req.body.accessToken) && isSet(req.body.transactionPin)) {
        const phoneVerificationCode = req.body.phoneVerificationCode.trim();
        const accessToken = req.body.accessToken.trim();
        const transactionPin = req.body.transactionPin.trim();
        const schema = Joi.object().keys({
            phoneVerificationCode: Joi.number().required(),
            accessToken: Joi.string().required(),
            transactionPin: Joi.number().required(),

        });
        let data = {phoneVerificationCode, accessToken, transactionPin};
        Joi.validate(data, schema, (err, value) => {
            if (err) {
                res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
            } else {
                // console.log(req.body);
                req.body.transactionPin = hashPin(req.body.transactionPin);
                req.body.phoneVerificationCode = '';//set verification code to empty afterwards
                let condition = 'WHERE accessToken = "' + accessToken + '" AND phoneVerificationCode = "' + phoneVerificationCode + '" LIMIT 1';
                const fields = ['transactionPin', 'phoneVerificationCode'];
                WaitForRunUpdateQuery(req.body, res, fields, 'users', condition).then(function (result) {
                    if (result) {
                        SuccessResponse.response_string = "Success! Pin updated successfully"
                        res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                    } else {
                        ClientErrorResponse.error_string = "Error! Pin could not be updated at the moment"
                        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                    }
                });
            }
        });
    } else {
        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
    }
}//userSetPin
module.exports.userResetPass = function (req, res) {//userResetPin
    if (isSet(req.body.phone)) {//&& isSet(req.body.dob) && isSet(req.body.bvn) && isSet(req.body.accessToken)
        const phone = req.body.phone.trim();
        /* const dob = req.body.dob.trim();
         const bvn = req.body.bvn.trim();
         const accessToken = req.body.accessToken.trim();*/
        const schema = Joi.object().keys({
            phone: Joi.number().required(),
            /* dob: Joi.string().required(),
             bvn:Joi.number().required(),
             accessToken: Joi.string().required(),*/
        });
        let data = {phone};//, dob, bvn, accessToken
        Joi.validate(data, schema, (err, value) => {
            if (err) {
                res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
            } else {
                console.log(req.body);
                req.body.phoneVerificationCode = generateVerificationCode();
                let condition = 'WHERE phone = "' + phone + '" LIMIT 1';
                const fields = ['phoneVerificationCode'];
                WaitForRunUpdateQuery(req.body, res, fields, 'users', condition).then(function (result) {
                    if (result) {
                        //res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                        client.messages.create({
                            body: 'Hi, your password reset code is : ' + req.body.phoneVerificationCode,
                            to: phone,  // Text this number
                            from: TWILIO_PHONE // From a valid Twilio number
                        }).then(
                            (message) => {
                                SuccessResponse.response_string = "Success! Password reset code was sent successfully"
                                res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                            }
                        ).catch(error => {
                            ServerErrorResponse.error_string = "Error! Password reset code could not be sent at the moment."
                            res.status(SERVER_ERROR_RESPONSE_CODE).json(ServerErrorResponse);
                        });
                    } else {
                        ServerErrorResponse.error_string = "Error! Password reset code could not be sent at the moment."
                        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                    }
                });
            }
        });
    } else {
        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
    }
}//userUpdatePassword
module.exports.userUpdatePassword = function (req, res) {//userResetPin
    if (isSet(req.body.phoneVerificationCode) && isSet(req.body.password)) {//&& isSet(req.body.dob) && isSet(req.body.bvn) && isSet(req.body.accessToken)

        const phoneVerificationCode = req.body.phoneVerificationCode.trim();
        const password = req.body.password;
        const schema = Joi.object().keys({
            phoneVerificationCode: Joi.number().required(),
            password: Joi.string().required(),
        });
        let data = {phoneVerificationCode, password};//, dob, bvn, accessToken
        Joi.validate(data, schema, (err, value) => {
            if (err) {

                res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
            } else {
                //console.log(req.body);
                req.body.password = hashPass(req.body.password);
                req.body.phoneVerificationCode = '';
                let condition = 'WHERE phoneVerificationCode = "' + phoneVerificationCode + '" LIMIT 1';
                const fields = ['password', 'phoneVerificationCode'];
                WaitForRunUpdateQuery(req.body, res, fields, 'users', condition).then(function (result) {
                    if (result) {
                        SuccessResponse.response_string = "Success! Password was updated successfully"
                        res.status(SUCCESS_RESPONSE_CODE).json(SuccessResponse);
                    } else {
                        // console.log(req.body);
                        ServerErrorResponse.error_string = "Error! Password could not be updated the moment."
                        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
                    }
                });
            }
        });
    } else {
        res.status(CLIENT_ERROR_RESPONSE_CODE).json(ClientErrorResponse);
    }
}

module.exports.challenge = function (req, res) {//userResetPin
    require('collections/set');
    // eslint-disable-next-line no-unused-vars
    let workingWeight = 0;
    let stoppingFloor = new Set();
    let capacity = 0;
    while (A.length > 0) {
        workingWeight += A[0];
        stoppingFloor = B[0];
    }
}

runUpdateQuery = function (post, res, fields, table, condition) {
    return new Promise((resolve, reject) => {
        let partQuery = "";
        let param = [];
        let paramIndex = 0;
        fields.forEach(function (item, index, array) {
            if (Object.keys(post).includes(item)) {
                partQuery += item + " = ?, ";
                param[paramIndex] = Object.values(post)[Object.keys(post).indexOf(item)]
                paramIndex++;
            }
        });
        partQuery = partQuery.substring(0, partQuery.length - 2);//
        let query = "UPDATE " + table + " SET " + partQuery + " " + condition;
        //console.log(query);
        connection.query(query, param, (err, results, fields) => {
            if (!err && results.affectedRows === 1) {
                resolve();
            } else {
                reject();
            }
        });
    });
}

async function WaitForRunUpdateQuery(post, res, fields, table, condition) {
    try {
        await runUpdateQuery(post, res, fields, table, condition);
        return true;
    } catch (err) {
        //console.log(err);
        return false;
    }
}


runInsertQuery = function (post, res, fields, table, condition) {
    return new Promise((resolve, reject) => {
        let partQuery = "";
        let param = [];
        let paramIndex = 0;
        fields.forEach(function (item, index, array) {
            if (Object.keys(post).includes(item)) {
                partQuery += item + " = ?, ";
                param[paramIndex] = Object.values(post)[Object.keys(post).indexOf(item)]
                paramIndex++;
            }
        });
        partQuery = partQuery.substring(0, partQuery.length - 2);//
        let query = "UPDATE " + table + " SET " + partQuery + " " + condition;
        connection.query(query, param, (err, results, fields) => {
            if (!err) {
                resolve();
            } else {
                console.log(err);
                reject();
            }
        });
    });
}
generateVerificationCode = function () {
    var numbers = "";
    for (var i = 0; i < 6; i++) {
        numbers += "" + Math.floor(Math.random() * (9 - 0 + 1) + 0)
    }
    return numbers;
}

function isSet(item) {
    return (typeof item !== "undefined");
}

function hashPass(item) {
    return sha1(item);
}

function hashPin(item) {
    return sha1(item);
}


function makeAccessToken(pass) {
    return sha1(pass + moment() + generateVerificationCode());
}
