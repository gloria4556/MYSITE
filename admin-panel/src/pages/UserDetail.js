import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useParams, useNavigate } from "react-router-dom";

export default function UserDetail() {
  const [user, setUser] = useState({
    username: "",
    email: "",
    name: "",
    isAdmin: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/users/${id}/`);
        setUser({
          username: res.data.username || "",
          email: res.data.email || "",
          name: res.data.first_name || "",
          isAdmin: res.data.is_staff || false,
        });
        setError(null);
      } catch (err) {
        setError(err.response?.data?.detail || "Could not load user");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUser({
      ...user,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        username: user.username,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      };
      await api.put(`/api/users/${id}/`, payload);
      setSuccess(true);
      setError(null);
      setTimeout(() => {
        navigate("/users");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save user");
      setSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-dashboard">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Edit User</h2>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/users")}
        >
          Back
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && (
        <div className="alert alert-success">
          User saved successfully! Redirecting...
        </div>
      )}

      <div className="card shadow-sm" style={{ maxWidth: "600px" }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                name="username"
                value={user.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={user.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={user.name}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="isAdmin"
                name="isAdmin"
                checked={user.isAdmin}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="isAdmin">
                Admin
              </label>
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/users")}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
