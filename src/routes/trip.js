const express = require('express');
const router = express.Router();
const otpGenerator = require("otp-generator");


const Trip = require("../models/Trip");

router.get('/', async (req, res) => {
    const trips = await req.user.populate('trips').trips;
    res.json(trips);
});

router.post('/new', async (req, res) => {
    let { name, description, currency } = req.body;
    if(!name){
        res.send(JSON.stringify({ status: 400, message: 'Name is required' }));
    }
    description = description || '';
    currency = currency || 'INR';
    let code = otpGenerator.generate(8, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: true,
        specialChars: false,
    });
    while(true){
        const trip = await Trip.findOne({code});
        if(trip){
            code = otpGenerator.generate(8, {
                lowerCaseAlphabets: false,
                upperCaseAlphabets: true,
                specialChars: false,
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
        created_by: req.user._id,
    });
    const tripuser = new TripUser({
        user: req.user._id,
        trip: trip._id,
        name: req.user.name,
    });
    trip.users.push(tripuser);
    trip.save((err, trip) => {
        if (err) {
            res.send(JSON.stringify({ status: 400, message: err.message }));
        }
        res.send(
            JSON.stringify({
                status: 200,
                trip,
            })
        );
    });
});

router.get('/:code', async (req, res) => {
    const { code } = req.params;
    let trip = await Trip.findOne({code});
    if(!trip){
        res.json({ status: 400, message: 'Trip not found' });
    }
    let isInvolved = trip.users.find(user => user === req.user._id);
    if(!isInvolved){
        res.json({ status: 400, message: 'You are not involved in this trip' });
    }
    trip = await Trip.findOne({code})
    .populate({
        path: "users",
        model: "TripUser",
        populate: {
            path: "user",
            model: "User",
        },
    })
    .populate({
        path: "expenses",
        model: "Expense",
    })
    .populate({
        path: "payments",
        model: "Payment",
    });
    if(!trip){
        res.json({ status: 400, message: 'Trip not found' });
    }
    res.json({
        status: 200,
        trip,
    });
});

router.post('/addUser', async (req, res) => {
    let { code, name } = req.body;
    if(!code){
        res.json({ status: 400, message: 'Code is required' });
    }
    if(!name){
        res.json({ status: 400, message: 'Email is required' });
    }
    const trip = await Trip.findOne({code});
    if(!trip){
        res.json({ status: 400, message: 'Trip not found' });
    }
    const user = trip.users.find(user => user.email === email);
    if(user){
        res.json({ status: 400, message: 'User already added' });
    }
    trip.users.push({
        email,
        
    });
    trip.save((err, trip) => {
        if (err) {
            res.json({ status: 400, message: err.message });
        }
        res.json({
                status: 200,
                trip,
            });
    });
});

module.exports = router;