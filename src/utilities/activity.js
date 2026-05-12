const Activity = require("../models/activity");
const Comment = require("../models/comment");
const Trip = require("../models/trip");
const TripUser = require("../models/trip_user");
const Logging = require("./logging");
const { renderActivityRows } = require("./activity_render");
const { sendActivityNotifications } = require("../services/fcm");

const toPerson = (tu) => ({
  tripUserId: tu._id,
  userId: tu.user,
  name: tu.name,
});

const recordActivity = async ({
  action_type,
  trip_id,
  actor_user_id,
  entity_id,
  entity_type,
  payload = {},
  extra_recipient_user_ids = [],
}) => {
  const trip = await Trip.findById(trip_id).select("_id name").lean();
  if (!trip) throw new Error(`Trip ${trip_id} not found`);

  const involved = await TripUser.find({ trip: trip_id, involved: true })
    .select("_id user name")
    .lean();

  const indexByTripUserId = new Map();
  const indexByUserId = new Map();
  for (const tu of involved) {
    indexByTripUserId.set(tu._id.toString(), tu);
    indexByUserId.set(tu.user.toString(), tu);
  }

  let actorTu = indexByUserId.get(actor_user_id.toString());
  if (!actorTu) {
    actorTu = await TripUser.findOne({ trip: trip_id, user: actor_user_id })
      .select("_id user name")
      .lean();
  }
  if (!actorTu) throw new Error("Actor TripUser not found");
  indexByTripUserId.set(actorTu._id.toString(), actorTu);
  indexByUserId.set(actorTu.user.toString(), actorTu);
  const actor = toPerson(actorTu);

  const resolveByUserId = async (userId) => {
    const cached = indexByUserId.get(userId.toString());
    if (cached) return cached;
    const tu = await TripUser.findOne({ trip: trip_id, user: userId })
      .select("_id user name")
      .lean();
    if (tu) {
      indexByTripUserId.set(tu._id.toString(), tu);
      indexByUserId.set(tu.user.toString(), tu);
    }
    return tu;
  };

  const resolveByTripUserId = async (tripUserId) => {
    if (!tripUserId) return null;
    const cached = indexByTripUserId.get(tripUserId.toString());
    if (cached) return cached;
    const tu = await TripUser.findById(tripUserId)
      .select("_id user name")
      .lean();
    if (tu) {
      indexByTripUserId.set(tu._id.toString(), tu);
      indexByUserId.set(tu.user.toString(), tu);
    }
    return tu;
  };

  let target = null;
  let by = null;
  let to = null;

  if (action_type === "member_add" || action_type === "member_remove") {
    const targetTu = await resolveByUserId(payload.target_user_id);
    if (!targetTu) throw new Error("Target TripUser not found");
    target = toPerson(targetTu);
  }

  if (
    action_type === "payment_create" ||
    action_type === "payment_update" ||
    action_type === "payment_delete"
  ) {
    const payment = payload.payment;
    if (payment) {
      const [byTu, toTu] = await Promise.all([
        resolveByTripUserId(payment.by),
        resolveByTripUserId(payment.to),
      ]);
      if (byTu) by = toPerson(byTu);
      if (toTu) to = toPerson(toTu);
    }
  }

  const recipients = involved.map(toPerson);
  const seen = new Set(recipients.map((r) => r.userId.toString()));
  for (const uid of extra_recipient_user_ids) {
    if (!uid || seen.has(uid.toString())) continue;
    const tu = await resolveByUserId(uid);
    if (tu) {
      recipients.push(toPerson(tu));
      seen.add(tu.user.toString());
    }
  }

  if (recipients.length === 0) return [];

  const rows = renderActivityRows({
    action_type,
    trip,
    actor,
    target,
    by,
    to,
    expense: payload.expense || payload.entity,
    payment: payload.payment || payload.entity,
    rename: payload.before
      ? { before: payload.before, after: payload.after }
      : null,
    comment_body: payload.body,
    entity_id,
    entity_type,
    recipients,
  });

  let inserted;
  try {
    inserted = await Activity.insertMany(rows, { ordered: false });
  } catch (err) {
    Logging.error(`Activity insertMany partial/failed: ${err.message}`);
    inserted = err.insertedDocs || [];
  }

  if (inserted.length > 0) {
    void sendActivityNotifications(inserted).catch((e) =>
      Logging.error(`FCM dispatch error: ${e.message}`)
    );
  }

  return inserted;
};

const createSystemComment = async ({
  entity_type,
  entity_id,
  trip,
  created_by,
  title,
  body,
  diff,
}) => {
  const entity_type_model = entity_type === "expense" ? "Expense" : "Payment";
  return await Comment.create({
    entity_type,
    entity_id,
    entity_type_model,
    trip,
    type: "system",
    created_by,
    title,
    body: body || "",
    diff: diff || null,
    created_at: new Date(),
  });
};

const snapshotExpense = (expense) => ({
  name: expense.name,
  amount: expense.amount,
  category: expense.category,
  split_type: expense.split_type,
  description: expense.description,
  created: expense.created,
  paid_by: expense.paid_by.map((p) => ({ user: p.user.toString(), amount: p.amount })),
  paid_for: expense.paid_for.map((p) => ({
    user: p.user.toString(),
    share_or_percent: p.share_or_percent,
    amount: p.amount,
  })),
});

const snapshotPayment = (payment) => ({
  amount: payment.amount,
  description: payment.description,
  created: payment.created,
  by: payment.by.toString(),
  to: payment.to.toString(),
});

module.exports = {
  recordActivity,
  createSystemComment,
  snapshotExpense,
  snapshotPayment,
};
