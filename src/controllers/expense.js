const Expense = require("../models/expense");
const Trip = require("../models/trip");

const createExpense = async (req, res) => {
  const { trip, name, amount, category, split_type, paid_by, paid_for } =
    req.body;
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
  });
  tripObj.expenses.push(expense._id);
  await tripObj.save();
  return res.json({ status: 200, data: expense });
};
const updateExpense = async (req, res) => {
  const { id, trip, name, amount, category, split_type, paid_by, paid_for } =
    req.body;
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
  expense.name = name;
  expense.amount = amount;
  expense.category = category;
  expense.split_type = split_type;
  expense.paid_by = paid_by;
  expense.paid_for = paid_for;
  await expense.save();
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
  trip.expenses = trip.expenses.filter((exp) => exp.toString() !== id);
  await trip.save();
  await expense.delete();
  return res.json({ status: 200, data: "Expense Deleted" });
};

module.exports = {
  createExpense,
  deleteExpense,
  updateExpense,
};
