import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  const pageSize = 10;

  const loadProducts = async (pg = 1, q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append("search", q);
      params.append("page", pg);
      params.append("page_size", pageSize);

      const res = await api.get(`/api/products/?${params.toString()}`);
      const data = res.data.results ?? res.data;
      const count = res.data.count ?? data.length;
      // Normalize product id field so the UI uses a consistent `id` property
      setProducts(
        Array.isArray(data)
          ? data.map((p) => ({ ...p, id: p._id ?? p.id }))
          : [],
      );
      setTotalPages(Math.ceil(count / pageSize));
      setSelected(new Set());
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("search") || "";
    setSearch(q);
    loadProducts(1, q);
  }, [location.search]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    setPage(1);
    loadProducts(1, q);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadProducts(newPage, search);
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const toggleSelectAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  };

  const deleteSelected = async () => {
    if (!window.confirm(`Delete ${selected.size} product(s)?`)) return;
    setDeleting(true);
    try {
      for (const id of selected) {
        await api.delete(`/api/products/${id}/`);
      }
      setSelected(new Set());
      toast.success(`${selected.size} product(s) deleted`);
      loadProducts(page, search);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to delete products";
      setError(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Products</h2>
        <Link to="/products/new" className="btn btn-primary">
          Create Product
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search products by name or SKU..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Batch Actions */}
      {selected.size > 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center">
          <span>{selected.size} product(s) selected</span>
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
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={
                        selected.size === products.length && products.length > 0
                      }
                    />
                  </th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </td>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>${p.price}</td>
                    <td>{p.countInStock ?? p.stock ?? "-"}</td>
                    <td>
                      <Link
                        to={`/products/${p.id}`}
                        className="btn btn-sm btn-outline-primary me-2"
                      >
                        Edit
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={async () => {
                          if (window.confirm("Delete this product?")) {
                            try {
                              await api.delete(`/api/products/${p.id}/`);
                              toast.success("Product deleted");
                              loadProducts(page, search);
                            } catch (err) {
                              const msg =
                                err.response?.data?.detail ||
                                err.message ||
                                "Delete failed";
                              setError(msg);
                              toast.error(msg);
                            }
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
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
