import { boolean } from 'joi';
import nodemailer from 'nodemailer';
import { config } from '../config/config';
import Logging from './logging';

export const sendEmail = async (to: string, otp: string): Promise<boolean> => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.EMAIL_HOST_USER,
            pass: config.EMAIL_HOST_PASSWORD
        }
    });

    const mailOptions = {
        from: config.EMAIL_HOST_USER,
        to,
        subject: 'OTP for Splitr',
        text: `Your verification code is ${otp}. It will be valid for 5 minutes.`
    };
    console.log('otp', otp);
    return new Promise((resolve, reject) => {
        // transporter.sendMail(mailOptions, function (error, info) {
        //     if (error) {
        //         Logging.error(error.message);
        //         resolve(false);
        //     } else {
        //         Logging.success('OTP sent: ' + otp);
        //         Logging.success('Email sent: ' + info.response);
        resolve(true);
        // }
        // });
    });
};
