const nodemailer = require("nodemailer");
const config = require("../config/config");
const Logging = require("./logging");

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: config.EMAIL, // replace with your email address
    pass: config.PASSWORD, // replace with your email password
  },
});

const sendMail = async (to, subject, html) => {
  let mailOptions = {
    from: config.EMAIL, // replace with your email address
    to: to, // replace with student's email address
    subject: subject,
    html: html,
  };
  try {
    let info = await transporter.sendMail(mailOptions);
    Logging.log("Email sent: " + info.response);
    return true;
  } catch (err) {
    Logging.log(err);
    return false;
  }
};

module.exports = sendMail;
