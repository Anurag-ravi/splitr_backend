const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const { createPayment, deletePayment } = require("../controllers/payment");

router.post("/new", authMiddleware, createPayment);
router.delete("/:id", authMiddleware, deletePayment);

module.exports = router;