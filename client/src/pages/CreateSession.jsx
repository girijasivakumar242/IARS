import { useState, useRef } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import "../styles/CreateSession.css";

const CreateSession = () => {
  const qrRef = useRef(null);

  const [formData, setFormData] = useState({
    department: "",
    year: "",
    durationMinutes: 30
  });

  const [session, setSession] = useState(null);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const createSession = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/sessions/create`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSession(res.data.session);
      setMessage("Session created successfully!");
    } catch (err) {
      console.log(err);
      setMessage("Failed to create session");
    }
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `session-${session.sessionCode}-qr.png`;
    link.click();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(session.qrLink);
      setMessage("Session link copied successfully!");
    } catch (error) {
      setMessage("Failed to copy link");
    }
  };

  return (
    <div className="session-container">
      <div className="session-card">
        <h2>Create Student Data Session</h2>

        <form onSubmit={createSession}>
          <input
            type="text"
            name="department"
            placeholder="Department"
            value={formData.department}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="year"
            placeholder="Year"
            value={formData.year}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="durationMinutes"
            placeholder="Session Duration (minutes)"
            value={formData.durationMinutes}
            onChange={handleChange}
          />

          <button type="submit">
            Create Session
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        {session && (
          <div className="qr-section">
            <h3>Session Code: {session.sessionCode}</h3>

            <div ref={qrRef} className="qr-wrapper">
              <QRCodeCanvas value={session.qrLink} size={200} />
            </div>

            <p>Students scan this QR to submit details</p>

            <p className="session-link">{session.qrLink}</p>

            <div className="qr-actions">
              <button type="button" className="secondary-btn" onClick={downloadQR}>
                Download QR
              </button>

              <button type="button" className="secondary-btn" onClick={copyLink}>
                Copy Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateSession;