const otpGenerator = require("otp-generator");
var CryptoJS = require("crypto-js");
const sendMail = require("./mail");
const config = require("../config/config");

const generateAndSendOTP = async (email) => {
  const otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const delay = 5 * 60 * 1000;
  const expires = Date.now() + delay;
  const data = `${email}.${otp}.${expires}`;
  const hash = CryptoJS.HmacSHA256(data, config.JWT_SECRET);
  const readableHash = CryptoJS.enc.Base64.stringify(hash);
  const fullHash = `${readableHash}.${expires}`;

  const subject = "OTP for Login to Splittr";
  const html = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
  <div style="margin:50px auto;width:70%;padding:20px 0">
    <div style="border-bottom:1px solid #eee">
      <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Splittr</a>
    </div>
    <p style="font-size:1.1em">Hi,</p>
    <p>Thank you for choosing Splittr. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
    <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
    <p style="font-size:0.9em;">Regards,<br />Team Splittr</p>
    <hr style="border:none;border-top:1px solid #eee" />
    <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
      <p>Splittr</p>
      <p>by Anurag</p>
      <p>India</p>
    </div>
  </div>
</div>`;

  // send otp
  const send = await sendMail(email, subject, html);
  if (send) {
    return {
      send: true,
      hash: fullHash,
    };
  } else {
    return {
      send: false,
    };
  }
};

const verifyOTP = async (email, otp, hash) => {
  try {
    let [hashValue, expires] = hash.split(".");
    let now = Date.now();

    if (now < parseInt(expires)) {
      const data = `${email}.${otp}.${expires}`;
      const newHash = CryptoJS.HmacSHA256(data, config.JWT_SECRET);
      const readableHash = CryptoJS.enc.Base64.stringify(newHash);
      if (readableHash === hashValue) {
        return {
          verified: true,
        };
      } else {
        return {
          verified: false,
          t: 1,
        };
      }
    }
    return {
      verified: false,
      t: 2,
    };
  } catch (err) {
    return {
      verified: false,
      t: 3,
    };
  }
};

module.exports = {
  generateAndSendOTP,
  verifyOTP,
};
