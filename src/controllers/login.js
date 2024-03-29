const User = require("../models/usermodel");
const { generateAndSendOTP, verifyOTP } = require("../utilities/otp");
const { verifyOauthToken, generateToken } = require("../utilities/token");

const oauthLogin = async (req, res) => {
  const { token } = req.body;
  if (!token)
    return res.json({ status: 400, message: "OAuth token not found" });
  const data = await verifyOauthToken(token);
  if (!data.valid)
    return res.json({ status: 401, message: "Invalid OAuth token" });
  // token is verified
  const email = data.email;
  const user = await User.findOne({ email: email });
  var newUser;
  if (!user) {
    newUser = await User.create({
      email: email,
    });
    const newToken = generateToken(newUser);
    return res.json({
      status: 200,
      token: newToken,
      registered_now: true,
      user: newUser,
    });
  }
  const newToken = generateToken(user);
  return res.json({
    status: 200,
    token: newToken,
    registered_now: !user.verified,
    user: user,
  });
};

const oauthRegister = async (req, res) => {
  const { name, country_code, number, upi_id } = req.body;
  const user = req.user;
  if (!name || !country_code || !number || !upi_id)
    return res.json({ status: 400, message: "Missing parameters" });
  user.name = name;
  user.country_code = country_code;
  user.phone = number;
  user.upi_id = upi_id;
  user.verified = true;
  await user.save();
  const token = generateToken(user);
  return res.json({ status: 200, user: user, token: token });
};

const updateProfile = async (req, res) => {
  const { name, country_code, number, upi_id } = req.body;
  const user = req.user;
  if (!name || !country_code || !number || !upi_id)
    return res.json({ status: 400, message: "Missing parameters" });
  user.name = name;
  user.country_code = country_code;
  user.phone = number;
  user.upi_id = upi_id;
  await user.save();
  const token = generateToken(user);
  return res.json({ status: 200, user: user, token: token });
};

const getFriends = async (req, res) => {
  const { contacts } = req.body;
  contacts.splice(contacts.indexOf(req.user.phone), 1);
  const friends = await User.find({ phone: { $in: contacts } }).sort({
    name: "asc",
  });
  return res.json({ status: 200, friends: friends });
};

const otpLogin = async (req, res) => {
  const { email } = req.body;
  // generate otp
  const data = await generateAndSendOTP(email);
  if (!data.send) {
    return res.json({ status: 400, message: "An Error occured, try again" });
  }
  return res.json({ status: 200, hash: data.hash });
};

const otpVerify = async (req, res) => {
  const { email, otp, hash } = req.body;
  var user = await User.findOne({ email: email });

  const data = await verifyOTP(email, otp, hash);
  if (!data.verified) {
    if (data.t === 1) return res.json({ status: 400, message: "Invalid OTP" });
    if (data.t === 2) return res.json({ status: 400, message: "OTP Expired" });
    if (data.t === 3)
      return res.json({ status: 400, message: "An Error occured, try again" });
  }
  if (!user) {
    user = await User.create({
      email: email,
    });
  }
  const token = generateToken(user);
  return res.json({
    status: 200,
    token: token,
    registered_now: !user.verified,
    user: user,
  });
};

module.exports = {
  oauthLogin,
  oauthRegister,
  updateProfile,
  getFriends,
  otpLogin,
  otpVerify,
};
