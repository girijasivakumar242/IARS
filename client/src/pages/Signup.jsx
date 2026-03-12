import "../styles/Auth.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Signup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("teacher");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const body = { name, email, password, role };
      if (phone) body.phone = phone;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Signup failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.user.role);
      
      navigate(role === "parent" ? "/parent-dashboard" : "/dashboard");
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <h1>IARS</h1>
        <h2>Intelligent Academic Risk Management System</h2>
        <p>
          {role === "teacher"
            ? "Create a teacher account to manage students, monitor academic risks, and take early intervention actions using data-driven insights."
            : "Create a parent account to monitor your child's academic performance, receive alerts, and track their progress."}
        </p>
      </div>

      <div className="auth-right">
        <form className="auth-card" onSubmit={handleSignup}>
          <h3>{role === "teacher" ? "Teacher" : "Parent"} Signup</h3>

          {/* Role Selection */}
          <div className="role-selector">
            <label>
              <input
                type="radio"
                value="teacher"
                checked={role === "teacher"}
                onChange={(e) => setRole(e.target.value)}
              />
              Teacher
            </label>
            <label>
              <input
                type="radio"
                value="parent"
                checked={role === "parent"}
                onChange={(e) => setRole(e.target.value)}
              />
              Parent
            </label>
          </div>

          {error && <p className="error-text">{error}</p>}

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {role === "parent" && (
            <input
              type="tel"
              placeholder="Phone Number (Optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          )}

          <button type="submit">Create Account</button>

          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
