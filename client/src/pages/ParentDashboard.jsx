import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaEye } from "react-icons/fa";
import "../styles/ParentDashboard.css";

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [studentRegNo, setStudentRegNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchChildren();
  }, [token, navigate]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/parent/children`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setChildren(data);
      } else {
        setError(data.message || "Failed to fetch children");
      }
    } catch (err) {
      setError("Error fetching children");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkChild = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/parent/children/link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentRegNo,
            studentName,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setShowLinkModal(false);
        setStudentRegNo("");
        setStudentName("");
        fetchChildren();
      } else {
        alert(data.message || "Failed to link child");
      }
    } catch (err) {
      alert("Error linking child");
      console.error(err);
    }
  };

  const handleUnlinkChild = async (regNo) => {
    if (!window.confirm("Are you sure you want to unlink this child?")) {
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/parent/children/${regNo}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        fetchChildren();
      } else {
        alert("Failed to unlink child");
      }
    } catch (err) {
      alert("Error unlinking child");
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const getRiskColor = (riskLevel) => {
    if (!riskLevel) return "#6b7280";
    switch (riskLevel.toLowerCase()) {
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

  return (
    <>
      <nav className="navbar">
        <div className="logo">RiskShield AI</div>
        <div className="nav-links">
          <span style={{ color: "var(--text-secondary)" }}>Parent Portal</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="parent-dashboard-page">
        <div className="page-header">
          <div>
            <h2>My Children's Performance</h2>
            <p className="subtitle">
              Monitor your children's academic progress and risk assessment
            </p>
          </div>
          <button
            className="link-child-btn"
            onClick={() => setShowLinkModal(true)}
          >
            <FaPlus /> Link Child
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading children's data...</p>
          </div>
        ) : children.length === 0 ? (
          <div className="empty-state">
            <h3>No children linked yet</h3>
            <p>Link your child by their registration number to start monitoring their academic progress.</p>
            <button
              className="link-child-btn"
              onClick={() => setShowLinkModal(true)}
            >
              <FaPlus /> Link First Child
            </button>
          </div>
        ) : (
          <div className="children-grid">
            {children.map((child) => (
              <div key={child.studentRegNo} className="child-card">
                <div className="card-header">
                  <div>
                    <h3>{child.studentName}</h3>
                    <p className="reg-no">{child.studentRegNo}</p>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleUnlinkChild(child.studentRegNo)}
                    title="Unlink child"
                  >
                    <FaTrash />
                  </button>
                </div>

                {child.latestRecord ? (
                  <>
                    <div className="metrics">
                      <div className="metric">
                        <span className="label">CGPA</span>
                        <span className="value">
                          {child.latestRecord.cgpa.toFixed(2)}/10
                        </span>
                      </div>
                      <div className="metric">
                        <span className="label">Attendance</span>
                        <span className="value">
                          {child.latestRecord.attendance.toFixed(0)}%
                        </span>
                      </div>
                      <div className="metric">
                        <span className="label">Internal Marks</span>
                        <span className="value">
                          {child.latestRecord.internalMarks.toFixed(0)}/100
                        </span>
                      </div>
                    </div>

                    <div className="risk-badge-container">
                      <span
                        className="risk-badge"
                        style={{
                          borderColor: getRiskColor(
                            child.latestRecord.riskLevel
                          ),
                          color: getRiskColor(child.latestRecord.riskLevel),
                        }}
                      >
                        Risk: {child.latestRecord.riskLevel}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="no-records">
                    <p>No records yet</p>
                  </div>
                )}

                <button
                  className="view-details-btn"
                  onClick={() =>
                    navigate(`/parent-child/${child.studentRegNo}`)
                  }
                >
                  <FaEye /> View Details
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Link Child Modal */}
        {showLinkModal && (
          <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Link Your Child</h2>
              <p>
                Enter your child's registration number and name to link their
                account to yours.
              </p>

              <form onSubmit={handleLinkChild}>
                <input
                  type="text"
                  placeholder="Student Registration Number"
                  value={studentRegNo}
                  onChange={(e) => setStudentRegNo(e.target.value)}
                  required
                />

                <input
                  type="text"
                  placeholder="Student Name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowLinkModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Link Child
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
