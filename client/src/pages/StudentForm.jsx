import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/StudentForm.css";

export default function StudentForm() {
  const { sessionCode } = useParams();

  const [session, setSession] = useState(null);
  const [message, setMessage] = useState("");
  const [statusType, setStatusType] = useState("");
  const [loading, setLoading] = useState(false);

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
      setStatusType("error");
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleGradeChange = (index, field, value) => {
    const updatedGrades = [...formData.subjectGrades];
    updatedGrades[index][field] = value;

    setFormData((prev) => ({
      ...prev,
      subjectGrades: updatedGrades,
    }));
  };

  const addSubjectField = () => {
    setFormData((prev) => ({
      ...prev,
      subjectGrades: [
        ...prev.subjectGrades,
        { subjectName: "", grade: "" }
      ],
    }));
  };

  const removeSubjectField = (index) => {
    if (formData.subjectGrades.length === 1) return;

    const updatedGrades = formData.subjectGrades.filter((_, i) => i !== index);

    setFormData((prev) => ({
      ...prev,
      subjectGrades: updatedGrades,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setStatusType("");

    try {
      const payload = {
        ...formData,
        cgpa: Number(formData.cgpa),
        attendance: Number(formData.attendance),
        internalMarks: Number(formData.internalMarks),
        subjectGrades: formData.subjectGrades.filter(
          (item) =>
            item.subjectName.trim() !== "" && item.grade.trim() !== ""
        ),
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/students/submit/${sessionCode}`,
        payload
      );

      setMessage("Data submitted successfully");
      setStatusType("success");

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
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  if (!session && message === "Invalid or expired session") {
    return (
      <div className="student-page">
        <div className="invalid-session-card">
          <div className="invalid-icon">!</div>
          <h2>Session Not Available</h2>
          <p>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-page">
      <div className="student-shell">
        <div className="student-header">
          <p className="student-badge">Student Submission Portal</p>
          <h1>Student Academic Details Form</h1>
          <p className="student-subtitle">
            Fill in your academic details carefully and submit them through the
            active session created by your faculty.
          </p>
        </div>

        {session && (
          <div className="session-summary-grid">
            <div className="summary-card">
              <span>Department</span>
              <strong>{session.department}</strong>
            </div>
            <div className="summary-card">
              <span>Year</span>
              <strong>{session.year}</strong>
            </div>
            <div className="summary-card">
              <span>Session Code</span>
              <strong>{session.sessionCode}</strong>
            </div>
          </div>
        )}

        <div className="student-form-card">
          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-grid">
              <div className="form-section">
                <div className="section-heading">
                  <h2>Student Information</h2>
                  <p>Enter your personal and academic identity details.</p>
                </div>

                <div className="input-group">
                  <label htmlFor="studentName">Student Name</label>
                  <input
                    id="studentName"
                    type="text"
                    name="studentName"
                    placeholder="Enter your full name"
                    value={formData.studentName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="regNo">Register Number</label>
                  <input
                    id="regNo"
                    type="text"
                    name="regNo"
                    placeholder="Enter register number"
                    value={formData.regNo}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="department">Department</label>
                  <input
                    id="department"
                    type="text"
                    name="department"
                    placeholder="Department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    readOnly
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="year">Year</label>
                  <input
                    id="year"
                    type="text"
                    name="year"
                    placeholder="Year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    readOnly
                  />
                </div>
              </div>

              <div className="form-section">
                <div className="section-heading">
                  <h2>Performance Metrics</h2>
                  <p>Provide your latest academic performance details.</p>
                </div>

                <div className="input-group">
                  <label htmlFor="cgpa">CGPA</label>
                  <input
                    id="cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    name="cgpa"
                    placeholder="Enter CGPA"
                    value={formData.cgpa}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="attendance">Attendance %</label>
                  <input
                    id="attendance"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    name="attendance"
                    placeholder="Enter attendance percentage"
                    value={formData.attendance}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="internalMarks">Internal Marks</label>
                  <input
                    id="internalMarks"
                    type="number"
                    min="0"
                    step="0.01"
                    max="100"
                    name="internalMarks"
                    placeholder="Enter internal marks"
                    value={formData.internalMarks}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="subject-section">
              <div className="section-heading subject-heading-row">
                <div>
                  <h2>Subject-wise Grades</h2>
                  <p>Add your subjects and corresponding grades.</p>
                </div>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={addSubjectField}
                >
                  + Add Subject
                </button>
              </div>

              <div className="subject-list">
                {formData.subjectGrades.map((item, index) => (
                  <div className="subject-grade-row" key={index}>
                    <div className="input-group">
                      <label>Subject Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Data Structures"
                        value={item.subjectName}
                        onChange={(e) =>
                          handleGradeChange(index, "subjectName", e.target.value)
                        }
                      />
                    </div>

                    <div className="input-group grade-input-wrap">
                      <label>Grade</label>
                      <input
                        type="text"
                        placeholder="e.g. A+"
                        value={item.grade}
                        onChange={(e) =>
                          handleGradeChange(index, "grade", e.target.value)
                        }
                      />
                    </div>

                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeSubjectField(index)}
                      disabled={formData.subjectGrades.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Submitting..." : "Submit Academic Details"}
            </button>

            {message && (
              <div className={`status-message ${statusType}`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}