const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');
//const isProduction = process.env.NODE_ENV === 'production';
/*let autoIncrement = require('mongoose-auto-increment');
let connectionString = "";

if(isProduction)
    connectionString = process.env.MONGODB_URI;
else
    connectionString = "mongodb://localhost/bingo9ja";

let connection = mongoose.createConnection(connectionString, {useNewUrlParser: true});
//autoIncrement.initialize(connection);*/

const UserSchema = new Schema({
    fullName: {type: String, default: '', match: /[a-z]/},
    email: {
        type: String,
        lowercase: true,
        //unique: true,
        required: [true, "email can't be blank"],
        match: [/\S+@\S+\.\S+/, 'is invalid'],
        //index: true
    },
    isAdmin: {
        type: Boolean,
        default: false,
        required: false
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        index: true,
        unique: true
    },
    tempPhone: {
        type: String,
        trim: true,
    },
    phoneVerificationCode: {
        type: String,
        required: false,
        trim: true,
        unique: false
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    isMobileVerified: {type: Boolean},
    accessToken: String,
    address: String,
    dod: Date,
    // singleFlag: {type: String, required: true, default: '', unique:true},
    accountBalance: {type: Number, default: 5000.05}
}, {timestamps: true});
/*UserSchema.index({ email: 1, phone: 1 }, {
    unique: true
});
collection.createIndex( { name : -1 }, function(err, result) {
    console.log(result);
    callback(result);
}*/
//UserSchema.index({ email: 1, phone: 1 });

UserSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
}

UserSchema.methods.createUser = function (fullName, phone, email, password, singleFlag) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.fullName = fullName
    this.phone = phone
    this.email = email
    this.password = password
    this.singleFlag = singleFlag
}

//name: { type: String, unique: true }

const GameSchema = new Schema({
    gameType: {type: String, default: ''},//PICK_THREE, PICK_FOUR, MONGO_BINGO, BINGO_PACK
    addedBy: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    isVisible: {type: Boolean},
    singleFlag: {type: String, required: true},
    dateString: {type: String, required: true,},
    orderingId: {type:Number, required: true},
    gameTime: {
        year: Number,
        month: Number,
        day: Number,
        hour: Number,
        minute: Number,
        duration: Number
    }
}, {timestamps: true});
GameSchema.index({ singleFlag: 1}, { unique: true });

const GamePlaySchema = new Schema({
    gameType: {type: String, default: '', required: true},//PICK_THREE, PICK_FOUR, MONGO_BINGO, BINGO_PACK
    gameId: {type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true},
    playerId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    initialBalance: {type: Number, default: 0.0},
    stakeAmount: {type: Number, default: 0.0},
    finalBalance: {type: Number, default: 0.0},
    pick: {type: String, default: '', required: true},
    spot: {type: String, default: 0, required: true}//game choice
}, {timestamps: true});

GamePlaySchema.methods.createGamePlay = function (gameType, gameId, playerId, initialBalance, stakeAmount, finalBalance, pick, spot) {
    this.gameType = gameType
    this.gameId = gameId
    this.playerId = playerId
    this.initialBalance = initialBalance
    this.stakeAmount = stakeAmount
    this.finalBalance = finalBalance
    this.pick = pick,
        this.spot = spot
}


mongoose.model('User', UserSchema);

mongoose.model('Game', GameSchema);
//GameSchema.plugin(autoIncrement.plugin, { model: 'Game'});
mongoose.model('GamePlay', GamePlaySchema);
