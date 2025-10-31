import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaUserCircle } from "react-icons/fa";

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark px-3 fixed-top">
        <button className="btn btn-outline-light me-2" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <div className="ms-auto">
          <button className="btn btn-outline-light">
            <FaUserCircle size={20} />
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`sidebar bg-light ${sidebarOpen ? "open" : ""}`}>
        <ul className="list-unstyled p-3">
          <li>
            <Link to="/" className="text-decoration-none d-block py-2">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/inquiries" className="text-decoration-none d-block py-2">
              Inquiries
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Header;
