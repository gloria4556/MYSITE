import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { Link, useLocation } from "react-router-dom";

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 10;

  const loadOrders = async (pg = 1, q = "", status = "all") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append("search", q);
      if (status !== "all")
        params.append("paid", status === "paid" ? "true" : "false");
      params.append("page", pg);
      params.append("page_size", pageSize);

      const res = await api.get(`/api/orders/?${params.toString()}`);
      const data = res.data.results ?? res.data;
      const count = res.data.count ?? data.length;
      setOrders(Array.isArray(data) ? data : []);
      setTotalPages(Math.ceil(count / pageSize));
    } catch (err) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("search") || "";
    setSearch(q);
    loadOrders(1, q, statusFilter);
  }, [location.search]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    setPage(1);
    loadOrders(1, q, statusFilter);
  };

  const handleStatusFilter = (e) => {
    const status = e.target.value;
    setStatusFilter(status);
    setPage(1);
    loadOrders(1, search, status);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadOrders(newPage, search, statusFilter);
  };

  return (
    <div className="admin-dashboard">
      <h2>Orders</h2>

      {/* Search and Filter */}
      <div className="row mb-3">
        <div className="col-md-8">
          <input
            type="text"
            className="form-control"
            placeholder="Search by order ID or customer email..."
            value={search}
            onChange={handleSearch}
          />
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={statusFilter}
            onChange={handleStatusFilter}
          >
            <option value="all">All Orders</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const oid = o._id ?? o.id ?? o.pk ?? o._id?.toString();
                  return (
                    <tr key={oid}>
                      <td>{oid}</td>
                      <td>{o.user?.email ?? o.user?.username ?? "-"}</td>
                      <td>${o.totalPrice ?? o.total ?? "-"}</td>
                      <td>
                        <span
                          className={`badge ${
                            o.isPaid ? "bg-success" : "bg-warning"
                          }`}
                        >
                          {o.isPaid ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td>
                        {new Date(
                          o.createdAt ?? o.created_at ?? o.date_created ?? "",
                        ).toLocaleString()}
                      </td>
                      <td>
                        <Link
                          to={`/orders/${oid}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <nav aria-label="Page navigation">
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
