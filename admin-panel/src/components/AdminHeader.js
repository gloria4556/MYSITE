import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaBars,
  FaSearch,
  FaBell,
  FaEnvelope,
  FaGlobe,
  FaMoon,
  FaSun,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa";
import "./admin-header.css";

export default function AdminHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState("products");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications] = useState(3);
  const [messagesCount, setMessagesCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Apply stored theme on load
    const theme = localStorage.getItem("adminTheme") || "light";
    setIsDarkMode(theme === "dark");
    if (theme === "light") document.body.classList.add("light-mode");
    else document.body.classList.remove("light-mode");
  }, []);

  // Fetch recent messages/unread count for header
  useEffect(() => {
    let mounted = true;
    import("../utils/api").then(({ default: api }) => {
      api
        .get("/api/messages/?page_size=5")
        .then((res) => {
          if (!mounted) return;
          const data = res.data || {};
          setRecentMessages(data.results || []);
          if (typeof data.count === "number") setMessagesCount(data.count || 0);
        })
        .catch(() => {});
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Keep search input in sync with URL ?search= when navigating
    const q = new URLSearchParams(location.search).get("search") || "";
    setSearchQuery(q);
  }, [location.search]);

  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem("adminUser")) || null;
    } catch (e) {
      return null;
    }
  })();

  const logout = () => {
    localStorage.removeItem("adminUser");
    navigate("/login");
  };

  const toggleTheme = () => {
    const nextIsDark = !isDarkMode;
    setIsDarkMode(nextIsDark);
    const theme = nextIsDark ? "dark" : "light";
    // Store preference
    localStorage.setItem("adminTheme", theme);
    if (theme === "light") document.body.classList.add("light-mode");
    else document.body.classList.remove("light-mode");
  };

  const toggleSidebar = () => {
    const sidebar = document.querySelector(".admin-sidebar");
    const isCurrentlyCollapsed = sidebar.classList.contains("collapsed");
    const newCollapsedState = !isCurrentlyCollapsed;

    sidebar.classList.toggle("collapsed");

    // Also update body class for CSS responsive handling
    if (newCollapsedState) {
      document.body.classList.add("sidebar-collapsed");
    } else {
      document.body.classList.remove("sidebar-collapsed");
    }

    localStorage.setItem(
      "adminSidebarCollapsed",
      newCollapsedState ? "true" : "false",
    );
  };

  const doSearch = () => {
    const q = (searchQuery || "").trim();
    if (!q) return;
    let path = "/";
    if (searchScope === "products") path = "/products";
    else if (searchScope === "orders") path = "/orders";
    else if (searchScope === "users") path = "/users";
    else path = "/";

    navigate(`${path}?search=${encodeURIComponent(q)}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") doSearch();
  };

  return (
    <header className="admin-header">
      <div className="admin-header-container">
        {/* Left Section */}
        <div className="admin-header-left">
          {/* Menu Toggle */}
          <button
            className="admin-header-toggle"
            onClick={toggleSidebar}
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            <FaBars />
          </button>

          {/* Logo/Brand */}
          <Link to="/" className="admin-header-brand">
            <span className="brand-icon">🏢</span>
            <span className="brand-text">MamiGlo</span>
          </Link>
        </div>

        {/* Center Section - Search */}
        <div className="admin-header-search">
          <div className="search-box">
            <select
              className="search-scope"
              value={searchScope}
              onChange={(e) => setSearchScope(e.target.value)}
              aria-label="Search scope"
            >
              <option value="products">Products</option>
              <option value="orders">Orders</option>
              <option value="users">Users</option>
              <option value="all">All</option>
            </select>

            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search products, orders, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <button
                type="button"
                className="search-submit"
                aria-label="Search"
                onClick={doSearch}
                title="Search"
              >
                <FaSearch />
              </button>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="admin-header-right">
          {/* Notification Bell */}
          <div className="admin-header-item">
            <button
              className="admin-header-btn"
              title="Notifications"
              aria-label="Notifications"
            >
              <FaBell />
              {notifications > 0 && (
                <span className="admin-header-badge">{notifications}</span>
              )}
            </button>
            <div className="admin-header-dropdown">
              <div className="dropdown-header">Notifications</div>
              <ul className="dropdown-items">
                {[...Array(3)].map((_, i) => (
                  <li key={i}>
                    <a href="#notification">
                      <strong>Alert {i + 1}</strong>
                      <small>Just now</small>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Message/Chat Icon */}
          <div className="admin-header-item">
            <button
              className="admin-header-btn"
              title="Messages"
              aria-label="Messages"
            >
              <FaEnvelope />
              {messagesCount > 0 && (
                <span className="admin-header-badge">{messagesCount}</span>
              )}
            </button>
            <div className="admin-header-dropdown">
              <div className="dropdown-header">Messages</div>
              <ul className="dropdown-items">
                {recentMessages.length === 0 && (
                  <li className="empty">No recent messages</li>
                )}
                {recentMessages.map((m) => (
                  <li key={m._id || m.id}>
                    <a href={`/messages`}>
                      <strong>
                        {m.subject || (m.message || "").slice(0, 30)}
                      </strong>
                      <small>{new Date(m.created_at).toLocaleString()}</small>
                    </a>
                  </li>
                ))}
                <li className="dropdown-footer">
                  <a href="/messages">View all messages</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Language/Region */}
          <button
            className="admin-header-btn"
            title="Language"
            aria-label="Language selector"
          >
            <FaGlobe />
          </button>

          {/* Theme Toggle */}
          <button
            className="admin-header-btn"
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <FaMoon /> : <FaSun />}
          </button>

          {/* User Profile Dropdown */}
          <div className="admin-header-profile">
            <button
              className="admin-header-btn profile-btn"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              title="User menu"
            >
              <img
                src={admin?.profilePicture || "https://via.placeholder.com/32"}
                alt="Profile"
                className="profile-avatar"
              />
              <span className="profile-name">{admin?.username || "Admin"}</span>
              <FaChevronDown className="profile-chevron" />
            </button>

            {showProfileDropdown && (
              <div className="admin-header-dropdown profile-dropdown">
                <div className="dropdown-header">
                  <img
                    src={
                      admin?.profilePicture || "https://via.placeholder.com/48"
                    }
                    alt="Profile"
                    className="dropdown-avatar"
                  />
                  <div>
                    <strong>{admin?.username || "Admin"}</strong>
                    <small>{admin?.email || "admin@mamiglo.com"}</small>
                  </div>
                </div>
                <ul className="dropdown-items">
                  <li>
                    <Link to="/profile">
                      <FaUser /> Profile
                    </Link>
                  </li>
                  <li>
                    <Link to="#settings">
                      <FaCog /> Settings
                    </Link>
                  </li>
                </ul>
                <div className="dropdown-footer">
                  <button className="logout-btn" onClick={logout}>
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
