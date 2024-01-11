const nodemailer = require("nodemailer");
const config = require('./config');
const Logging = require('./logging');

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: config.EMAIL, // replace with your email address
        pass: config.PASSWORD // replace with your email password
    }
});

const sendMail = (to, subject, html) => {
    let mailOptions = {
        from: config.EMAIL, // replace with your email address
        to: to, // replace with student's email address
        subject: subject,
        html: html
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            Logging.error(error.message);
        } else {
            Logging.success("Email sent: " + info.response);
        }
    }); 
}

module.exports = sendMail;