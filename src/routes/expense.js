const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const { createExpense } = require("../controllers/expense");

router.post('/new',authMiddleware,createExpense);

module.exports = router;