const Parent = require("../models/Parent");
const StudentSubmission = require("../models/StudentSubmission");
const User = require("../models/User");

// ================= GET PARENT PROFILE =================
exports.getParentProfile = async (req, res) => {
  try {
    const parentData = await Parent.findOne({ userId: req.user.id });
    if (!parentData) {
      return res.status(404).json({ message: "Parent profile not found" });
    }
    res.json(parentData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= LINK CHILD TO PARENT =================
exports.linkChild = async (req, res) => {
  try {
    const { studentRegNo, studentName, studentEmail } = req.body;

    if (!studentRegNo || !studentName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const parent = await Parent.findOne({ userId: req.user.id });
    if (!parent) {
      return res.status(404).json({ message: "Parent profile not found" });
    }

    // Check if child already linked
    const childExists = parent.children.find(
      (child) => child.studentRegNo === studentRegNo
    );
    if (childExists) {
      return res.status(400).json({ message: "Child already linked to this account" });
    }

    // Add child to parent's children array
    parent.children.push({
      studentRegNo,
      studentName,
      studentEmail: studentEmail || null
    });

    await parent.save();

    res.json({
      success: true,
      message: "Child linked successfully",
      children: parent.children
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET CHILD RECORDS =================
exports.getChildRecords = async (req, res) => {
  try {
    const { studentRegNo } = req.params;

    const parent = await Parent.findOne({ userId: req.user.id });
    if (!parent) {
      return res.status(404).json({ message: "Parent profile not found" });
    }

    // Verify child belongs to this parent
    const childBelongs = parent.children.find(
      (child) => child.studentRegNo === studentRegNo
    );
    if (!childBelongs) {
      return res.status(403).json({ message: "Unauthorized: This child is not linked to your account" });
    }

    // Get all records for this student
    const records = await StudentSubmission.find({ regNo: studentRegNo })
      .populate("teacherId", "name email")
      .populate("sessionId", "sessionCode departmentName")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET SINGLE CHILD RECORD =================
exports.getChildRecord = async (req, res) => {
  try {
    const { studentRegNo, recordId } = req.params;

    const parent = await Parent.findOne({ userId: req.user.id });
    if (!parent) {
      return res.status(404).json({ message: "Parent profile not found" });
    }

    // Verify child belongs to this parent
    const childBelongs = parent.children.find(
      (child) => child.studentRegNo === studentRegNo
    );
    if (!childBelongs) {
      return res.status(403).json({ message: "Unauthorized: This child is not linked to your account" });
    }

    // Get specific record for this student
    const record = await StudentSubmission.findOne({
      _id: recordId,
      regNo: studentRegNo
    })
      .populate("teacherId", "name email")
      .populate("sessionId", "sessionCode departmentName");

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET ALL CHILDREN WITH LATEST RECORDS =================
exports.getChildrenWithRecords = async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.user.id });
    if (!parent) {
      return res.status(404).json({ message: "Parent profile not found" });
    }

    // Get latest record for each child
    const childrenWithRecords = await Promise.all(
      parent.children.map(async (child) => {
        const latestRecord = await StudentSubmission.findOne({
          regNo: child.studentRegNo
        })
          .sort({ createdAt: -1 })
          .limit(1);

        return {
          ...child.toObject(),
          latestRecord: latestRecord || null
        };
      })
    );

    res.json(childrenWithRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UNLINK CHILD =================
exports.unlinkChild = async (req, res) => {
  try {
    const { studentRegNo } = req.params;

    const parent = await Parent.findOne({ userId: req.user.id });
    if (!parent) {
      return res.status(404).json({ message: "Parent profile not found" });
    }

    parent.children = parent.children.filter(
      (child) => child.studentRegNo !== studentRegNo
    );

    await parent.save();

    res.json({
      success: true,
      message: "Child unlinked successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE PARENT PROFILE =================
exports.updateParentProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true }
    );

    const parent = await Parent.findOneAndUpdate(
      { userId: req.user.id },
      { phone },
      { new: true }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      parent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
