import "../styles/Auth.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch( `${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      navigate("/dashboard");
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
          Identify at-risk students early using data-driven insights and
          support academic success through timely intervention.
        </p>
      </div>

      <div className="auth-right">
        <form className="auth-card" onSubmit={handleLogin}>
          <h3>Teacher Login</h3>

          {error && <p className="error-text">{error}</p>}

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

          <button type="submit">Login</button>

          <p>
            New user? <Link to="/signup">Signup</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
