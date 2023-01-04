const otpGenerator = require("otp-generator");
var CryptoJS = require("crypto-js");
const sendMail = require("./mail");
var request = require('request');
const { TWO_FACTOR_KEY } = process.env;

const generateAndSendOTP = async (email) => {
    const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });
    const delay = 5 * 60 * 1000;
    const expires = Date.now() + delay;
    const data = `${email}.${otp}.${expires}`;
    const hash = CryptoJS.HmacSHA256(data, process.env.SECRET_KEY);
    const readableHash = CryptoJS.enc.Base64.stringify(hash);
    const fullHash = `${readableHash}.${expires}`;

    // send otp
    // try {
    //     var options = {
    //         'method': 'GET',
    //         'url': `https://2factor.in/API/V1/${TWO_FACTOR_KEY}/SMS/${phone}/${otp}/splitr`,
    //         'headers': {
    //         }
    //     };
    //     request(options, function (error, response) {
    //         if (error) return res.json({ status: 400, message: "An Error occured, try again" });
    //         else {
    //             return res.json({ status: 200, message: "OTP sent successfully", hash: fullHash });
    //         }
    //     });
    // } catch (err) {
    //     return res.json({ status: 400, message: "An Error occured,, try again" });
    // }

    // send otp
    sendMail(email, otp).then((data) => {
        if (data) {
            return {
                send : true,
                hash : fullHash
            };
        } else {
            return {
                send : false
            };
        }
    }).catch((err) => {
        return {
            send : false
        };
    });
    return {
        send : false
    };
}

const verifyOTP = async (email, otp, hash) => {
    try {
        let [hashValue, expires] = hash.split(".");
        let now = Date.now();
    
        if (now < parseInt(expires)) {
          const data = `${email}.${otp}.${expires}`;
          const newHash = CryptoJS.HmacSHA256(data, process.env.SECRET_KEY);
          const readableHash = CryptoJS.enc.Base64.stringify(newHash);
          if (readableHash === hashValue) {
            return {
              verified : true,
            };
          } else {
            return {
                verified : false,
                t:1
            };
          }
        }
        return {
            verified : false,
            t:2
        };
    } catch (err) {
        return {
            verified : false,
            t:3
        };
    }
}


module.exports = {
    generateAndSendOTP,
    verifyOTP
};