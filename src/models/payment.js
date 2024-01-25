const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const paymentSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
  amount: { type: Double, required: true, default: 0.0 },
  description: { type: String, default: "" },
  created: { type: Date, default: Date.now },
  by: { type: mongoose.Schema.Types.ObjectId, ref: "TripUser", required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "TripUser", required: true },
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
