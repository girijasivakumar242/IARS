const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getParentProfile,
  linkChild,
  getChildRecords,
  getChildRecord,
  getChildrenWithRecords,
  unlinkChild,
  updateParentProfile
} = require("../controllers/parentController");

const router = express.Router();

// All parent routes require authentication
router.use(protect);

// Parent profile
router.get("/profile", getParentProfile);
router.put("/profile", updateParentProfile);

// Manage children
router.post("/children/link", linkChild);
router.delete("/children/:studentRegNo", unlinkChild);

// Get children records
router.get("/children", getChildrenWithRecords);
router.get("/children/:studentRegNo/records", getChildRecords);
router.get("/children/:studentRegNo/records/:recordId", getChildRecord);

module.exports = router;
