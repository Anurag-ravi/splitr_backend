import otpGenerator from 'otp-generator';
import CryptoJS from 'crypto-js';
import { config } from '../config/config';
import { sendEmail } from './mail';
import Logging from './logging';

interface generate {
    send: boolean;
    hash?: string;
}

export const generateAndSendOTP = async (email: string): Promise<generate> => {
    const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false
    });
    const delay = 5 * 60 * 1000;
    const expires = Date.now() + delay;
    const data = `${email}.${otp}.${expires}`;
    const hash = CryptoJS.HmacSHA256(data, config.SECRET_KEY);
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
    return new Promise((resolve, reject) => {
        sendEmail(email, otp)
            .then((data) => {
                if (data) {
                    resolve({
                        send: true,
                        hash: fullHash
                    });
                } else {
                    resolve({
                        send: false
                    });
                }
            })
            .catch((err) => {
                resolve({
                    send: false
                });
            });
    });
};
interface verify {
    verified: boolean;
    t?: string;
}
export const verifyOTP = async (email: string, hash: string, otp: string): Promise<verify> => {
    try {
        let [hashValue, expires] = hash.split('.');
        let now = Date.now();
        Logging.debug(`original hash: ${hash}`);
        Logging.debug(`hash: ${hashValue}, expires: ${expires}`);
        Logging.debug(`now: ${now}, expires: ${expires}`);
        if (now < parseInt(expires)) {
            const data = `${email}.${otp}.${expires}`;
            const newHash = CryptoJS.HmacSHA256(data, config.SECRET_KEY);
            const readableHash = CryptoJS.enc.Base64.stringify(newHash);
            if (readableHash === hashValue) {
                return {
                    verified: true
                };
            } else {
                return {
                    verified: false,
                    t: 'Invalid OTP'
                };
            }
        }
        return {
            verified: false,
            t: 'OTP Expired'
        };
    } catch (err) {
        return {
            verified: false,
            t: 'Something went wrong'
        };
    }
};
