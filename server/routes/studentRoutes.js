const express = require("express");
const {
  getStudents,
  addSingleStudent,
  uploadStudentSheet,    // 👈 ADD THIS
  deleteStudent,
  getAnalyticsSummary,
  updateStudent     // 👈 ADD THIS
} = require("../controllers/studentController");

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", protect, getStudents);
router.post("/add", protect, addSingleStudent);
router.post(
  "/upload",
  protect,
  upload.single("file"),
  uploadStudentSheet
);

router.get("/analytics/summary", protect, getAnalyticsSummary);
router.put("/:id", protect, updateStudent);

router.delete("/:id", protect, deleteStudent);

module.exports = router;
