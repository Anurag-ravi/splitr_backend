const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const {
  createTrip,
  getTrips,
  joinTrips,
  getTrip,
  leaveTrip,
  addToTrip,
  addNewUserToTrip,
} = require("../controllers/trip");

router.post("/new", authMiddleware, createTrip);
router.get("/", authMiddleware, getTrips);
router.get("/:id", authMiddleware, getTrip);
router.post("/join", authMiddleware, joinTrips);
router.get("/:id/leave", authMiddleware, leaveTrip);
router.post("/:id/add", authMiddleware, addToTrip);
router.post("/:id/add-new", authMiddleware, addNewUserToTrip);

module.exports = router;
