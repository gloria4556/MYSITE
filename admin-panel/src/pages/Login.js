import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post("/api/users/login/", { email, password });
      // Response contains access, refresh and user fields
      const data = res.data;
      // store under adminUser
      localStorage.setItem("adminUser", JSON.stringify(data));
      navigate("/users");
    } catch (err) {
      // Log full error for debugging (network/response)
      console.error("Admin login error", err);
      console.debug("Admin login response", err?.response);
      const serverMsg =
        err?.response?.data?.detail || err?.response?.data || err?.message;
      setError(serverMsg || "Login failed");
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card p-4 shadow-sm">
          <h3 className="mb-3">Admin Login</h3>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={submitHandler}>
            <div className="mb-3">
              <label htmlFor="admin-email" className="form-label">
                Email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                className="form-control"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="admin-password" className="form-label">
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                className="form-control"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary w-100" type="submit">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
