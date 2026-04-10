import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDownload } from "react-icons/fa";
import jsPDF from "jspdf";
import "../styles/ParentChildView.css";

export default function ParentChildView() {
  const { studentRegNo } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchChildRecords();
  }, [studentRegNo, token, navigate]);

  const fetchChildRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/parent/children/${studentRegNo}/records`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setRecords(data);
        if (data.length > 0) {
          setSelectedRecord(data[0]);
        }
      } else {
        setError(data.message || "Failed to fetch records");
      }
    } catch (err) {
      setError("Error fetching records");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!selectedRecord) return;

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
    doc.text("STUDENT PERFORMANCE REPORT", margin, yPosition);
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
      `Name: ${selectedRecord.studentName}`,
      `Registration No: ${selectedRecord.regNo}`,
      `Department: ${selectedRecord.department}`,
      `Year: ${selectedRecord.year}`
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
      `CGPA: ${selectedRecord.cgpa.toFixed(2)}/10`,
      `Attendance: ${selectedRecord.attendance.toFixed(1)}%`,
      `Internal Marks: ${selectedRecord.internalMarks.toFixed(1)}/100`,
      `Risk Level: ${selectedRecord.riskLevel}`
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
    if (selectedRecord.subjectGrades && selectedRecord.subjectGrades.length > 0) {
      selectedRecord.subjectGrades.forEach(sg => {
        const gradeText = `${sg.subjectName}: ${sg.grade || "N/A"}`;
        doc.text(gradeText, margin + 5, yPosition);
        yPosition += lineHeight;
      });
    } else {
      doc.text("No subject grades available", margin + 5, yPosition);
      yPosition += lineHeight;
    }

    yPosition += 4;

    // Recommendations Section
    if (selectedRecord.suggestions && selectedRecord.suggestions.length > 0) {
      doc.setFontSize(11);
      doc.text("Recommendations:", margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      selectedRecord.suggestions.forEach(suggestion => {
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
    doc.save(`${selectedRecord.studentName}_report.pdf`);
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

  if (loading) {
    return (
      <div className="parent-child-view-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="parent-child-view-page">
        <div className="error-container">
          <h2>{error}</h2>
          <button className="back-btn" onClick={() => navigate("/parent-dashboard")}>
            <FaArrowLeft /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="parent-child-view-page">
        <div className="error-container">
          <h2>No records found</h2>
          <button className="back-btn" onClick={() => navigate("/parent-dashboard")}>
            <FaArrowLeft /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-child-view-page">
      <div className="view-container">
        {/* Header */}
        <div className="view-header">
          <button className="back-btn" onClick={() => navigate("/parent-dashboard")}>
            <FaArrowLeft /> Back to Dashboard
          </button>
          <button className="download-btn" onClick={downloadReport}>
            <FaDownload /> Download Report
          </button>
        </div>

        {/* Record Selector */}
        {records.length > 1 && (
          <div className="records-selector">
            <label>Select Assessment:</label>
            <select
              value={records.indexOf(selectedRecord)}
              onChange={(e) => setSelectedRecord(records[parseInt(e.target.value)])}
            >
              {records.map((record, index) => (
                <option key={record._id} value={index}>
                  {new Date(record.createdAt).toLocaleDateString()} - {record.sessionCode}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedRecord && (
          <>
            {/* Student Info */}
            <div className="info-card">
              <h2>{selectedRecord.studentName}</h2>
              <p className="reg-no">{selectedRecord.regNo}</p>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Department</span>
                  <span className="value">{selectedRecord.department}</span>
                </div>
                <div className="info-item">
                  <span className="label">Year</span>
                  <span className="value">{selectedRecord.year}</span>
                </div>
                <div className="info-item">
                  <span className="label">Risk Assessment</span>
                  <span
                    className="risk-badge"
                    style={{ borderColor: getRiskColor(selectedRecord.riskLevel) }}
                  >
                    {selectedRecord.riskLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="performance-card">
              <h3>Academic Performance</h3>
              <div className="metrics-grid">
                <div className="metric-item">
                  <span className="label">CGPA</span>
                  <span className="metric-value" style={{ color: "#0891b2" }}>
                    {selectedRecord.cgpa.toFixed(2)}/10
                  </span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(selectedRecord.cgpa / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="metric-item">
                  <span className="label">Attendance</span>
                  <span className="metric-value" style={{ color: "#0891b2" }}>
                    {selectedRecord.attendance.toFixed(1)}%
                  </span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${selectedRecord.attendance}%` }}
                    ></div>
                  </div>
                </div>
                <div className="metric-item">
                  <span className="label">Internal Marks</span>
                  <span className="metric-value" style={{ color: "#0891b2" }}>
                    {selectedRecord.internalMarks.toFixed(1)}/100
                  </span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${selectedRecord.internalMarks}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Grades */}
            {selectedRecord.subjectGrades && selectedRecord.subjectGrades.length > 0 && (
              <div className="subjects-card">
                <h3>Subject Grades</h3>
                <div className="subjects-grid">
                  {selectedRecord.subjectGrades.map((subject, index) => (
                    <div key={index} className="subject-item">
                      <span className="subject-name">{subject.subjectName}</span>
                      <span
                        className="grade"
                        style={{ color: getGradeColor(subject.grade) }}
                      >
                        {subject.grade || "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {selectedRecord.suggestions && selectedRecord.suggestions.length > 0 && (
              <div className="recommendations-card">
                <h3>Recommendations</h3>
                <div className="recommendations-list">
                  {selectedRecord.suggestions.map((suggestion, index) => (
                    <div key={index} className="recommendation-item">
                      <span className="number">{index + 1}</span>
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
