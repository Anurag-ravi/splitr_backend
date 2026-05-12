const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  entity_type: { type: String, enum: ["expense", "payment"], required: true },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "entity_type_model",
  },
  entity_type_model: { type: String, enum: ["Expense", "Payment"], required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
  type: { type: String, enum: ["system", "user"], required: true, default: "user" },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "TripUser", required: true },
  title: { type: String, required: true },
  body: { type: String, default: "" },
  diff: { type: mongoose.Schema.Types.Mixed, default: null },
  created_at: { type: Date, default: Date.now },
});

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
