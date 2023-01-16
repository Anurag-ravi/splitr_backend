import { Request, Response } from 'express';
import { IUserModel } from '../models/user';

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { name, country_code, phone, upi_id }: { name: string; country_code: string; phone: string; upi_id: string } = req.body;
        let user: IUserModel = req.user;
        if (!user) {
            return res.json({ status: 400, message: 'User not found' });
        } else {
            user.name = name || user.name;
            user.country_code = country_code || user.country_code;
            user.phone = phone || user.phone;
            user.upi_id = upi_id || user.upi_id;
            user.save((err, user) => {
                if (err) {
                    return res.json({ status: 400, message: 'An Error occured, try again' });
                } else {
                    return res.json({ status: 200, message: 'User updated successfully', user: user });
                }
            });
        }
    } catch (err) {
        return res.json({ status: 400, message: 'An Error occured, try again' });
    }
};

export const getUser = async (req: Request, res: Response) => {
    try {
        let user: IUserModel = req.user;
        if (!user) {
            return res.json({ status: 400, message: 'User not found' });
        } else {
            return res.json({ status: 200, message: 'User found', user: user });
        }
    } catch (err) {
        return res.json({ status: 400, message: 'An Error occured, try again' });
    }
};
