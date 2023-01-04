var CryptoJS = require("crypto-js");
const User = require("../models/user");
require('dotenv').config();

const generateToken = async (email) => {
    const token = CryptoJS.AES.encrypt(JSON.stringify(email), process.env.SECRET_KEY).toString();
    return token;
}

const verifyToken = async (token) => {
    const bytes  = CryptoJS.AES.decrypt(token, process.env.SECRET_KEY);
    const email = bytes.toString(CryptoJS.enc.Utf8);
    const user = await User.findOne({email});
    if(!user){
        return {
            status: false,
        };
    }
    return {
        status: true,
        user,
    };
}

module.exports = {
    generateToken,
    verifyToken,
}