const express = require('express');
const {generateAndSendOTP,verifyOTP} = require("../utilities/otp");
const router = express.Router();
const User = require("../models/User");
const { generateToken } = require('../utilities/token');


router.post('/login', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email});
    if (user && user.verified) {
        // generate otp
        generateAndSendOTP(email).then((data) => {
            if (data.send) {
                return res.json({ status: 200, message: "OTP sent successfully", hash: data.hash });
            } else {
                return res.json({ status: 400, message: "An Error occured, try again" });
            }
        }).catch((err) => {
            return res.json({ status: 400, message: "An Error occured, try again" });
        });
    } else {
        return res.json({ status: 400, message: "User not found" });
    }
});

router.post('/verify', async (req, res) => {
    const { email, otp, hash } = req.body;
    const user = await User.findOne({ email: email});
    if (!user) {
        return res.json({ status: 400, message: "User not found" });
    }
    verifyOTP(email, otp, hash).then((data) => {
        if (data.verified) {
            if(!user.verified){
                user.verified = true;
                user.save();
            }
            generateToken(user.email).then((token) => {
                return res.json({ status: 200, message: "User verified successfully", token });
            }).catch((err) => {
                return res.json({ status: 400, message: "An Error occured, try again" });
            });
        } else {
            return res.json({ status: 400, message: "Invalid OTP" });
        }
    }).catch((err) => {
        return res.json({ status: 400, message: "An Error occured, try again" });
    });
});

router.post('/register', async (req, res) => {
    try {
        const { name, country_code, phone, email,upi_id } = req.body;
        let u = await User.findOne({ email: email});
        if (u && u.verified) {
            return res.json({ status: 400, message: "User already exists" });
        }
        if (u && !u.verified) {
            u.delete();
        }
        const user = new User({
            name,
            country_code,
            phone,
            email,
            upi_id
        });
        user.save((err, user) => {
            if (err) {
                return res.json({ status: 400, message: "An Error occured, try again" });
            } else {
                generateAndSendOTP(email).then((data) => {
                    if (data.send) {
                        return res.json({ status: 200, message: "User registered successfully", hash: data.hash, user: user });
                    } else {
                        user.delete();
                        return res.json({ status: 400, message: "An Error occured, try again" });
                    }
                }).catch((err) => {
                    user.delete();
                    return res.json({ status: 400, message: "An Error occured, try again" });
                });
            }
        });
    } catch (err) {
        return res.json({ status: 400, message: "An Error occured, try again" });
    }
});


module.exports = router;