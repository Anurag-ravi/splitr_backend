const Expense = require("../models/expense");
const Trip = require("../models/trip");
const TripUser = require("../models/trip_user");
const Comment = require("../models/comment");
const Logging = require("../utilities/logging");
const {
  recordActivity,
  createSystemComment,
  snapshotExpense,
} = require("../utilities/activity");

const safeRecord = async (args) => {
  try {
    await recordActivity(args);
  } catch (e) {
    Logging.error(`recordActivity(${args.action_type}) failed: ${e.message}`);
  }
};

const createExpense = async (req, res) => {
  const {
    trip,
    name,
    amount,
    category,
    split_type,
    paid_by,
    paid_for,
    created,
  } = req.body;
  if (
    !trip ||
    !name ||
    !amount ||
    !category ||
    !split_type ||
    !paid_by ||
    !paid_for
  )
    return res.json({ status: 400, message: "Fill all the fields" });
  const tripObj = await Trip.findOne({ _id: trip }).populate({
    path: "users",
    model: "TripUser",
  });
  if (!tripObj) return res.json({ status: 400, message: "Trip not found" });

  var user_involved = false;
  tripObj.users.map((tripUser) => {
    if (tripUser.user.toString() === req.user._id.toString()) {
      user_involved = true;
    }
  });
  if (!user_involved)
    return res.json({ status: 400, message: "Not involved in trip" });

  const expense = await Expense.create({
    trip,
    name,
    amount,
    category,
    split_type,
    paid_by,
    paid_for,
    created: created || new Date(),
  });
  tripObj.expenses.push(expense._id);
  await tripObj.save();
  await safeRecord({
    action_type: "expense_create",
    trip_id: trip,
    actor_user_id: req.user._id,
    entity_id: expense._id,
    entity_type: "expense",
    payload: { expense },
  });

  return res.json({ status: 200, data: expense });
};

const updateExpense = async (req, res) => {
  const {
    id,
    trip,
    name,
    amount,
    category,
    split_type,
    paid_by,
    paid_for,
    created,
  } = req.body;
  if (
    !trip ||
    !name ||
    !amount ||
    !category ||
    !split_type ||
    !paid_by ||
    !paid_for
  )
    return res.json({ status: 400, message: "Fill all the fields" });
  const tripObj = await Trip.findOne({ _id: trip }).populate({
    path: "users",
    model: "TripUser",
  });
  if (!tripObj) return res.json({ status: 400, message: "Trip not found" });

  var user_involved = false;
  tripObj.users.map((tripUser) => {
    if (tripUser.user.toString() === req.user._id.toString()) {
      user_involved = true;
    }
  });
  if (!user_involved)
    return res.json({ status: 400, message: "Not involved in trip" });

  const expense = await Expense.findById(id);
  if (!expense) return res.json({ status: 400, message: "Expense not found" });
  const beforeSnapshot = snapshotExpense(expense);
  expense.name = name;
  expense.amount = amount;
  expense.category = category;
  expense.split_type = split_type;
  expense.paid_by = paid_by;
  expense.paid_for = paid_for;
  if (created) {
    expense.created = created;
  }
  await expense.save();

  const afterSnapshot = snapshotExpense(expense);
  const actorTripUser = await TripUser.findOne({
    trip,
    user: req.user._id,
  }).select("_id");
  if (actorTripUser) {
    await createSystemComment({
      entity_type: "expense",
      entity_id: expense._id,
      trip,
      created_by: actorTripUser._id,
      title: "Expense updated",
      body: `${req.user.name} updated this expense`,
      diff: { before: beforeSnapshot, after: afterSnapshot },
    });
  }
  await safeRecord({
    action_type: "expense_update",
    trip_id: trip,
    actor_user_id: req.user._id,
    entity_id: expense._id,
    entity_type: "expense",
    payload: { expense },
  });

  return res.json({ status: 200, data: expense });
};

const deleteExpense = async (req, res) => {
  const { id } = req.params;
  const expense = await Expense.findById(id).populate("trip");
  if (!expense) {
    return res.json({ status: 400, message: "Expense not found" });
  }
  const trip = await Trip.findById(expense.trip._id);
  if (!trip) {
    return res.json({ status: 400, message: "Trip not found" });
  }
  const beforeSnapshot = snapshotExpense(expense);
  const tripId = trip._id;
  trip.expenses = trip.expenses.filter((exp) => exp.toString() !== id);
  await trip.save();
  await expense.deleteOne();
  await Comment.deleteMany({ entity_type: "expense", entity_id: id });
  await safeRecord({
    action_type: "expense_delete",
    trip_id: tripId,
    actor_user_id: req.user._id,
    entity_id: id,
    entity_type: "expense",
    payload: { expense: beforeSnapshot },
  });
  return res.json({ status: 200, data: "Expense Deleted" });
};

module.exports = {
  createExpense,
  deleteExpense,
  updateExpense,
};
