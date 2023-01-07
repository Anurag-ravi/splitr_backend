import CryptoJS from 'crypto-js';
import { config } from '../config/config';
import User, { IUserModel } from '../models/user';
import Logging from './logging';

interface verify {
    status: boolean;
    user: IUserModel | null;
}

export const generateToken = async (email: string) => {
    const token = CryptoJS.AES.encrypt(email, config.SECRET_KEY).toString();
    return token;
};

export const verifyToken = async (token: string) => {
    const bytes = CryptoJS.AES.decrypt(token, config.SECRET_KEY);
    const email = bytes.toString(CryptoJS.enc.Utf8);
    var user = await User.findOne({ email });
    if (user) {
        return {
            status: true,
            user
        };
    } else {
        return {
            status: false,
            user: null
        };
    }
};
