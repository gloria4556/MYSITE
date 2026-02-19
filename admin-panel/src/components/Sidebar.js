import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaBoxOpen,
  FaShoppingCart,
  FaCog,
  FaLandmark,
  FaQuestionCircle,
  FaShieldAlt,
  FaHeadset,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaImage,
  FaFileAlt,
} from "react-icons/fa";
import "./sidebar.css";

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("adminSidebarCollapsed") === "true";
    } catch (e) {
      return false;
    }
  });

  // reflect collapsed state on the <body> so layout can respond with CSS
  React.useEffect(() => {
    try {
      if (collapsed) document.body.classList.add("sidebar-collapsed");
      else document.body.classList.remove("sidebar-collapsed");
    } catch (e) {}
  }, [collapsed]);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("adminSidebarCollapsed", next ? "true" : "false");
      } catch (e) {}
      return next;
    });
  };

  return (
    <aside
      className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}
      aria-hidden={false}
    >
      <div className="sidebar-top">
        <div className="brand" title="Admin panel">
          <span className="brand-icon">
            <FaBoxOpen />
          </span>
          <span className="brand-text">Admin</span>
        </div>
        <button
          className="btn-collapse"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          onClick={toggle}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Admin navigation">
        <div className="sidebar-section">
          <ul>
            <li className={location.pathname === "/" ? "active" : ""}>
              <Link to="/" title="Dashboard">
                <FaTachometerAlt className="icon" /> <span>Dashboard</span>
              </Link>
            </li>
            <li
              className={location.pathname.startsWith("/users") ? "active" : ""}
            >
              <Link to="/users" title="Users">
                <FaUsers className="icon" /> <span>Users</span>
              </Link>
            </li>
            <li
              className={
                location.pathname.startsWith("/products") ? "active" : ""
              }
            >
              <Link to="/products" title="Products">
                <FaBoxOpen className="icon" /> <span>Products</span>
              </Link>
            </li>
            <li
              className={
                location.pathname.startsWith("/orders") ? "active" : ""
              }
            >
              <Link to="/orders" title="Orders">
                <FaShoppingCart className="icon" /> <span>Orders</span>
              </Link>
            </li>
            <li
              className={
                location.pathname.startsWith("/messages") ? "active" : ""
              }
            >
              <Link to="/messages" title="Messages">
                <FaHeadset className="icon" /> <span>Messages</span>
              </Link>
            </li>
            <li>
              <Link to="#" title="Settings">
                <FaCog className="icon" /> <span>Settings</span>
              </Link>
            </li>
            <li>
              <Link to="#" title="Help">
                <FaQuestionCircle className="icon" /> <span>Help</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="sidebar-bottom text-muted small">v0.1 · Basic</div>
    </aside>
  );
}
