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
   ADD SINGLE STUDENT + ML (SAFE VERSION)
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

    const python = spawn("python3", [
      scriptPath,
      attendance,
      internalMarks,
      cgpa,
    ]);

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    python.on("close", async (code) => {
      try {
        if (code !== 0) {
          console.error("Python exited with code:", code);
          console.error("Python error:", errorOutput);
          return res.status(500).json({ message: "Python prediction failed" });
        }

        if (!output) {
          console.error("Empty Python output");
          return res.status(500).json({ message: "No prediction returned" });
        }

        const parsed = JSON.parse(output.trim());
        const { riskLevel, suggestion } = parsed;

        const student = await Student.create({
          teacher: teacherId,
          name,
          rollNo,
          attendance,
          internalMarks,
          cgpa,
          riskLevel,
          suggestion,
        });

        req.app.get("io").emit("studentUpdated");

        res.status(201).json(student);

      } catch (err) {
        console.error("Prediction parse error:", err);
        res.status(500).json({ message: "Prediction failed" });
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


/* =====================================================
   BULK UPLOAD + ML (SAFE VERSION)
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

      await new Promise((resolve) => {
        const python = spawn("python3", [
          scriptPath,
          attendance,
          internalMarks,
          cgpa,
        ]);

        let output = "";
        let errorOutput = "";

        python.stdout.on("data", (data) => {
          output += data.toString();
        });

        python.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });

        python.on("close", async (code) => {
          try {
            if (code !== 0 || !output) {
              console.error("Python error in bulk upload:", errorOutput);
              return resolve(); // skip this student
            }

            const parsed = JSON.parse(output.trim());
            const { riskLevel, suggestion } = parsed;

            await Student.create({
              teacher: req.user.id,
              name: s.name,
              rollNo: s.rollNo,
              attendance,
              internalMarks,
              cgpa,
              riskLevel,
              suggestion,
            });

          } catch (err) {
            console.error("Bulk parse error:", err);
          }

          resolve();
        });
      });
    }

    req.app.get("io").emit("studentUpdated");

    res.status(200).json({ message: "Bulk upload successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Bulk upload failed" });
  }
};
