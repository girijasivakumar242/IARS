const express = require("express");
const {
  submitStudentForm,
  getStudents,
  getAnalyticsSummary,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/submit/:sessionCode", submitStudentForm);
router.get("/", protect, getStudents);
router.get("/analytics/summary", protect, getAnalyticsSummary);
router.put("/:id", protect, updateStudent);
router.delete("/:id", protect, deleteStudent);

module.exports = router;