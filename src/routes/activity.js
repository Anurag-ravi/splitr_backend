const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const { getActivities, getActivityDetail, markActivityAsRead } = require("../controllers/activity");

router.get("/", authMiddleware, getActivities);
router.post("/:id/read", authMiddleware, markActivityAsRead);

module.exports = router;
