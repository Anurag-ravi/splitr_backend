const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const { createExpense, deleteExpense } = require("../controllers/expense");

router.post('/new',authMiddleware,createExpense);
router.delete('/:id',authMiddleware,deleteExpense)

module.exports = router;