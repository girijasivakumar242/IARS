const express = require("express");
const router = express.Router();

const sessionController = require("../controllers/sessionController");
const { protect } = require("../middleware/authMiddleware");

router.post("/create", protect, sessionController.createSession);
router.get("/my-sessions", protect, sessionController.getTeacherSessions);
router.get("/:sessionCode", sessionController.getSessionByCode);

module.exports = router;