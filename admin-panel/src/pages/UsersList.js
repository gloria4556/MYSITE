import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useLocation, useNavigate } from "react-router-dom";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const pageSize = 10;

  const fetchUsers = async (pg = 1, q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append("search", q);
      params.append("page", pg);
      params.append("page_size", pageSize);

      const res = await api.get(`/api/users/?${params.toString()}`);
      const data = res.data.results || res.data;
      const count = res.data.count || data.length;
      setUsers(Array.isArray(data) ? data : []);
      setTotalPages(Math.ceil(count / pageSize));
      setSelected(new Set());
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load users");
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("search") || "";
    setSearch(q);
    fetchUsers(1, q);
  }, [location.search]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    setPage(1);
    fetchUsers(1, q);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchUsers(newPage, search);
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const toggleSelectAll = () => {
    if (selected.size === users.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u.id)));
    }
  };

  const deleteSelected = async () => {
    if (!window.confirm(`Delete ${selected.size} user(s)?`)) return;
    setDeleting(true);
    try {
      for (const id of selected) {
        await api.delete(`/api/users/${id}/`);
      }
      setSelected(new Set());
      fetchUsers(page, search);
    } catch (err) {
      setError(err.message || "Failed to delete users");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Users</h2>
        <div style={{ width: 300 }}>
          <input
            type="search"
            className="form-control form-control-sm"
            placeholder="Search users by name or email..."
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Batch Actions */}
      {selected.size > 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center">
          <span>{selected.size} user(s) selected</span>
          <button
            className="btn btn-sm btn-danger"
            onClick={deleteSelected}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Selected"}
          </button>
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="table-responsive card p-3 bg-white shadow-sm">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={
                        selected.size === users.length && users.length > 0
                      }
                    />
                  </th>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Admin</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggleSelect(u.id)}
                      />
                    </td>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.isAdmin ? "✅" : ""}</td>
                    <td>
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => navigate(`/users/${u.id}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={async () => {
                            if (window.confirm("Delete this user?")) {
                              try {
                                await api.delete(`/api/users/${u.id}/`);
                                fetchUsers(page, search);
                              } catch (err) {
                                setError(
                                  err.response?.data?.detail || err.message,
                                );
                              }
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <nav aria-label="Page navigation" className="mt-3">
            <ul className="pagination">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <li
                  key={p}
                  className={`page-item ${page === p ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                </li>
              ))}
              <li
                className={`page-item ${page === totalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
