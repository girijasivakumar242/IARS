import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/StudentForm.css";

export default function StudentForm() {
  const { sessionCode } = useParams();

  const [session, setSession] = useState(null);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    studentName: "",
    regNo: "",
    department: "",
    year: "",
    cgpa: "",
    attendance: "",
    internalMarks: "",
    subjectGrades: [{ subjectName: "", grade: "" }],
  });

  useEffect(() => {
    fetchSessionDetails();
  }, []);

  const fetchSessionDetails = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/sessions/${sessionCode}`
      );

      const sessionData = res.data.session;
      setSession(sessionData);

      setFormData((prev) => ({
        ...prev,
        department: sessionData.department || "",
        year: sessionData.year || "",
      }));
    } catch (error) {
      console.error(error);
      setMessage("Invalid or expired session");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGradeChange = (index, field, value) => {
    const updatedGrades = [...formData.subjectGrades];
    updatedGrades[index][field] = value;

    setFormData({
      ...formData,
      subjectGrades: updatedGrades,
    });
  };

  const addSubjectField = () => {
    setFormData({
      ...formData,
      subjectGrades: [...formData.subjectGrades, { subjectName: "", grade: "" }],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        cgpa: Number(formData.cgpa),
        attendance: Number(formData.attendance),
        internalMarks: Number(formData.internalMarks),
        subjectGrades: formData.subjectGrades.filter(
          (item) => item.subjectName.trim() !== "" && item.grade.trim() !== ""
        ),
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/students/submit/${sessionCode}`,
        payload
      );

      setMessage("Data submitted successfully");

      setFormData({
        studentName: "",
        regNo: "",
        department: session?.department || "",
        year: session?.year || "",
        cgpa: "",
        attendance: "",
        internalMarks: "",
        subjectGrades: [{ subjectName: "", grade: "" }],
      });
    } catch (err) {
      console.error(err.response?.data || err.message);
      setMessage(err.response?.data?.message || "Submission failed");
    }
  };

  if (!session && message === "Invalid or expired session") {
    return (
      <div className="student-form-container">
        <div className="student-form-card">
          <h2>Student Academic Details</h2>
          <p className="message">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-form-container">
      <div className="student-form-card wide-card">
        <h2>Student Academic Details</h2>

        {session && (
          <div className="session-info">
            <p><strong>Department:</strong> {session.department}</p>
            <p><strong>Year:</strong> {session.year}</p>
            <p><strong>Session Code:</strong> {session.sessionCode}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-column">
              <input
                type="text"
                name="studentName"
                placeholder="Student Name"
                value={formData.studentName}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="regNo"
                placeholder="Register Number"
                value={formData.regNo}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="department"
                placeholder="Department"
                value={formData.department}
                onChange={handleChange}
                required
                readOnly
              />

              <input
                type="text"
                name="year"
                placeholder="Year"
                value={formData.year}
                onChange={handleChange}
                required
                readOnly
              />
            </div>

            <div className="form-column">
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                name="cgpa"
                placeholder="CGPA"
                value={formData.cgpa}
                onChange={handleChange}
                required
              />

              <input
                type="number"
                min="0"
                max="100"
                name="attendance"
                placeholder="Attendance %"
                value={formData.attendance}
                onChange={handleChange}
                required
              />

              <input
                type="number"
                min="0"
                max="100"
                name="internalMarks"
                placeholder="Internal Marks"
                value={formData.internalMarks}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="subject-grade-section">
            <h3>Subject-wise Grades</h3>

            {formData.subjectGrades.map((item, index) => (
              <div className="subject-grade-row" key={index}>
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={item.subjectName}
                  onChange={(e) =>
                    handleGradeChange(index, "subjectName", e.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder="Grade"
                  value={item.grade}
                  onChange={(e) =>
                    handleGradeChange(index, "grade", e.target.value)
                  }
                />
              </div>
            ))}

            <button
              type="button"
              className="secondary-btn"
              onClick={addSubjectField}
            >
              Add Subject
            </button>
          </div>

          <button type="submit" className="submit-btn">Submit</button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}