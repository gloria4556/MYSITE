import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { Spinner } from "react-bootstrap";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      try {
        const adminRaw = JSON.parse(
          localStorage.getItem("adminUser") || "null",
        );
        if (!adminRaw) {
          if (mounted) setAuthorized(false);
          return;
        }

        // If the stored login response already indicates admin, trust it and skip a network call
        if (
          adminRaw.isAdmin ||
          adminRaw.is_admin ||
          adminRaw.is_staff ||
          (adminRaw.data && (adminRaw.data.isAdmin || adminRaw.data.is_admin))
        ) {
          if (mounted) {
            console.debug(
              "ProtectedRoute: admin claim found locally, granting access",
              adminRaw,
            );
            setAuthorized(true);
            setLoading(false);
          }
          return;
        }

        // Try to fetch profile; `api` will attempt a refresh if necessary
        const res = await api.get("/api/users/profile/");
        console.debug("ProtectedRoute: profile response", res);
        const data = res.data;
        const isAdmin =
          data && (data.isAdmin || data.is_staff || data.is_admin);

        if (isAdmin) {
          if (mounted) setAuthorized(true);
        } else {
          localStorage.removeItem("adminUser");
          if (mounted) setAuthorized(false);
        }
      } catch (err) {
        localStorage.removeItem("adminUser");
        if (mounted) setAuthorized(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [navigate, location]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "200px" }}
      >
        <Spinner animation="border" role="status" />
        <span className="ms-2">Verifying admin access...</span>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
