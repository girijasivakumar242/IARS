import "../styles/Auth.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("import.meta.env.VITE_API_URL/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Signup failed");
        return;
      }

      navigate("/login");
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
          Create a teacher account to manage students, monitor academic risks,
          and take early intervention actions using data-driven insights.
        </p>
      </div>

      <div className="auth-right">
        <form className="auth-card" onSubmit={handleSignup}>
          <h3>Teacher Signup</h3>

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

          <button type="submit">Create Account</button>

          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
