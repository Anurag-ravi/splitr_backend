const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
  action_type: {
    type: String,
    enum: [
      "trip_create",
      "trip_name_edit",
      "member_join",
      "member_leave",
      "member_add",
      "member_remove",
      "expense_create",
      "expense_update",
      "expense_delete",
      "payment_create",
      "payment_update",
      "payment_delete",
      "expense_comment",
      "payment_comment",
    ],
    required: true,
  },
  entity_type: {
    type: String,
    enum: ["trip", "expense", "payment"],
    required: true,
  },
  entity_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  category: { type: String, default: null },
  title: { type: String, required: true },
  subtitle: { type: String, default: null },
  net: { type: String, enum: ["+", "-", "0"], required: true },
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

activitySchema.index({ user: 1, created_at: -1 });
activitySchema.index({ user: 1, read: 1 });
activitySchema.index({ user: 1, trip: 1, read: 1 });
activitySchema.index({ trip: 1 });

const Activity = mongoose.model("Activity", activitySchema);
module.exports = Activity;
