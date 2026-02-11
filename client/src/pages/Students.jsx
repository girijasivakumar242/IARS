import { useEffect, useState, useMemo } from "react";
import "../styles/Students.css";
import { io } from "socket.io-client";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
export default function Students() {
  const [students, setStudents] = useState([]);

  // Add Student
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [attendance, setAttendance] = useState("");
  const [internalMarks, setInternalMarks] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit Student
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [editAttendance, setEditAttendance] = useState("");
  const [editInternalMarks, setEditInternalMarks] = useState("");
  const [editCgpa, setEditCgpa] = useState("");

  // Bulk Upload
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");

  // Delete
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // UI
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  const token = localStorage.getItem("token");

  /* ================= SOCKET ================= */
  useEffect(() => {
    const socket = io("http://localhost:5000", { auth: { token } });

    socket.on("studentUpdated", fetchStudents);
    fetchStudents();

    return () => socket.disconnect();
  }, [token]);

  /* ================= FETCH ================= */
  const fetchStudents = async () => {
    const res = await fetch("http://localhost:5000/api/students", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setStudents(data);
  };
 const navigate = useNavigate();
  /* ================= ADD ================= */
  const addStudent = async (e) => {
    e.preventDefault();
    if (!name || !rollNo || !attendance || !internalMarks || !cgpa)
      return alert("Fill all fields");

    setLoading(true);

    await fetch("http://localhost:5000/api/students/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        rollNo,
        attendance,
        internalMarks,
        cgpa,
      }),
    });

    setLoading(false);
    setName("");
    setRollNo("");
    setAttendance("");
    setInternalMarks("");
    setCgpa("");
  };
    const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  /* ================= EDIT ================= */
  const openEditModal = (student) => {
    setEditStudent(student);
    setEditAttendance(student.attendance);
    setEditInternalMarks(student.internalMarks);
    setEditCgpa(student.cgpa);
    setShowEditModal(true);
  };

  const updateStudent = async () => {
    setLoading(true);

    await fetch(`http://localhost:5000/api/students/${editStudent._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        attendance: editAttendance,
        internalMarks: editInternalMarks,
        cgpa: editCgpa,
      }),
    });

    setLoading(false);
    setShowEditModal(false);
  };

  /* ================= DELETE ================= */
  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowModal(true);
  };

  const deleteStudent = async () => {
    await fetch(`http://localhost:5000/api/students/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setShowModal(false);
  };

  /* ================= BULK UPLOAD ================= */
  const uploadSheet = async () => {
    if (!file) return alert("Select file");

    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://localhost:5000/api/students/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    setUploadMsg("Bulk upload successful");
    setFile(null);
  };

  /* ================= FILTER ================= */
  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (search.trim() !== "") {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.rollNo.toLowerCase().includes(lower)
      );
    }

    if (sortOrder !== "all") {
      filtered = filtered.filter((s) => s.riskLevel === sortOrder);
    }

    return filtered;
  }, [students, search, sortOrder]);

  /* ================= PAGINATION ================= */
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
      <h2>Students Management</h2>

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🔄 Predicting Risk...</h3>
            <p>Please wait while AI recalculates.</p>
          </div>
        </div>
      )}

      {/* ADD + BULK */}
      <div className="top-section">
        <div className="form-card">
          <h3>Add Student</h3>
          <form className="student-form" onSubmit={addStudent}>
            <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="Roll No" value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
            <input type="number" placeholder="Attendance" value={attendance} onChange={(e) => setAttendance(e.target.value)} />
            <input type="number" placeholder="Internal Marks" value={internalMarks} onChange={(e) => setInternalMarks(e.target.value)} />
            <input type="number" step="0.1" placeholder="CGPA" value={cgpa} onChange={(e) => setCgpa(e.target.value)} />
            <button type="submit">Add</button>
          </form>
        </div>

        <div className="upload-card">
          <h3>Bulk Upload</h3>
          <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={uploadSheet}>Upload</button>
          {uploadMsg && <p className="info">{uploadMsg}</p>}
        </div>
      </div>

      {/* SEARCH + SORT */}
      <div className="controls">
        <input
          className="search-box"
          placeholder="Search by name or roll..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="all">All Risks</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="students-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll</th>
              <th>Risk</th>
              <th>Suggestion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{s.rollNo}</td>
                <td className={`risk ${s.riskLevel?.toLowerCase()}`}>{s.riskLevel}</td>
                <td>{s.suggestion}</td>
                <td>
                  <button className="edit-btn" onClick={() => openEditModal(s)}>Edit</button>
                  <button className="delete-btn" onClick={() => confirmDelete(s._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={currentPage === i + 1 ? "active-page" : ""}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* DELETE MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Delete this student?</p>
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button className="delete-btn" onClick={deleteStudent}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Student</h3>
            <p><strong>Name:</strong> {editStudent.name}</p>
            <p><strong>Roll:</strong> {editStudent.rollNo}</p>

            <input type="number" value={editAttendance} onChange={(e) => setEditAttendance(e.target.value)} />
            <input type="number" value={editInternalMarks} onChange={(e) => setEditInternalMarks(e.target.value)} />
            <input type="number" step="0.1" value={editCgpa} onChange={(e) => setEditCgpa(e.target.value)} />

            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="save-btn" onClick={updateStudent}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
