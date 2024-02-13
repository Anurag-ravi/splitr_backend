const otpGenerator = require("otp-generator");
const { verifyOauthToken, generateToken } = require("../utilities/token");
const Trip = require("../models/trip");
const TripUser = require("../models/trip_user");
const User = require("../models/usermodel");

const createTrip = async (req, res) => {
  const { name } = req.body;
  const user = req.user;
  if (!name) return res.json({ status: 400, message: "Missing parameters" });
  var code = otpGenerator.generate(10, {
    lowerCaseAlphabets: true,
    upperCaseAlphabets: true,
    specialChars: false,
  });
  var trip = await Trip.findOne({ code: code });
  while (trip) {
    code = otpGenerator.generate(10, {
      lowerCaseAlphabets: true,
      upperCaseAlphabets: true,
      specialChars: false,
    });
    trip = await Trip.findOne({ code: code });
  }
  trip = await Trip.create({
    code: code,
    name: name,
    created_by: user._id,
  });
  var tripuser = await TripUser.create({
    trip: trip._id,
    user: user._id,
    name: user.name,
    dp: user.dp
  });
  trip.users.push(tripuser._id);
  await trip.save();
  user.trips.push(trip._id);
  await user.save();
  return res.json({
    status: 200,
    message: "Trip created successfully",
    data: trip,
  });
};

const getTrips = async (req, res) => {
  const user = req.user;
  const trips = await user.populate({
    path: "trips",
    model: "Trip",
  });
  return res.json({
    status: 200,
    message: "Trips fetched successfully",
    data: trips.trips,
  });
};

const getTrip = async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findOne({ _id: id })
    .populate({
      path: "users",
      model: "TripUser",
    })
    .populate({
      path: "expenses",
      model: "Expense",
    })
    .populate({
      path: "payments",
      model: "Payment",
    });
  if (!trip) return res.json({ status: 400, message: "Trip not found" });
  return res.json({
    status: 200,
    message: "Trip fetched successfully",
    data: trip,
  });
};

const joinTrips = async (req, res) => {
  const { code } = req.body;
  const user = req.user;
  if (!code) return res.json({ status: 400, message: "Missing parameters" });
  var trip = await Trip.findOne({ code: code });
  if (!trip) return res.json({ status: 400, message: "Trip not found" });
  var tripuser = await TripUser.findOne({ trip: trip._id, user: user._id });
  if (tripuser){
    if(!tripuser.involved){
      tripuser.involved = true;
      await tripuser.save();
      user.trips.push(trip._id);
      await user.save();
      return res.json({
        status: 200,
        message: "Trip joined successfully",
        data: trip,
      });
    }
    return res.json({ status: 400, message: "Already joined this trip" });
  }
  tripuser = await TripUser.create({
    trip: trip._id,
    user: user._id,
    name: user.name,
    dp: user.dp
  });
  trip.users.push(tripuser._id);
  await trip.save();
  user.trips.push(trip._id);
  await user.save();
  return res.json({
    status: 200,
    message: "Trip joined successfully",
    data: trip,
  });
};

const leaveTrip = async (req,res) => {
  const { id } = req.params;
  const tripUser = await TripUser.findOne({trip:id,user:req.user._id});
  if(!tripUser){
    return res.json({ status: 400, message: "Not part of that group" });
  }
  tripUser.involved = false;
  await tripUser.save();
  var x = [];
  req.user.trips.map((trip) => {
    if(trip === tripUser.trip){
      x.push(trip);
    }
  })
  req.user.trips = x;
  await req.user.save();
  return res.json({ status: 200, message: "Left this trip" });
}

const addToTrip = async (req, res) => {
  const { user_id } = req.body;
  const { id } = req.params;
  const user = await User.findById(user_id);
  if (!user_id) return res.json({ status: 400, message: "Missing parameters" });
  var trip = await Trip.findById(id);
  if (!trip) return res.json({ status: 400, message: "Trip not found" });
  var tripuser = await TripUser.findOne({ trip: trip._id, user: user._id });
  if (tripuser){
    if(!tripuser.involved){
      tripuser.involved = true;
      await tripuser.save();
      user.trips.push(trip._id);
      await user.save();
      return res.json({
        status: 200,
        message: "Trip joined successfully",
        data: trip,
      });
    }
    return res.json({ status: 400, message: "Already joined this trip" });
  }
  tripuser = await TripUser.create({
    trip: trip._id,
    user: user._id,
    name: user.name,
    dp: user.dp
  });
  trip.users.push(tripuser._id);
  await trip.save();
  user.trips.push(trip._id);
  await user.save();
  return res.json({
    status: 200,
    message: "Trip joined successfully",
    data: trip,
  });
};

const addNewUserToTrip = async (req, res) =>{
  const { id } = req.params;
  const { name,email } = req.body;
  const trip = await Trip.findById(id);
  if(!trip){
    return res.json({ status: 400, message: "Trip not found" });
  }
  var user = await User.findOne({email:email});
  if(!user){
    user = await User.create({
      name: name,
      email: email,
    });
  }
  var tripuser = await TripUser.findOne({ trip: trip._id, user: user._id });
  if (tripuser){
    if(!tripuser.involved){
      tripuser.involved = true;
      await tripuser.save();
      user.trips.push(trip._id);
      await user.save();
      return res.json({
        status: 200,
        message: "Trip joined successfully",
        data: trip,
      });
    }
    return res.json({ status: 400, message: "Already joined this trip" });
  }
  tripuser = await TripUser.create({
    trip: trip._id,
    user: user._id,
    name: user.name,
    dp: user.dp
  });
  trip.users.push(tripuser._id);
  await trip.save();
  user.trips.push(trip._id);
  await user.save();
  return res.json({ status: 200, message: "Trip joined successfully", user,tripuser });
}

module.exports = {
  createTrip,
  getTrips,
  joinTrips,
  getTrip,
  leaveTrip,
  addToTrip,
  addNewUserToTrip,
};
