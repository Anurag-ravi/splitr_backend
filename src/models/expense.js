const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");

const categories = [
  "bicycle",
  "bus-train",
  "car",
  "cleaning",
  "clothing",
  "dining",
  "education",
  "electricity",
  "electronics",
  "fuel",
  "furniture",
  "games",
  "gas",
  "general",
  "gifts",
  "groceries",
  "hotel",
  "household-supplies",
  "internet",
  "liquor",
  "maintenance",
  "medical",
  "mortgage",
  "movies",
  "music",
  "parking",
  "pets",
  "plane",
  "services",
  "sports",
  "taxi",
  "trash",
  "water",
];
const expenseSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
  name: { type: String, required: true },
  amount: { type: Double, required: true, default: 0.0 },
  category: {
    type: String,
    enum: categories,
    required: true,
    default: "general",
  },
  split_type:{
    type: String,
    enum: ["equal","unequal","percent","shares"],
    required: true,
    default: "equal",
  },
  description: { type: String, default: "" },
  created: { type: Date, default: Date.now },
  paid_by: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TripUser",
        required: true,
      },
      amount: { type: Double, required: true, default: 0.0 },
    },
  ],
  paid_for: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TripUser",
        required: true,
      },
      share_or_percent: {
        type: Double,
        default: 0.0,
      },
      amount: { type: Double, required: true, default: 0.0 },
    },
  ],
});

const Expense = mongoose.model("Expense", expenseSchema);
module.exports = Expense;
