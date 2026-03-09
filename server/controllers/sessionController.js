const Session = require("../models/Session");

const generateSessionCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

exports.createSession = async (req, res) => {
  try {
    const {department, year, durationMinutes } = req.body;

    if (!department || !year) {
      return res.status(400).json({ message: "Class name, department, and year are required" });
    }

    let sessionCode = generateSessionCode();

    const existingSession = await Session.findOne({ sessionCode });
    if (existingSession) {
      sessionCode = generateSessionCode();
    }

    const expiresAt = new Date(Date.now() + (durationMinutes || 30) * 60 * 1000);

    const qrLink = `${process.env.CLIENT_URL}/student-form/${sessionCode}`;

    const session = await Session.create({
      teacherId: req.user.id,
      department,
      year,
      sessionCode,
      qrLink,
      expiresAt,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      session,
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({ message: "Server error while creating session" });
  }
};

exports.getTeacherSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ teacherId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ message: "Server error while fetching sessions" });
  }
};

exports.getSessionByCode = async (req, res) => {
  try {
    const { sessionCode } = req.params;

    const session = await Session.findOne({ sessionCode });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (new Date() > new Date(session.expiresAt)) {
      session.isActive = false;
      await session.save();
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ message: "Server error while fetching session" });
  }
};