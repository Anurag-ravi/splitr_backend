const Double = require("@mongoosejs/double");
const mongoose = require("mongoose");

const tripUserSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String },
  dp: {type: String},
  involved: {type: Boolean,default: true}
});

const TripUser = mongoose.model("TripUser", tripUserSchema);
module.exports = TripUser;
