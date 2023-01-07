import { Request, Response } from 'express';
import User from '../models/user';
import { generateAndSendOTP, verifyOTP } from '../utilities/otp';
import { generateToken } from '../utilities/token';

export const login = async (req: Request, res: Response) => {
    const { email }: { email: string } = req.body;
    User.findOne({ email }).then((user) => {
        if (user && user.verified) {
            generateAndSendOTP(user.email)
                .then((data) => {
                    if (data.send) {
                        return res.json({ status: 200, message: 'OTP sent successfully', hash: data.hash });
                    } else {
                        return res.json({ status: 400, message: 'An Error occured, try again' });
                    }
                })
                .catch((err) => {
                    return res.json({ status: 400, message: 'An Error occured, try again' });
                });
        } else {
            res.status(404).send({ error: 'User not found' });
        }
    });
};

export const verify = async (req: Request, res: Response) => {
    const { email, otp, hash }: { email: string; otp: string; hash: string } = req.body;
    User.findOne({ email })
        .then((user) => {
            if (user) {
                verifyOTP(email, hash, otp)
                    .then((data) => {
                        if (data.verified) {
                            if (!user.verified) {
                                user.verified = true;
                                user.save();
                            }
                            generateToken(user.email)
                                .then((token) => {
                                    return res.json({ status: 200, message: 'User verified successfully', token });
                                })
                                .catch((err) => {
                                    return res.json({ status: 400, message: 'An Error occured, try again' });
                                });
                        } else {
                            return res.json({ status: 400, message: data.t });
                        }
                    })
                    .catch((err) => {
                        return res.json({ status: 400, message: 'An Error occured, try again' });
                    });
            } else {
                return res.json({ status: 400, message: 'User not found' });
            }
        })
        .catch((err) => {
            return res.json({ status: 400, message: 'An Error occured, try again' });
        });
};

export const register = async (req: Request, res: Response) => {
    try {
        const { name, country_code, phone, email, upi_id }: { name: string; country_code: string; phone: string; email: string; upi_id: string } = req.body;
        var user = await User.findOne({ email });
        if (user && user.verified) {
            return res.json({ status: 400, message: 'User already exists' });
        }
        if (user && !user.verified) {
            user.delete();
        }
        user = new User({
            name,
            country_code,
            phone,
            email,
            upi_id
        });
        user.save((err, user) => {
            if (err) {
                return res.json({ status: 400, message: "User can't got saved" });
            } else {
                generateAndSendOTP(email)
                    .then((data) => {
                        if (data.send) {
                            return res.json({ status: 200, message: 'User registered successfully', hash: data.hash, user: user });
                        } else {
                            user.delete();
                            return res.json({ status: 400, message: 'Email not sent, Please try again' });
                        }
                    })
                    .catch((err) => {
                        user.delete();
                        return res.json({ status: 400, message: 'Unable to send Mail' });
                    });
            }
        });
    } catch (err) {
        return res.json({ status: 400, message: 'An Error occured, try again' });
    }
};
