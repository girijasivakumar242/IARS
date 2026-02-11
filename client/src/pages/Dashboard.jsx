import { useEffect, useState, useMemo } from "react";
import "../styles/Dashboard.css";
import { useNavigate, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { io } from "socket.io-client";

import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Pie, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("All");

  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  /* ================= SOCKET SETUP ================= */
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const socket = io(import.meta.env.VITE_API_URL,  { auth: { token } });

    socket.on("connect", () => console.log("Connected to socket server"));

    socket.on("studentUpdated", () => {
      fetchStudents();
      fetchAnalytics();
    });

    fetchStudents();
    fetchAnalytics();

    return () => socket.disconnect();
  }, [token]);

  /* ================= FETCH STUDENTS ================= */
  const fetchStudents = async () => {
    try {
      const res = await axios.get(
        "import.meta.env.VITE_API_URL/api/students",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents(res.data);
    } catch (err) {
      navigate("/login");
    }
  };

  /* ================= FETCH ANALYTICS ================= */
  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(
        "import.meta.env.VITE_API_URL/api/students/analytics/summary",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats({
        total: res.data.totalStudents,
        high: res.data.highRisk,
        medium: res.data.mediumRisk,
        low: res.data.lowRisk,
      });
    } catch (err) {
      console.error("Analytics error");
    }
  };

  /* ================= FILTERED STUDENTS ================= */
  const filteredStudents = useMemo(() => {
    let filtered = students.filter((student) =>
      student.name.toLowerCase().includes(search.toLowerCase())
    );
    if (filterRisk !== "All") {
      filtered = filtered.filter((student) => student.riskLevel === filterRisk);
    }
    return filtered;
  }, [students, search, filterRisk]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const indexOfLast = currentPage * studentsPerPage;
  const indexOfFirst = indexOfLast - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirst, indexOfLast);

  // Reset page if filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRisk, students.length]);

  /* ================= PIE + TREND DATA ================= */
  const pieData = {
    labels: ["High Risk", "Medium Risk", "Low Risk"],
    datasets: [
      {
        data: [stats.high, stats.medium, stats.low],
        backgroundColor: ["#ef4444", "#f59e0b", "#22c55e"],
      },
    ],
  };

  const trendData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "High Risk Trend",
        data: [3, 5, 4, stats.high],
        borderColor: "#ef4444",
        tension: 0.4,
      },
    ],
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="logo">RiskShield AI</div>
        <div className="nav-links">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/students">Students</NavLink>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-container">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="dashboard-header">
          <h2>Teacher Analytics Dashboard</h2>
          <p>Monitor academic risks and take early actions.</p>
        </motion.div>

        <div className="stats-grid">
          <motion.div whileHover={{ scale: 1.05 }} className="stat-card">
            <h3>{stats.total}</h3>
            <p>Total Students</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="stat-card high">
            <h3>{stats.high}</h3>
            <p>High Risk</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="stat-card medium">
            <h3>{stats.medium}</h3>
            <p>Medium Risk</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="stat-card low">
            <h3>{stats.low}</h3>
            <p>Low Risk</p>
          </motion.div>
        </div>

        <div className="analytics-grid">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
            <h3>Risk Distribution</h3>
            <div className="small-chart">
              <Pie data={pieData} />
            </div>
          </motion.div>

          <div className="card">
            <h3>Risk Trend</h3>
            <Line data={trendData} />
          </div>
        </div>

        <div className="filter-bar">
          <input placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
            <option value="All">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="card">
          <h3>Students Overview</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.map((student) => (
                <tr key={student._id}>
                  <td>{student.name}</td>
                  <td>{student.rollNo}</td>
                  <td><span className={`badge ${student.riskLevel}`}>{student.riskLevel}</span></td>
                </tr>
              ))}
            </tbody>
          </table>

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
        </div>

        <div className="card suggestion-box">
          <h3>AI Suggestion</h3>
          {stats.high > 5 ? (
            <p>⚠️ More than 5 students are high risk. Immediate intervention sessions and attendance review are recommended.</p>
          ) : stats.medium > 5 ? (
            <p>⚡ Several students are at medium risk. Provide mentoring and monitor weekly performance.</p>
          ) : (
            <p>✅ Risk levels are stable. Continue monitoring weekly.</p>
          )}
        </div>
      </div>
    </div>
  );
}
