import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  FaChartPie, 
  FaUsers, 
  FaQuestionCircle, 
  FaSignOutAlt,
  FaShieldAlt,
  FaHistory
} from "react-icons/fa";
import { jwtDecode } from "jwt-decode";

const Sidebar = () => {
  const navigate = useNavigate();
  
  const token = localStorage.getItem("token");
  let isOwner = false;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      isOwner = decoded?.adminRole === "Owner";
    } catch (e) {
      console.error("Invalid token");
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: <FaChartPie /> },
    { name: "Inquiries", path: "/inquiries", icon: <FaQuestionCircle /> },
  ];

  if (isOwner) {
    navItems.push({ name: "Admins", path: "/admins", icon: <FaUsers /> });
    navItems.push({ name: "Timeline", path: "/timeline", icon: <FaHistory /> });
  }

  return (
    <div className="sidebar" style={{
      width: "var(--sidebar-width)",
      height: "100vh",
      background: "var(--bg-sidebar)",
      color: "white",
      position: "fixed",
      left: 0,
      top: 0,
      display: "flex",
      flexDirection: "column",
      padding: "24px 16px",
      zIndex: 1000
    }}>
      <div className="sidebar-logo" style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "40px",
        padding: "0 8px"
      }}>
        <div style={{
          background: "var(--accent)",
          padding: "8px",
          borderRadius: "8px",
          display: "flex"
        }}>
          <FaShieldAlt size={20} />
        </div>
        <span style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "0.5px" }}>
          TheBoxSync <span style={{ color: "var(--accent)" }}>Admin</span>
        </span>
      </div>

      <nav style={{ flex: 1 }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px", paddingLeft: "8px" }}>
          Main Menu
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "12px",
              color: isActive ? "white" : "rgba(255,255,255,0.6)",
              textDecoration: "none",
              marginBottom: "4px",
              background: isActive ? "rgba(59, 130, 246, 0.15)" : "transparent",
              transition: "var(--transition)",
              fontWeight: isActive ? 600 : 400
            })}
          >
            <span style={{ color: "inherit" }}>{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "12px",
          color: "#fda4af",
          background: "transparent",
          border: "none",
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          transition: "var(--transition)"
        }}
      >
        <FaSignOutAlt />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;
