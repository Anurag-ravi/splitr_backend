const otpGenerator = require("otp-generator");
const Trip = require("../models/trip");
const TripUser = require("../models/trip_user");
const User = require("../models/usermodel");
const Expense = require("../models/expense");
const Payment = require("../models/payment");
const Activity = require("../models/activity");
const Comment = require("../models/comment");
const Logging = require("../utilities/logging");
const { recordActivity } = require("../utilities/activity");

const safeRecord = async (args) => {
  try {
    await recordActivity(args);
  } catch (e) {
    Logging.error(
      `recordActivity(${args.action_type}) failed: ${e.message}`
    );
  }
};

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
    dp: user.dp,
  });
  await tripuser.save();
  trip.users.push(tripuser._id);
  await trip.save();
  user.trips.push(trip._id);
  await user.save();
  await safeRecord({
    action_type: "trip_create",
    trip_id: trip._id,
    actor_user_id: user._id,
    entity_id: trip._id,
    entity_type: "trip",
    payload: {},
  });
  return res.json({
    status: 200,
    message: "Trip created successfully",
    data: trip,
  });
};

const getTrips = async (req, res) => {
  const user = req.user;
  await user.populate({
    path: "trips",
    model: "Trip",
    populate: [
      { path: "expenses", model: "Expense" },
      { path: "payments", model: "Payment" },
      { path: "users", model: "TripUser" },
    ],
  });

  const tripIds = user.trips.map((t) => t._id);
  const unreadAgg = tripIds.length
    ? await Activity.aggregate([
        { $match: { user: user._id, trip: { $in: tripIds }, read: false } },
        { $group: { _id: "$trip", count: { $sum: 1 } } },
      ])
    : [];
  const unreadMap = new Map(
    unreadAgg.map((x) => [x._id.toString(), x.count])
  );

  const tripsData = user.trips.map((trip) => {
    const tripData = trip.toObject();
    tripData.unread_activity_count =
      unreadMap.get(tripData._id.toString()) || 0;
    return tripData;
  });

  return res.json({
    status: 200,
    message: "Trips fetched successfully",
    data: tripsData,
  });
};

const getTrip = async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findOne({ _id: id })
    .populate({ path: "users", model: "TripUser" })
    .populate({ path: "expenses", model: "Expense" })
    .populate({ path: "payments", model: "Payment" });
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
  if (tripuser) {
    if (!tripuser.involved) {
      tripuser.involved = true;
      await tripuser.save();
      user.trips.push(trip._id);
      await user.save();
      await safeRecord({
        action_type: "member_join",
        trip_id: trip._id,
        actor_user_id: user._id,
        entity_id: trip._id,
        entity_type: "trip",
        payload: {},
      });
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
    dp: user.dp,
  });
  await tripuser.save();
  trip.users.push(tripuser._id);
  await trip.save();
  user.trips.push(trip._id);
  await user.save();
  await safeRecord({
    action_type: "member_join",
    trip_id: trip._id,
    actor_user_id: user._id,
    entity_id: trip._id,
    entity_type: "trip",
    payload: {},
  });
  return res.json({
    status: 200,
    message: "Trip joined successfully",
    data: trip,
  });
};

const leaveTrip = async (req, res) => {
  const { id } = req.params;
  const tripUser = await TripUser.findOne({ trip: id, user: req.user._id });
  if (!tripUser) {
    return res.json({ status: 400, message: "Not part of that group" });
  }
  tripUser.involved = false;
  await tripUser.save();
  req.user.trips = req.user.trips.filter((trip) => trip.toString() !== id);
  await req.user.save();
  await safeRecord({
    action_type: "member_leave",
    trip_id: id,
    actor_user_id: req.user._id,
    entity_id: id,
    entity_type: "trip",
    payload: {},
    extra_recipient_user_ids: [req.user._id],
  });
  return res.json({ status: 200, message: "Left this trip" });
};

const addToTrip = async (req, res) => {
  const { user_id } = req.body;
  const { id } = req.params;
  const user = await User.findById(user_id);
  if (!user_id) return res.json({ status: 400, message: "Missing parameters" });
  var trip = await Trip.findById(id);
  if (!trip) return res.json({ status: 400, message: "Trip not found" });
  var tripuser = await TripUser.findOne({ trip: trip._id, user: user._id });
  if (tripuser) {
    if (!tripuser.involved) {
      tripuser.involved = true;
      await tripuser.save();
      user.trips.push(trip._id);
      await user.save();
      await safeRecord({
        action_type: "member_add",
        trip_id: trip._id,
        actor_user_id: req.user._id,
        entity_id: trip._id,
        entity_type: "trip",
        payload: { target_user_id: user._id },
      });
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
    dp: user.dp,
  });
  await tripuser.save();
  trip.users.push(tripuser._id);
  await trip.save();
  user.trips.push(trip._id);
  await user.save();
  await safeRecord({
    action_type: "member_add",
    trip_id: trip._id,
    actor_user_id: req.user._id,
    entity_id: trip._id,
    entity_type: "trip",
    payload: { target_user_id: user._id },
  });
  return res.json({
    status: 200,
    message: "Trip joined successfully",
    data: trip,
  });
};

