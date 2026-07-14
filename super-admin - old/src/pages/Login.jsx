import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUserShield, FaLock, FaUser } from "react-icons/fa";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/superadmin/login`,
        { username, password }
      );

      if (res.status === 200) {
        localStorage.setItem("token", res.data.token);
        navigate("/"); 
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vw-100 vh-100" style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      overflow: "hidden"
    }}>
      {/* Decorative Elements */}
      <div style={{
        position: "absolute",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
        top: "-250px",
        right: "-250px",
        borderRadius: "50%"
      }}></div>
      <div style={{
        position: "absolute",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)",
        bottom: "-200px",
        left: "-200px",
        borderRadius: "50%"
      }}></div>

      <div className="glass-card p-5" style={{ 
        width: "420px", 
        background: "rgba(255, 255, 255, 0.03)", 
        borderColor: "rgba(255, 255, 255, 0.1)",
        color: "white"
      }}>
        <div className="text-center mb-5">
          <div style={{
            background: "var(--accent)",
            width: "60px",
            height: "60px",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 8px 16px rgba(59, 130, 246, 0.4)"
          }}>
            <FaUserShield size={30} />
          </div>
          <h2 className="fw-bold mb-1">Super Admin</h2>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>TheBoxSync Command Center</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="small fw-bold mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>Username</label>
            <div className="position-relative">
              <FaUser className="position-absolute" style={{ left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input
                type="text"
                className="form-control"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  padding: "12px 12px 12px 48px",
                  borderRadius: "12px"
                }}
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="small fw-bold mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>Password</label>
            <div className="position-relative">
              <FaLock className="position-absolute" style={{ left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input
                type="password"
                className="form-control"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  padding: "12px 12px 12px 48px",
                  borderRadius: "12px"
                }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-3 text-center" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", fontSize: "14px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-modern btn-modern-primary w-100 justify-content-center py-3"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : "Secure Login"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="small" style={{ color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} TheBoxSync Enterprise
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
