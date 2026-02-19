import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-toastify";

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    priceCurrency: "USD",
    countInStock: "",
    sku: "",
    category: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load product if editing
  useEffect(() => {
    if (!isNew) {
      let mounted = true;
      const load = async () => {
        try {
          const res = await api.get(`/api/products/${id}/`);
          if (mounted) {
            const p = res.data;
            setForm({
              name: p.name || "",
              description: p.description || "",
              price: p.price || "",
              priceCurrency: p.priceCurrency || "USD",
              countInStock: p.countInStock ?? p.stock ?? "",
              sku: p.sku || "",
              category: p.category || "",
            });
            if (p.image) setImagePreview(p.image);
          }
        } catch (err) {
          if (mounted) setError(err.message || "Failed to load product");
        } finally {
          if (mounted) setLoading(false);
        }
      };
      load();
      return () => (mounted = false);
    }
  }, [id, isNew]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (evt) => setImagePreview(evt.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    if (!form.name.trim()) return "Product name is required";
    if (parseFloat(form.price) <= 0) return "Price must be greater than 0";
    if (parseInt(form.countInStock) < 0) return "Stock cannot be negative";
    if (image && image.size > 5 * 1024 * 1024)
      return "Image must be smaller than 5MB";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("priceCurrency", form.priceCurrency);
      formData.append("countInStock", form.countInStock);
      if (form.sku) formData.append("sku", form.sku);
      if (form.category) formData.append("category", form.category);
      if (image) formData.append("image", image);

      let res;
      if (isNew) {
        res = await api.post("/api/products/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product created");
      } else {
        res = await api.put(`/api/products/${id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product updated");
      }

      setSuccess(true);
      setTimeout(() => navigate("/products"), 1000);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to save product";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-dashboard">
      <Link to="/products" className="btn btn-outline-secondary mb-3">
        ← Back to Products
      </Link>
      <h2>{isNew ? "Create Product" : "Edit Product"}</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && (
        <div className="alert alert-success">Product saved! Redirecting...</div>
      )}

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="row">
          <div className="col-md-8">
            {/* Basic Info */}
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">Basic Information</h5>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="4"
                    value={form.description}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">Pricing & Inventory</h5>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label htmlFor="price" className="form-label">
                      Price *
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="price"
                      name="price"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-2 mb-3">
                    <label htmlFor="priceCurrency" className="form-label">
                      Currency *
                    </label>
                    <select
                      className="form-control"
                      id="priceCurrency"
                      name="priceCurrency"
                      value={form.priceCurrency}
                      onChange={handleChange}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="CHF">CHF - Swiss Franc</option>
                      <option value="CNY">CNY - Chinese Yuan</option>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="NGN">NGN - Nigerian Naira</option>
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="GHS">GHS - Ghanaian Cedi</option>
                      <option value="EGP">EGP - Egyptian Pound</option>
                      <option value="ZAR">ZAR - South African Rand</option>
                      <option value="BRL">BRL - Brazilian Real</option>
                      <option value="MXN">MXN - Mexican Peso</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="countInStock" className="form-label">
                      Stock *
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="countInStock"
                      name="countInStock"
                      value={form.countInStock}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="sku" className="form-label">
                      SKU
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="sku"
                      name="sku"
                      value={form.sku}
                      onChange={handleChange}
                      placeholder="e.g., PROD-001"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="category" className="form-label">
                      Category
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="category"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      placeholder="e.g., Electronics"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3 d-flex gap-2 align-items-center">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Product"}
              </button>
              <Link to="/products" className="btn btn-outline-secondary ms-2">
                Cancel
              </Link>
              {!isNew && (
                <button
                  type="button"
                  className="btn btn-danger ms-auto"
                  onClick={async () => {
                    if (!window.confirm("Delete this product?")) return;
                    // Guard against invalid id values coming from the URL
                    if (!id || id === "undefined") {
                      const msg = "Invalid product id";
                      toast.error(msg);
                      setError(msg);
                      return;
                    }
                    try {
                      await api.delete(`/api/products/${id}/`);
                      toast.success("Product deleted");
                      navigate("/products");
                    } catch (err) {
                      const msg =
                        err.response?.data?.detail ||
                        err.message ||
                        "Delete failed";
                      toast.error(msg);
                    }
                  }}
                >
                  Delete Product
                </button>
              )}
            </div>
          </div>

          {/* Image Sidebar */}
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Product Image</h5>
                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={imagePreview}
                      alt="preview"
                      style={{ maxWidth: "100%", borderRadius: "6px" }}
                    />
                  </div>
                )}
                <div className="mb-2">
                  <label htmlFor="image" className="form-label">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
                <small className="text-muted">JPG, PNG or GIF (max 5MB)</small>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
