const mongoose = require("mongoose");
const Comment = require("../models/comment");
const TripUser = require("../models/trip_user");
const Expense = require("../models/expense");
const Payment = require("../models/payment");
const Logging = require("../utilities/logging");
const { recordActivity } = require("../utilities/activity");

const getComments = async (req, res) => {
  const { entity_type, entity_id } = req.params;
  if (!entity_type || !entity_id) {
    return res.json({ status: 400, message: "Missing parameters" });
  }
  if (!["expense", "payment"].includes(entity_type)) {
    return res.json({ status: 400, message: "Invalid entity type" });
  }

  if (!mongoose.Types.ObjectId.isValid(entity_id)) {
    return res.json({ status: 400, message: "Invalid entity ID" });
  }
  const comments = await Comment.find({ entity_type, entity_id })
    .populate({ path: "created_by", model: "TripUser" })
    .sort({ created_at: 1 });
  return res.json({ status: 200, data: comments });
};

const createComment = async (req, res) => {
  const { entity_type, entity_id, trip, title, body } = req.body;
  if (!entity_type || !entity_id || !trip || !title) {
    return res.json({ status: 400, message: "Missing parameters" });
  }
  if (!["expense", "payment"].includes(entity_type)) {
    return res.json({ status: 400, message: "Invalid entity type" });
  }
  const tripUser = await TripUser.findOne({ trip, user: req.user._id });
  if (!tripUser || !tripUser.involved) {
    return res.json({ status: 400, message: "Not involved in trip" });
  }
  const entity_type_model = entity_type === "expense" ? "Expense" : "Payment";
  const comment = await Comment.create({
    entity_type,
    entity_id,
    entity_type_model,
    trip,
    type: "user",
    created_by: tripUser._id,
    title,
    body: body || "",
  });
  const populated = await comment.populate({ path: "created_by", model: "TripUser" });

  const entity =
    entity_type === "expense"
      ? await Expense.findById(entity_id).select("_id name category").lean()
      : await Payment.findById(entity_id).select("_id amount").lean();
  if (entity) {
    try {
      await recordActivity({
        action_type: entity_type === "expense" ? "expense_comment" : "payment_comment",
        trip_id: trip,
        actor_user_id: req.user._id,
        entity_id,
        entity_type,
        payload: { entity, body: body || title },
      });
    } catch (e) {
      Logging.error(`recordActivity(${entity_type}_comment) failed: ${e.message}`);
    }
  }

  return res.json({ status: 200, data: populated });
};

const deleteComment = async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findById(id);
  if (!comment) {
    return res.json({ status: 400, message: "Comment not found" });
  }
  if (comment.type === "system") {
    return res.json({ status: 403, message: "Cannot delete system-generated comments" });
  }
  const tripUser = await TripUser.findOne({ trip: comment.trip, user: req.user._id });
  if (!tripUser || comment.created_by.toString() !== tripUser._id.toString()) {
    return res.json({ status: 403, message: "Can only delete your own comments" });
  }
  await comment.deleteOne();
  return res.json({ status: 200, message: "Comment deleted" });
};

module.exports = { getComments, createComment, deleteComment };
