const Activity = require("../models/activity");

const projectActivity = (a) => ({
  id: a._id,
  entity_id: a.entity_id,
  entity_type: a.entity_type,
  category: a.category,
  title: a.title,
  net: a.net,
  subtitle: a.subtitle,
  created_at: a.created_at,
  read: a.read,
});

const getActivities = async (req, res) => {
  const { offset, limit } = req.query;
  
  const q = { user: req.user._id };
  if (offset || limit) {
    if (isNaN(offset) || isNaN(limit) || offset < 0 || limit <= 0) {
      return res.json({ status: 400, message: "Invalid pagination parameters" });
    }
  }

  const activities = await Activity.find(q)
    .sort({ created_at: -1 })
    .skip(parseInt(offset) || 0)
    .limit(parseInt(limit) || 20);
  const total = await Activity.countDocuments(q);

  return res.json({
    status: 200,
    data: activities.map(projectActivity),
    pagination: { offset, limit, total },
  });
};

const markActivityAsRead = async (req, res) => {
  const result = await Activity.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { read: true } }
  );
  if (!result) {
    return res.json({ status: 400, message: "Activity not found" });
  }
  return res.json({ status: 200, message: "Activity marked as read" });
};

module.exports = { getActivities, markActivityAsRead };
