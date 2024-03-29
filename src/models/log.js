const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  user: {
    type: String,
  },
  category: {
    type: String,
    enum: ["log", "bug/feature", "support"],
    default: "log",
  },
  message: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Log = mongoose.model("Log", logSchema);
module.exports = Log;
