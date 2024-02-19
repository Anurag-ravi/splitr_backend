const express = require("express");
const { generateAndSendOTP, verifyOTP } = require("../utilities/otp");
const router = express.Router();
const User = require("../models/usermodel");
const { generateToken } = require("../utilities/token");
const {
  oauthLogin,
  oauthRegister,
  updateProfile,
  getFriends,
  otpLogin,
  otpVerify,
} = require("../controllers/login");
const { authMiddleware } = require("../middlewares/auth");

router.post("/oauth-login", oauthLogin);
router.post("/otp-login", otpLogin);
router.post("/otp-verify", otpVerify);
router.post("/oauth-register", authMiddleware, oauthRegister);
router.post("/update-profile", authMiddleware, updateProfile);
router.post("/get-friends", authMiddleware, getFriends);
router.get("/token", async (req, res) => {
  const user = await User.findOne({ email: "kumarayush1014@gmail.com" });
  const token = generateToken(user);
  res.json({ token });
});

module.exports = router;
