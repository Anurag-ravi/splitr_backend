const otpGenerator = require("otp-generator");
const { verifyOauthToken, generateToken } = require("../utilities/token");
const Trip = require("../models/trip");
const TripUser = require("../models/trip_user");
const User = require("../models/usermodel");

const createTrip = async (req,res) => {
    const {name } = req.body;
    const user = req.user;
    if(!name) return res.json({status:400, message:"Missing parameters"});
    var code = otpGenerator.generate(10, {
        lowerCaseAlphabets: true,
        upperCaseAlphabets: true,
        specialChars: false,
    });
    var trip = await Trip.findOne({code:code});
    while(trip){
        code = otpGenerator.generate(10, {
            lowerCaseAlphabets: true,
            upperCaseAlphabets: true,
            specialChars: false,
        });
        trip = await Trip.findOne({code:code});
    }
    trip = await Trip.create({
        code: code,
        name: name,
        created_by: user._id
    });
    var tripuser = await TripUser.create({
        trip: trip._id,
        user: user._id,
        name: user.name
    });
    trip.users.push(tripuser._id);
    await trip.save();
    user.trips.push(trip._id);
    await user.save();
    return res.json({status:200, message:"Trip created successfully", data:trip});
}

const getTrips = async (req, res) => {
    const user = req.user;
    const trips = await user
    .populate(
        {
            path: 'trips',
            model: 'Trip'
        }
    );
    return res.json({status:200, message:"Trips fetched successfully", data:trips.trips});
}

const joinTrips = async (req, res) => {
    const {code} = req.body;
    const user = req.user;
    if(!code) return res.json({status:400, message:"Missing parameters"});
    var trip = await Trip.findOne({code:code});
    if(!trip) return res.json({status:400, message:"Trip not found"});
    var tripuser = await TripUser.findOne({trip:trip._id, user:user._id});
    if(tripuser) return res.json({status:400, message:"Already joined this trip"});
    tripuser = await TripUser.create({
        trip: trip._id,
        user: user._id,
        name: user.name
    });
    trip.users.push(tripuser._id);
    await trip.save();
    user.trips.push(trip._id);
    await user.save();
    return res.json({status:200, message:"Trip joined successfully", data:trip});
}

module.exports = {
    createTrip,
    getTrips,
    joinTrips
}