const addMultipleUsersToTrip = async (req, res) => {
  const { id } = req.params;
  const { users } = req.body;
  const trip = await Trip.findById(id);
  if (!trip) {
    return res.json({ status: 400, message: "Trip not found" });
  }
  for (let i = 0; i < users.length; i++) {
    const user = await User.findById(users[i]);
    if (!user) {
      continue;
    }
    var tripuser = await TripUser.findOne({ trip: trip._id, user: user._id });
    if (tripuser) {
      if (!tripuser.involved) {
        tripuser.involved = true;
        await tripuser.save();
        user.trips.push(trip._id);
        await user.save();
        await safeRecord({
          action_type: "member_add",
          trip_id: trip._id,
          actor_user_id: req.user._id,
          entity_id: trip._id,
          entity_type: "trip",
          payload: { target_user_id: user._id },
        });
      }
    } else {
      tripuser = await TripUser.create({
        trip: trip._id,
        user: user._id,
        name: user.name,
        dp: user.dp,
      });
      await tripuser.save();
      trip.users.push(tripuser._id);
      await trip.save();
      user.trips.push(trip._id);
      await user.save();
      await safeRecord({
        action_type: "member_add",
        trip_id: trip._id,
        actor_user_id: req.user._id,
        entity_id: trip._id,
        entity_type: "trip",
        payload: { target_user_id: user._id },
      });
    }
  }
  var modified_trip = await Trip.findById(id).populate({
    path: "users",
    model: "TripUser",
  });
  return res.json({
    status: 200,
    message: "Trip joined successfully",
    data: modified_trip.users,
  });
};

const removeMultipleUsersFromTrip = async (req, res) => {
  const { id } = req.params;
  const { users } = req.body;
  const trip = await Trip.findById(id);
  if (!trip) {
    return res.json({ status: 400, message: "Trip not found" });
  }
  for (let i = 0; i < users.length; i++) {
    const user = await User.findById(users[i]);
    if (!user) {
      continue;
    }
    var tripuser = await TripUser.findOne({ trip: trip._id, user: user._id });
    if (tripuser) {
      tripuser.involved = false;
      await tripuser.save();
      user.trips = user.trips.filter((trip) => trip.toString() !== id);
      await user.save();
      await safeRecord({
        action_type: "member_remove",
        trip_id: trip._id,
        actor_user_id: req.user._id,
        entity_id: trip._id,
        entity_type: "trip",
        payload: { target_user_id: user._id },
        extra_recipient_user_ids: [user._id],
      });
    }
  }
  var modified_trip = await Trip.findById(id).populate({
    path: "users",
    model: "TripUser",
  });
  return res.json({
    status: 200,
    message: "Removed from trip successfully",
    data: modified_trip.users,
  });
};

const addNewUserToTrip = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  const trip = await Trip.findById(id);
  if (!trip) {
    return res.json({ status: 400, message: "Trip not found" });
  }
  var user = await User.findOne({ email: email });
  if (!user) {
    user = await User.create({ name: name, email: email });
  }
  var tripuser = await TripUser.findOne({ trip: trip._id, user: user._id });
  if (tripuser) {
    if (!tripuser.involved) {
      tripuser.involved = true;
      await tripuser.save();
      user.trips.push(trip._id);
      await user.save();
      await safeRecord({
        action_type: "member_add",
        trip_id: trip._id,
        actor_user_id: req.user._id,
        entity_id: trip._id,
        entity_type: "trip",
        payload: { target_user_id: user._id },
      });
      var modified_trip = await Trip.findById(id).populate({
        path: "users",
        model: "TripUser",
      });
      return res.json({
        status: 200,
        message: "Trip joined successfully",
        data: modified_trip.users,
      });
    }
    return res.json({ status: 400, message: "Already joined this trip" });
  }
  tripuser = await TripUser.create({
    trip: trip._id,
    user: user._id,
    name: user.name,
    dp: user.dp,
  });
  await tripuser.save();
  trip.users.push(tripuser._id);
  await trip.save();
  user.trips.push(trip._id);
  await user.save();
  await safeRecord({
    action_type: "member_add",
    trip_id: trip._id,
    actor_user_id: req.user._id,
    entity_id: trip._id,
    entity_type: "trip",
    payload: { target_user_id: user._id },
  });
  var modified_trip = await Trip.findById(id).populate({
    path: "users",
    model: "TripUser",
  });
  return res.json({
    status: 200,
    message: "Trip joined successfully",
    data: modified_trip.users,
  });
};

const editTripName = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const trip = await Trip.findById(id);
  if (!trip) {
    return res.json({ status: 400, message: "Trip not found" });
  }
  const oldName = trip.name;
  trip.name = name;
  await trip.save();
  await safeRecord({
    action_type: "trip_name_edit",
    trip_id: trip._id,
    actor_user_id: req.user._id,
    entity_id: trip._id,
    entity_type: "trip",
    payload: { before: oldName, after: name },
  });
  return res.json({ status: 200, message: "Trip name updated" });
};

const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findById(id).populate([
      { path: "expenses", select: "_id" },
      { path: "payments", select: "_id" },
      { path: "users" },
    ]);

    if (!trip) {
      return res.json({ status: 400, message: "Trip not found" });
    }

    trip.users.forEach(async (tripuser) => {
      const user_id = tripuser.user;
      const user = await User.findById(user_id);
      if (user) {
        user.trips = user.trips.filter((trip) => trip.toString() !== id);
        await user.save();
      }
      await TripUser.findByIdAndDelete(tripuser._id);
    });

    trip.expenses.forEach(async (expense) => {
      await Expense.findByIdAndDelete(expense._id);
    });

    trip.payments.forEach(async (payment) => {
      await Payment.findByIdAndDelete(payment._id);
    });

    await Activity.deleteMany({ trip: id });
    await Comment.deleteMany({ trip: id });
    await trip.deleteOne();
    return res.json({ status: 200, message: "Trip deleted" });
  } catch (error) {
    console.log(error);
    return res.json({ status: 500, message: "Server error" });
  }
};

module.exports = {
  createTrip,
  getTrips,
  joinTrips,
  getTrip,
  leaveTrip,
  addToTrip,
  addNewUserToTrip,
  editTripName,
  deleteTrip,
  addMultipleUsersToTrip,
  removeMultipleUsersFromTrip,
};
