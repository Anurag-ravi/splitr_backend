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

module.exports = {
  createExpense,
};
