const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const { getComments, createComment, deleteComment } = require("../controllers/comment");

router.get("/:entity_type/:entity_id", authMiddleware, getComments);
router.post("/new", authMiddleware, createComment);
router.delete("/:id", authMiddleware, deleteComment);

module.exports = router;
