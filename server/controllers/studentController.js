const Student = require("../models/Student");
const { spawn } = require("child_process");
const path = require("path");
const xlsx = require("xlsx");

/* =====================================================
   GET ALL STUDENTS
===================================================== */
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find({ teacher: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

/* =====================================================
   ADD SINGLE STUDENT + ML
===================================================== */
exports.addSingleStudent = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { name, rollNo } = req.body;

    const attendance = Number(req.body.attendance);
    const internalMarks = Number(req.body.internalMarks);
    const cgpa = Number(req.body.cgpa);

    if (!name || !rollNo || isNaN(attendance) || isNaN(internalMarks) || isNaN(cgpa)) {
      return res.status(400).json({ message: "Invalid student data" });
    }

    const scriptPath = path.join(__dirname, "../ml/predict.py");

    const python = spawn("python", [
      scriptPath,
      attendance,
      internalMarks,
      cgpa
    ]);

    let output = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.on("close", async () => {
      const parsed = JSON.parse(output);
      const { riskLevel, suggestion } = parsed;

      const student = await Student.create({
        teacher: teacherId,
        name,
        rollNo,
        attendance,
        internalMarks,
        cgpa,
        riskLevel,
        suggestion
      });

      // 🔥 REALTIME EMIT
      req.app.get("io").emit("studentUpdated");

      res.status(201).json(student);
    });

  } catch (err) {
    res.status(500).json({ message: "Prediction failed" });
  }
};

/* =====================================================
   BULK UPLOAD
===================================================== */
exports.uploadStudentSheet = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const students = xlsx.utils.sheet_to_json(sheet);

    const scriptPath = path.join(__dirname, "../ml/predict.py");

    for (const s of students) {
      const attendance = Number(s.attendance);
      const internalMarks = Number(s.internalMarks);
      const cgpa = Number(s.cgpa);

      if (!s.name || !s.rollNo || isNaN(attendance) || isNaN(internalMarks) || isNaN(cgpa))
        continue;

      const python = spawn("python", [
        scriptPath,
        attendance,
        internalMarks,
        cgpa
      ]);

      let output = "";

      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      await new Promise((resolve) => {
        python.on("close", async () => {
          const parsed = JSON.parse(output);
          const { riskLevel, suggestion } = parsed;

          await Student.create({
            teacher: req.user.id,
            name: s.name,
            rollNo: s.rollNo,
            attendance,
            internalMarks,
            cgpa,
            riskLevel,
            suggestion
          });

          resolve();
        });
      });
    }

    // 🔥 REALTIME EMIT
    req.app.get("io").emit("studentUpdated");

    res.status(200).json({ message: "Bulk upload successful" });

  } catch (err) {
    res.status(500).json({ message: "Bulk upload failed" });
  }
};

/* =====================================================
   DELETE
===================================================== */
exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);

    // 🔥 REALTIME EMIT
    req.app.get("io").emit("studentUpdated");

    res.json({ message: "Deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

/* =====================================================
   ANALYTICS
===================================================== */
exports.getAnalyticsSummary = async (req, res) => {
  try {
    const students = await Student.find({ teacher: req.user.id });

    res.json({
      totalStudents: students.length,
      highRisk: students.filter(s => s.riskLevel === "High").length,
      mediumRisk: students.filter(s => s.riskLevel === "Medium").length,
      lowRisk: students.filter(s => s.riskLevel === "Low").length,
    });

  } catch (error) {
    res.status(500).json({ message: "Analytics failed" });
  }
};


/* =====================================================
   UPDATE STUDENT + RE-PREDICT
===================================================== */
exports.updateStudent = async (req, res) => {
  try {
    const { attendance, internalMarks, cgpa } = req.body;

    const scriptPath = path.join(__dirname, "../ml/predict.py");

    const python = spawn("python", [
      scriptPath,
      attendance,
      internalMarks,
      cgpa,
    ]);

    let output = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.on("close", async () => {
      const parsed = JSON.parse(output);
      const { riskLevel, suggestion } = parsed;

      const updated = await Student.findByIdAndUpdate(
        req.params.id,
        {
          attendance,
          internalMarks,
          cgpa,
          riskLevel,
          suggestion,
        },
        { new: true }
      );

      req.app.get("io").emit("studentUpdated");

      res.json(updated);
    });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

