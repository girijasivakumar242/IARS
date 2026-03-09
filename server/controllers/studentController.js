const StudentSubmission = require("../models/StudentSubmission");
const Session = require("../models/Session");
const { spawn } = require("child_process");
const path = require("path");

const runPrediction = ({ cgpa, attendance, internalMarks }) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [
      path.join(__dirname, "../ml/predict.py"),
      attendance,     // correct order for predict.py
      internalMarks,  // correct order for predict.py
      cgpa,           // correct order for predict.py
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

    const prediction = await runPrediction({
      cgpa,
      attendance,
      internalMarks,
    });

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
      riskLevel: prediction.riskLevel || "Pending",
      suggestions: prediction.suggestions || [],
    });

    const io = req.app.get("io");
    io.emit("studentUpdated");

    res.status(201).json({
      success: true,
      message: "Student details submitted successfully",
      student,
    });
  } catch (error) {
    console.error("Submit student form error:", error);
    res.status(500).json({
      message: error.message || "Server error while submitting form",
    });
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

    res.status(200).json({
      totalStudents,
      highRisk,
      mediumRisk,
      lowRisk,
    });
  } catch (error) {
    console.error("Analytics summary error:", error);
    res.status(500).json({ message: "Server error while fetching analytics" });
  }
};