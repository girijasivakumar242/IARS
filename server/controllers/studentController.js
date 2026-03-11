const StudentSubmission = require("../models/StudentSubmission");
const Session = require("../models/Session");
const { spawn } = require("child_process");
const path = require("path");

const runPrediction = ({ cgpa, attendance, internalMarks }) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [
      path.join(__dirname, "../ml/predict.py"),
      String(attendance),
      String(internalMarks),
      String(cgpa),
    ]);

    let result = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(errorOutput || "Prediction process failed"));
      }

      try {
        const parsed = JSON.parse(result);
        resolve(parsed);
      } catch (error) {
        reject(new Error("Invalid prediction response from Python script"));
      }
    });
  });
};

exports.submitStudentForm = async (req, res) => {
  try {
    const { sessionCode } = req.params;

    const {
      studentName,
      regNo,
      department,
      year,
      cgpa,
      attendance,
      internalMarks,
      subjectGrades,
    } = req.body;

    if (
      !studentName ||
      !regNo ||
      !department ||
      !year ||
      cgpa === undefined ||
      attendance === undefined ||
      internalMarks === undefined
    ) {
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    const session = await Session.findOne({ sessionCode });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (!session.isActive || new Date() > new Date(session.expiresAt)) {
      return res.status(400).json({ message: "Session expired" });
    }

    const student = await StudentSubmission.create({
      teacherId: session.teacherId,
      sessionCode,
      sessionId: session._id,
      studentName,
      regNo,
      department,
      year,
      cgpa,
      attendance,
      internalMarks,
      subjectGrades: subjectGrades || [],
      riskLevel: "Pending",
      suggestions: [],
    });

    const io = req.app.get("io");

    if (io) {
      io.emit("studentUpdated");
    }

    res.status(201).json({
      success: true,
      message: "Student details submitted successfully",
      student,
    });

    try {
      const prediction = await runPrediction({
        cgpa,
        attendance,
        internalMarks,
      });

      await StudentSubmission.findByIdAndUpdate(student._id, {
        riskLevel: prediction.riskLevel || "Pending",
        suggestions: prediction.suggestions || [],
      });

      if (io) {
        io.emit("studentUpdated");
      }
    } catch (predictionError) {
      console.error("Prediction update error:", predictionError);
    }
  } catch (error) {
    console.error("Submit student form error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        message: error.message || "Server error while submitting form",
      });
    }
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await StudentSubmission.find({
      teacherId: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json(students);
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ message: "Server error while fetching students" });
  }
};

exports.getAnalyticsSummary = async (req, res) => {
  try {
    const students = await StudentSubmission.find({
      teacherId: req.user.id,
    });

    const totalStudents = students.length;
    const highRisk = students.filter((s) => s.riskLevel === "High").length;
    const mediumRisk = students.filter((s) => s.riskLevel === "Medium").length;
    const lowRisk = students.filter((s) => s.riskLevel === "Low").length;
    const pendingRisk = students.filter((s) => s.riskLevel === "Pending").length;

    res.status(200).json({
      totalStudents,
      highRisk,
      mediumRisk,
      lowRisk,
      pendingRisk,
    });
  } catch (error) {
    console.error("Analytics summary error:", error);
    res.status(500).json({ message: "Server error while fetching analytics" });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      studentName,
      regNo,
      department,
      year,
      cgpa,
      attendance,
      internalMarks,
      subjectGrades,
    } = req.body;

    const student = await StudentSubmission.findOne({
      _id: id,
      teacherId: req.user.id,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.studentName = studentName ?? student.studentName;
    student.regNo = regNo ?? student.regNo;
    student.department = department ?? student.department;
    student.year = year ?? student.year;
    student.cgpa = cgpa ?? student.cgpa;
    student.attendance = attendance ?? student.attendance;
    student.internalMarks = internalMarks ?? student.internalMarks;
    student.subjectGrades = subjectGrades ?? student.subjectGrades;

    // reset prediction fields when academic values are edited
    student.riskLevel = "Pending";
    student.suggestions = [];

    await student.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("studentUpdated");
    }

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student,
    });

    try {
      const prediction = await runPrediction({
        cgpa: student.cgpa,
        attendance: student.attendance,
        internalMarks: student.internalMarks,
      });

      await StudentSubmission.findByIdAndUpdate(student._id, {
        riskLevel: prediction.riskLevel || "Pending",
        suggestions: prediction.suggestions || [],
      });

      if (io) {
        io.emit("studentUpdated");
      }
    } catch (predictionError) {
      console.error("Prediction update after edit error:", predictionError);
    }
  } catch (error) {
    console.error("Update student error:", error);

    if (!res.headersSent) {
      res.status(500).json({ message: "Server error while updating student" });
    }
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await StudentSubmission.findOneAndDelete({
      _id: id,
      teacherId: req.user.id,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("studentUpdated");
    }

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ message: "Server error while deleting student" });
  }
};