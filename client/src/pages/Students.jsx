import { useEffect, useMemo, useState } from "react";
import "../styles/Students.css";
import { NavLink, useNavigate } from "react-router-dom";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchStudents();
  }, [token]);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
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
        <h2>Student Records</h2>

        <div className="controls">
          <input
            className="search-box"
            placeholder="Search by name or roll number..."
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
              </tr>
            </thead>
            <tbody>
              {currentStudents.length > 0 ? (
                currentStudents.map((s) => (
                  <tr key={s._id}>
                    <td>{s.studentName}</td>
                    <td>{s.regNo}</td>
                    <td>{s.attendance}</td>
                    <td>{s.internalMarks}</td>
                    <td>{s.cgpa}</td>
                    <td className={`risk ${s.riskLevel?.toLowerCase()}`}>
                      {s.riskLevel}
                    </td>
                    <td>{s.suggestions?.join(", ")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No student records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
      </div>
    </>
  );
}