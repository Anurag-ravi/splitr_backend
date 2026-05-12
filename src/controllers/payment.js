const Payment = require("../models/payment");
const Trip = require("../models/trip");
const TripUser = require("../models/trip_user");
const Comment = require("../models/comment");
const Logging = require("../utilities/logging");
const {
  recordActivity,
  createSystemComment,
  snapshotPayment,
} = require("../utilities/activity");

const safeRecord = async (args) => {
  try {
    await recordActivity(args);
  } catch (e) {
    Logging.error(`recordActivity(${args.action_type}) failed: ${e.message}`);
  }
};

const createPayment = async (req, res) => {
  var { by, to, amount, trip_id, created } = req.body;
  if (!created) {
    created = new Date();
  }
  const trip = await Trip.findById(trip_id);
  if (!trip) return res.json({ status: 400, message: "Trip not found" });
  if (by === to)
    return res.json({ status: 400, message: "Cannot pay to self" });
  const tripuser1 = await TripUser.findById(by);
  const tripuser2 = await TripUser.findById(to);
  if (!tripuser1 || !tripuser2)
    return res.json({ status: 400, message: "User not found" });
  if (
    tripuser1.trip.toString() !== trip_id ||
    tripuser2.trip.toString() !== trip_id
  )
    return res.json({ status: 400, message: "User not in trip" });
  const payment = await Payment.create({
    trip: trip_id,
    amount,
    by,
    to,
    created,
  });
  trip.payments.push(payment._id);
  await trip.save();
  await safeRecord({
    action_type: "payment_create",
    trip_id,
    actor_user_id: req.user._id,
    entity_id: payment._id,
    entity_type: "payment",
    payload: { payment },
  });

  return res.json({ status: 200, message: "Payment created", data: payment });
};

const deletePayment = async (req, res) => {
  const { id } = req.params;
  const payment = await Payment.findById(id).populate("trip");
  if (!payment) return res.json({ status: 400, message: "Payment not found" });
  const trip = await Trip.findById(payment.trip._id);
  const beforeSnapshot = snapshotPayment(payment);
  const tripId = trip._id;
  trip.payments = trip.payments.filter((p) => p.toString() !== id);
  await trip.save();
  await payment.deleteOne();
  await Comment.deleteMany({ entity_type: "payment", entity_id: id });
  await safeRecord({
    action_type: "payment_delete",
    trip_id: tripId,
    actor_user_id: req.user._id,
    entity_id: id,
    entity_type: "payment",
    payload: { payment: beforeSnapshot },
  });
  return res.json({ status: 200, message: "Payment deleted" });
};

const updatePayment = async (req, res) => {
  const { id } = req.params;
  const { amount, created } = req.body;
  const payment = await Payment.findById(id);
  if (!payment) return res.json({ status: 400, message: "Payment not found" });
  const beforeSnapshot = snapshotPayment(payment);
  payment.amount = amount;
  if (created) payment.created = created;
  await payment.save();
  const afterSnapshot = snapshotPayment(payment);
  const actorTripUser = await TripUser.findOne({
    trip: payment.trip,
    user: req.user._id,
  }).select("_id");
  if (actorTripUser) {
    await createSystemComment({
      entity_type: "payment",
      entity_id: payment._id,
      trip: payment.trip,
      created_by: actorTripUser._id,
      title: "Payment updated",
      body: `${req.user.name} updated this payment`,
      diff: { before: beforeSnapshot, after: afterSnapshot },
    });
  }
  await safeRecord({
    action_type: "payment_update",
    trip_id: payment.trip,
    actor_user_id: req.user._id,
    entity_id: payment._id,
    entity_type: "payment",
    payload: { payment },
  });
  return res.json({ status: 200, message: "Payment updated", data: payment });
};

module.exports = {
  createPayment,
  deletePayment,
  updatePayment,
};
