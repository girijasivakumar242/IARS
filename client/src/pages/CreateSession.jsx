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
  const [statusType, setStatusType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const createSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setStatusType("");

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
      setStatusType("success");
    } catch (err) {
      console.log(err);
      setMessage("Failed to create session. Please try again.");
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas || !session) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `session-${session.sessionCode}-qr.png`;
    link.click();
  };

  const copyLink = async () => {
    if (!session?.qrLink) return;

    try {
      await navigator.clipboard.writeText(session.qrLink);
      setMessage("Session link copied successfully!");
      setStatusType("success");
    } catch (error) {
      setMessage("Failed to copy link.");
      setStatusType("error");
    }
  };

  return (
    <div className="session-page">
      <div className="session-shell">
        <div className="session-header">
          <div>
            <p className="session-badge">Attendance / Student Data Portal</p>
            <h1>Create Student Data Session</h1>
            <p className="session-subtitle">
              Generate a secure session for students to submit their details
              using QR code or direct link.
            </p>
          </div>
        </div>

        <div className="session-grid">
          <div className="session-panel form-panel">
            <div className="panel-top">
              <h2>Session Details</h2>
              <p>Fill in the academic details to create a new live session.</p>
            </div>

            <form onSubmit={createSession} className="session-form">
              <div className="input-group">
                <label htmlFor="department">Department</label>
                <input
                  id="department"
                  type="text"
                  name="department"
                  placeholder="e.g. CSE"
                  value={formData.department}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="year">Year</label>
                <input
                  id="year"
                  type="text"
                  name="year"
                  placeholder="e.g. 2nd Year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="durationMinutes">Session Duration</label>
                <input
                  id="durationMinutes"
                  type="number"
                  name="durationMinutes"
                  placeholder="Session Duration (minutes)"
                  value={formData.durationMinutes}
                  onChange={handleChange}
                  min="1"
                />
              </div>

              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? "Creating Session..." : "Create Session"}
              </button>
            </form>

            {message && (
              <div className={`status-message ${statusType}`}>
                {message}
              </div>
            )}

            <div className="mini-info-grid">
              <div className="info-card">
                <span>Department</span>
                <strong>{formData.department || "Not selected"}</strong>
              </div>
              <div className="info-card">
                <span>Year</span>
                <strong>{formData.year || "Not selected"}</strong>
              </div>
              <div className="info-card">
                <span>Duration</span>
                <strong>{formData.durationMinutes} mins</strong>
              </div>
            </div>
          </div>

          <div className="session-panel preview-panel">
            <div className="panel-top">
              <h2>Live Preview</h2>
              <p>
                QR code and session link will appear here once the session is
                created.
              </p>
            </div>

            {session ? (
              <div className="qr-section">
                <div className="session-code-box">
                  <span>Session Code</span>
                  <h3>{session.sessionCode}</h3>
                </div>

                <div ref={qrRef} className="qr-wrapper">
                  <QRCodeCanvas value={session.qrLink} size={220} />
                </div>

                <p className="qr-note">
                  Students can scan this QR code to submit their details.
                </p>

                <div className="link-box">
                  <span>Session Link</span>
                  <p>{session.qrLink}</p>
                </div>

                <div className="qr-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={downloadQR}
                  >
                    Download QR
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={copyLink}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-preview">
                <div className="empty-qr-box">
                  <div className="fake-qr" />
                </div>
                <h3>No Session Created Yet</h3>
                <p>
                  Once you create a session, the QR code, session code, and
                  sharing link will be displayed here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSession;