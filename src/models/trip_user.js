const Double = require("@mongoosejs/double");
const mongoose = require("mongoose");

const tripUserSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String },
  paid: { type: Double, default: 0.0 },
  owed: { type: Double, default: 0.0 },
  is_involved: { type: Boolean, default: false },
});

const TripUser = mongoose.model("TripUser", tripUserSchema);
module.exports = TripUser;
