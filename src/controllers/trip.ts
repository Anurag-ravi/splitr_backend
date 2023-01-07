import { Request, Response } from 'express';
import Trip from '../models/trip';
import Participant from '../models/participants';
import otpGenerator from 'otp-generator';

export const allTrip = async (req: Request, res: Response) => {
    const participants = await Participant.find({ user: req.user._id }).populate('trip');
    var trips = [];
    for (var i = 0; i < participants.length; i++) {
        trips.push(participants[i].trip);
    }
    res.json({ trips });
};

export const createTrip = async (req: Request, res: Response) => {
    let { name, description, currency }: { name: string; description: string; currency: string } = req.body;
    if (!name) {
        res.send({ status: 400, message: 'Name is required' });
    }
    description = description || '';
    currency = currency || 'INR';
    let code = otpGenerator.generate(8, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: true,
        specialChars: false
    });
    while (true) {
        const trip = await Trip.findOne({ code });
        if (trip) {
            code = otpGenerator.generate(8, {
                lowerCaseAlphabets: false,
                upperCaseAlphabets: true,
                specialChars: false
            });
        } else {
            break;
        }
    }
    const trip = new Trip({
        code,
        name,
        description,
        currency,
        creator: req.user._id
    });
    const tripuser = new Participant({
        user: req.user._id,
        trip: trip._id,
        name: req.user.name
    });
    await tripuser.save();
    trip.participants.push(tripuser._id);
    trip.save((err, trip) => {
        if (err) {
            res.json({ status: 400, message: err.message });
        }
        res.send({
            status: 200,
            trip
        });
    });
};
