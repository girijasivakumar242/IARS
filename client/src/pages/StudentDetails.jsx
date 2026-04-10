import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDownload } from "react-icons/fa";
import jsPDF from "jspdf";
import "../styles/StudentDetails.css";

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchStudentDetails();
  }, [id, token, navigate]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      const studentData = data.find((s) => s._id === id);

      if (studentData) {
        setStudent(studentData);
      } else {
        setError("Student not found");
      }
    } catch (err) {
      setError("Error fetching student details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return "#6b7280";
    const gradeUpper = grade.toUpperCase();
    if (gradeUpper === "A" || gradeUpper === "A+") return "#10b981";
    if (gradeUpper === "B") return "#3b82f6";
    if (gradeUpper === "C") return "#f59e0b";
    if (gradeUpper === "D") return "#ef4444";
    return "#6b7280";
  };

  const downloadReport = () => {
    if (!student) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;
    const lineHeight = 7;
    const maxWidth = pageWidth - 2 * margin;

    // Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("STUDENT SUBJECT-WISE RECORD", margin, yPosition);
    yPosition += 12;

    // Separator line
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Student Information Section
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Student Information:", margin, yPosition);
    yPosition += 6;

    doc.setFontSize(10);
    const studentInfo = [
      `Name: ${student.studentName}`,
      `Registration No: ${student.regNo}`,
      `Department: ${student.department}`,
      `Year: ${student.year}`
    ];

    studentInfo.forEach(info => {
      doc.text(info, margin + 5, yPosition);
      yPosition += lineHeight;
    });

    yPosition += 4;

    // Academic Performance Section
    doc.setFontSize(11);
    doc.text("Academic Performance:", margin, yPosition);
    yPosition += 6;

    doc.setFontSize(10);
    const academicInfo = [
      `CGPA: ${student.cgpa.toFixed(2)}/10`,
      `Attendance: ${student.attendance.toFixed(1)}%`,
      `Internal Marks: ${student.internalMarks.toFixed(1)}/100`,
      `Risk Level: ${student.riskLevel}`
    ];

    academicInfo.forEach(info => {
      doc.text(info, margin + 5, yPosition);
      yPosition += lineHeight;
    });

    yPosition += 4;

    // Subject-wise Grades Section
    doc.setFontSize(11);
    doc.text("Subject-wise Grades:", margin, yPosition);
    yPosition += 6;

    doc.setFontSize(10);
    if (student.subjectGrades && student.subjectGrades.length > 0) {
      student.subjectGrades.forEach(sg => {
        const gradeText = `${sg.subjectName}: ${sg.grade || "N/A"}`;
        doc.text(gradeText, margin + 5, yPosition);
        yPosition += lineHeight;
      });
    } else {
      doc.text("No subject grades available", margin + 5, yPosition);
      yPosition += lineHeight;
    }

    yPosition += 4;

    // Suggestions Section
    if (student.suggestions && student.suggestions.length > 0) {
      doc.setFontSize(11);
      doc.text("Suggestions:", margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      student.suggestions.forEach(suggestion => {
        const lines = doc.splitTextToSize(`• ${suggestion}`, maxWidth - 10);
        lines.forEach(line => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin + 5, yPosition);
          yPosition += lineHeight;
        });
      });

      yPosition += 4;
    }

    // Footer with timestamp
    if (yPosition > pageHeight - margin - 10) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, pageHeight - margin);

    // Download PDF
    doc.save(`${student.studentName}_record.pdf`);
  };

  if (loading) {
    return (
      <div className="student-details-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading student details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-details-page">
        <div className="error-container">
          <h2>{error}</h2>
          <button className="back-btn" onClick={() => navigate("/students")}>
            <FaArrowLeft /> Back to Students
          </button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="student-details-page">
        <div className="error-container">
          <h2>Student not found</h2>
          <button className="back-btn" onClick={() => navigate("/students")}>
            <FaArrowLeft /> Back to Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-details-page">
      <div className="details-container">
        {/* Header */}
        <div className="details-header">
          <button className="back-btn" onClick={() => navigate("/students")}>
            <FaArrowLeft /> Back to Students
          </button>
          <button className="download-btn" onClick={downloadReport}>
            <FaDownload /> Download Report
          </button>
        </div>

        {/* Student Info Card */}
        <div className="student-info-card">
          <div className="info-header">
            <div>
              <h1>{student.studentName}</h1>
              <p className="reg-no">{student.regNo}</p>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span className="label">Department</span>
              <span className="value">{student.department}</span>
            </div>
            <div className="info-item">
              <span className="label">Year</span>
              <span className="value">{student.year}</span>
            </div>
            <div className="info-item">
              <span className="label">Risk Level</span>
              <span
                className="value risk-badge"
                style={{ borderColor: getRiskColor(student.riskLevel) }}
              >
                {student.riskLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Performance Card */}
        <div className="performance-card">
          <h2>Academic Performance</h2>
          <div className="performance-grid">
            <div className="performance-item">
              <span className="label">CGPA</span>
              <div className="metric">
                <span className="large-value">{student.cgpa.toFixed(2)}</span>
                <span className="unit">/10</span>
              </div>
            </div>
            <div className="performance-item">
              <span className="label">Attendance</span>
              <div className="metric">
                <span className="large-value">
                  {student.attendance.toFixed(1)}
                </span>
                <span className="unit">%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${student.attendance}%` }}
                ></div>
              </div>
            </div>
            <div className="performance-item">
              <span className="label">Internal Marks</span>
              <div className="metric">
                <span className="large-value">
                  {student.internalMarks.toFixed(1)}
                </span>
                <span className="unit">/100</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${student.internalMarks}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject-wise Records Card */}
        {student.subjectGrades && student.subjectGrades.length > 0 && (
          <div className="subjects-card">
            <h2>Subject-wise Grades</h2>
            <div className="subjects-table-wrapper">
              <table className="subjects-table">
                <thead>
                  <tr>
                    <th>Subject Name</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {student.subjectGrades.map((subject, index) => (
                    <tr key={index}>
                      <td className="subject-name">{subject.subjectName}</td>
                      <td>
                        <span
                          className="grade-badge"
                          style={{
                            borderColor: getGradeColor(subject.grade),
                            color: getGradeColor(subject.grade),
                          }}
                        >
                          {subject.grade || "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Suggestions Card */}
        {student.suggestions && student.suggestions.length > 0 && (
          <div className="suggestions-card">
            <h2>Recommendations</h2>
            <div className="suggestions-list">
              {student.suggestions.map((suggestion, index) => (
                <div key={index} className="suggestion-item">
                  <span className="suggestion-number">{index + 1}</span>
                  <span className="suggestion-text">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
