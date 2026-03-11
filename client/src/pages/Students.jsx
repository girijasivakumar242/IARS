import { useEffect, useMemo, useState } from "react";
import "../styles/Students.css";
import { NavLink, useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaSave, FaTimes, FaEye } from "react-icons/fa";
import { io } from "socket.io-client";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  const [editingId, setEditingId] = useState(null);
  const [editedStudent, setEditedStudent] = useState({
    studentName: "",
    regNo: "",
    attendance: "",
    internalMarks: "",
    cgpa: "",
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchStudents();
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket"],
    });

    socket.on("studentUpdated", () => {
      fetchStudents();
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleEdit = (student) => {
    setEditingId(student._id);
    setEditedStudent({
      studentName: student.studentName || "",
      regNo: student.regNo || "",
      attendance: student.attendance || "",
      internalMarks: student.internalMarks || "",
      cgpa: student.cgpa || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedStudent({
      studentName: "",
      regNo: "",
      attendance: "",
      internalMarks: "",
      cgpa: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedStudent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (id) => {
    try {
      const payload = {
        studentName: editedStudent.studentName,
        regNo: editedStudent.regNo,
        attendance: Number(editedStudent.attendance),
        internalMarks: Number(editedStudent.internalMarks),
        cgpa: Number(editedStudent.cgpa),
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/students/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update student");
      }

      await fetchStudents();
      setEditingId(null);
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Failed to update student");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this student record?"
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/students/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete student");
      }

      await fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
    }
  };

  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (search.trim() !== "") {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.studentName?.toLowerCase().includes(lower) ||
          s.regNo?.toLowerCase().includes(lower)
      );
    }

    if (sortOrder !== "all") {
      filtered = filtered.filter((s) => s.riskLevel === sortOrder);
    }

    return filtered;
  }, [students, search, sortOrder]);

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const indexOfLast = currentPage * studentsPerPage;
  const indexOfFirst = indexOfLast - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirst, indexOfLast);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortOrder, students.length]);

  return (
    <>
      <nav className="navbar">
        <div className="logo">RiskShield AI</div>
        <div className="nav-links">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/students">Students</NavLink>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="students-page">
        <div className="page-header">
          <div>
            <h2>Student Records</h2>
            <p className="subtitle">
              Search, filter, edit and manage student risk records easily
            </p>
          </div>
        </div>

        <div className="controls">
          <input
            className="search-box"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="all">All Risks</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div className="students-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No</th>
                <th>Attendance</th>
                <th>Internal Marks</th>
                <th>CGPA</th>
                <th>Risk</th>
                <th>Suggestion</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {currentStudents.length > 0 ? (
                currentStudents.map((s) => (
                  <tr key={s._id}>
                    {editingId === s._id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            name="studentName"
                            value={editedStudent.studentName}
                            onChange={handleInputChange}
                            className="table-input"
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            name="regNo"
                            value={editedStudent.regNo}
                            onChange={handleInputChange}
                            className="table-input"
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            step="0.01"
                            name="attendance"
                            value={editedStudent.attendance}
                            onChange={handleInputChange}
                            className="table-input"
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            step="0.01"
                            name="internalMarks"
                            value={editedStudent.internalMarks}
                            onChange={handleInputChange}
                            className="table-input"
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            step="0.01"
                            name="cgpa"
                            value={editedStudent.cgpa}
                            onChange={handleInputChange}
                            className="table-input"
                          />
                        </td>

                        <td>
                          <span className="risk pending">Auto Predict</span>
                        </td>

                        <td>Suggestions will be regenerated automatically</td>

                        <td>
                          <div className="action-buttons">
                            <button
                              className="icon-btn save-btn"
                              onClick={() => handleSave(s._id)}
                              title="Save"
                            >
                              <FaSave />
                            </button>
                            <button
                              className="icon-btn cancel-btn"
                              onClick={handleCancelEdit}
                              title="Cancel"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{s.studentName}</td>
                        <td>{s.regNo}</td>
                        <td>{s.attendance}</td>
                        <td>{s.internalMarks}</td>
                        <td>{s.cgpa}</td>
                        <td>
                          <span className={`risk ${s.riskLevel?.toLowerCase()}`}>
                            {s.riskLevel}
                          </span>
                        </td>
                        <td>{s.suggestions?.join(", ")}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="icon-btn view-btn"
                              onClick={() => navigate(`/student-details/${s._id}`)}
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="icon-btn edit-btn"
                              onClick={() => handleEdit(s)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="icon-btn delete-btn"
                              onClick={() => handleDelete(s._id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-cell">
                    No student records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={currentPage === i + 1 ? "active-page" : ""}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}