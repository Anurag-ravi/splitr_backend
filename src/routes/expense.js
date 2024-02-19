const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const {
  createExpense,
  deleteExpense,
  updateExpense,
} = require("../controllers/expense");

router.post("/new", authMiddleware, createExpense);
router.post("/update", authMiddleware, updateExpense);
router.delete("/:id", authMiddleware, deleteExpense);

module.exports = router;
