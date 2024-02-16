const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
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
