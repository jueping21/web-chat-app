const config = require('../../config');
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const errorType = require('../error/error-type');
const uniqueValidator = require('mongoose-unique-validator');

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// userSchema
const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        trim: true,
        required: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Incorrect email format");
            }
        }
    },

    password: {
        type: String,
        required: true,
        minLength: 6
    },

    nickname: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: 4,
        maxLength: 20,
        validate(value) {
            let regex = /^[a-zA-Z0-9_.-]*$/;
            if (!value.match(regex)) {
                throw new Error("Incorrect nickname format");
            }
        }
    },
    token: {
        type: String
    }
});

// method for generate auth token
userSchema.method("generateAuthToken", async function () {
    const id = this._id;
    const email = this.email;
    const body = { id, email }
    const secret = config.secret;
    const newToken = jwt.sign(body, secret);
    this.token = newToken;
    await this.save();
    return this.token;
})

// static method for find user by credentials
userSchema.static("findByCredentials", async (email, password) => {
    const uesr = await User.findOne({ email });
    if (!uesr) {
        throw new Error(errorType.loginFailed);
    }
    const isMatch = await bcrypt.compare(password, uesr.password)
    if (!isMatch) {
        throw new Error(errorType.loginFailed);
    }
    return uesr;
});

// middleware before save
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

const User = mongoose.model("User", userSchema);

// customized error message from this user model
userSchema.plugin(uniqueValidator);


module.exports = User;