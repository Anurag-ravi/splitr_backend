const { admin } = require("../utilities/firebase_admin");
const User = require("../models/usermodel");
const Logging = require("../utilities/logging");

const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

const sendActivityNotifications = async (rows) => {
  try {
    if (!rows || rows.length === 0) return;

    const byUser = new Map();
    for (const row of rows) {
      const key = row.user.toString();
      if (!byUser.has(key)) byUser.set(key, []);
      byUser.get(key).push(row);
    }

    const userIds = Array.from(byUser.keys());
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id fcm_tokens")
      .lean();

    await Promise.allSettled(
      users.map(async (u) => {
        const tokens = u.fcm_tokens || [];
        if (tokens.length === 0) return;
        const row = byUser.get(u._id.toString())[0];

        const message = {
          tokens,
          notification: {
            title: row.title,
            body: row.subtitle || "",
          },
          data: {
            activity_id: row._id.toString(),
            trip_id: row.trip.toString(),
            entity_id: row.entity_id.toString(),
            entity_type: row.entity_type,
            action_type: row.action_type,
          },
          android: { priority: "high" },
          apns: { headers: { "apns-priority": "10" } },
        };

        const resp = await admin.messaging().sendEachForMulticast(message);

        const dead = [];
        resp.responses.forEach((r, i) => {
          if (r.success) return;
          const code = r.error && r.error.code;
          if (DEAD_TOKEN_CODES.has(code)) {
            dead.push(tokens[i]);
          } else {
            Logging.warning(`FCM send error for user ${u._id}: ${code}`);
          }
        });

        if (dead.length > 0) {
          await User.updateOne(
            { _id: u._id },
            { $pull: { fcm_tokens: { $in: dead } } }
          );
          Logging.info(
            `Pruned ${dead.length} dead FCM token(s) for user ${u._id}`
          );
        }

        Logging.info(
          `FCM: sent ${resp.successCount}/${tokens.length} to user ${u._id}`
        );
      })
    );
  } catch (err) {
    Logging.error(`FCM dispatch failed: ${err.message}`);
  }
};

module.exports = { sendActivityNotifications };
