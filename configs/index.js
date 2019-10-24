module.exports = {
    secret: process.env.NODE_ENV === 'production' ? process.env.SECRET : 'secret'
};

global.SUCCESS_RESPONSE_CODE = 200;
global.SERVER_ERROR_RESPONSE_CODE = 500;
global.CLIENT_ERROR_RESPONSE_CODE = 400;

global.PICK_THREE = 'PICK_THREE';
global.PICK_FOUR = 'PICK_FOUR';
global.MEGA_BINGO = 'MEGA_BINGO';
global.BINGO = 'BINGO';
global.KENO = 'KENO';
global.IN_DEV_MODE = true;

global.ClientErrorResponse = {
    'code': CLIENT_ERROR_RESPONSE_CODE,
    'status': false,
    'error_string': 'Invalid data provided. Please retry your action',
    'errors': {}
};

global.ServerErrorResponse = {
    'code': SERVER_ERROR_RESPONSE_CODE,
    'status': false,
    'error_string': 'Invalid request data. Please retry action',
    'errors': {}
};

global.SuccessResponse = {
    'code': SUCCESS_RESPONSE_CODE,
    'status': true,
    'response_string': '',
    'data': {}
};

/*global.TWILIO_ACCOUNT_ID = 'ACb55dd375541192bac604aa0767c891b2';
global.TWILIO_ACCOUNT_TOKEN = 'b39d56a9a0ed77bbffe8ff7564e62e23';*/

/*const accountSid = 'AC69013bc16e1aa1b0b0c9106b11eaf700';
const authToken = 'd34070d797a15946fcbacff7a670beff';*/
