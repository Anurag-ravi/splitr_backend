import { Request, Response } from 'express';
import Trip from '../models/trip';
import Participant from '../models/participants';
import otpGenerator from 'otp-generator';
import Expense from '../models/expense';
import Payment from '../models/payment';

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

export const updateTrip = async (req: Request, res: Response) => {
    const { code } = req.params;
    const { name, description, currency } = req.body;
    let trip = await Trip.findOne({
        code
    });
    if (!trip) {
        res.json({ status: 400, message: 'Trip not found' });
    } else {
        let participant = await Participant.findOne({ trip: trip._id, user: req.user });
        if (!participant) {
            res.json({ status: 400, message: 'You are not involved in this trip' });
        } else {
            if (name) {
                trip.name = name;
            }
            if (description) {
                trip.description = description;
            }
            if (currency) {
                trip.currency = currency;
            }
            trip.save((err, trip) => {
                if (err) {
                    res.json({ status: 400, message: err.message });
                } else {
                    res.send({
                        status: 200,
                        trip
                    });
                }
            });
        }
    }
};

export const detailTrip = async (req: Request, res: Response) => {
    let e = new Expense({});
    let p = new Payment({});
    const { code } = req.params;
    let trip = await Trip.findOne({ code });
    if (!trip) {
        res.json({ status: 400, message: 'Trip not found' });
    } else {
        let participant = await Participant.findOne({ trip: trip._id, user: req.user });
        if (!participant) {
            res.json({ status: 400, message: 'You are not involved in this trip' });
        } else if (participant && participant.is_settled) {
            res.json({ status: 400, message: 'You are not involved in this trip' });
        }
    }
    trip = await Trip.findOne({ code })
        .populate({
            path: 'participants',
            model: 'Participant',
            populate: {
                path: 'user',
                model: 'User'
            }
        })
        .populate({
            path: 'expenses',
            model: 'Expense'
        })
        .populate({
            path: 'payments',
            model: 'Payment'
        });
    if (!trip) {
        res.json({ status: 400, message: 'Trip not found' });
    } else {
        res.json({
            status: 200,
            trip
        });
    }
};

export const joinTrip = async (req: Request, res: Response) => {
    const { code, name }: { code: string; name: string } = req.body;
    const trip = await Trip.findOne({ code });
    if (!trip) {
        res.json({ status: 400, message: 'Trip not found' });
    } else {
        const participant = await Participant.findOne({ trip: trip._id, user: req.user });
        if (participant && !name) {
            res.json({ status: 400, message: 'You are already involved in this trip' });
        } else {
            var tripuser;
            if (name) {
                tripuser = new Participant({
                    trip: trip._id,
                    name
                });
            } else {
                tripuser = new Participant({
                    user: req.user._id,
                    trip: trip._id,
                    name: req.user.name
                });
            }
            await tripuser.save();
            trip.participants.push(tripuser._id);
            trip.save((err, trip) => {
                if (err) {
                    res.json({ status: 400, message: err.message });
                } else {
                    res.send({
                        status: 200,
                        trip
                    });
                }
            });
        }
    }
};

export const leaveTrip = async (req: Request, res: Response) => {
    const { code } = req.params;
    const { participant_id } = req.body;
    const trip = await Trip.findOne({ code });
    if (!trip) {
        res.json({ status: 400, message: 'Trip not found' });
    } else {
        if (participant_id) {
            const participant = await Participant.findById(participant_id);
            if (!participant) {
                res.json({ status: 400, message: 'Participant not found' });
            } else {
                // TODO: Check if participant is settled or not
                await Participant.findByIdAndDelete(participant_id);
                trip.participants = trip.participants.filter((p) => p != participant_id);
                trip.save((err, trip) => {
                    if (err) {
                        res.json({ status: 400, message: err.message });
                    } else {
                        res.send({
                            status: 200,
                            trip
                        });
                    }
                });
            }
        } else {
            const participant = await Participant.findOne({ trip: trip._id, user: req.user });
            if (!participant) {
                res.json({ status: 400, message: 'You are not involved in this trip' });
            } else {
                // TODO: Check if participant is settled or not
                await Participant.findByIdAndDelete(participant._id);
                trip.participants = trip.participants.filter((p) => p != participant._id);
                trip.save((err, trip) => {
                    if (err) {
                        res.json({ status: 400, message: err.message });
                    } else {
                        res.send({
                            status: 200,
                            trip
                        });
                    }
                });
            }
        }
    }
};
