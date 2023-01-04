const nodemailer = require("nodemailer");
require("dotenv").config();

const sendMail = async (email, otp) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD,
      },
    });
  
    var mailOptions = {
      from: process.env.EMAIL_HOST_USER,
      to: email,
      subject: "OTP for Splitr",
      text: `Your verification code is ${otp}. It will be valid for 5 minutes for ${email}`,
    };
  
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return false;
      } else {
        console.log("Email sent: " + info.response);
        return true;
      }
    });
};

module.exports = sendMail;