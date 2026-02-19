import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { formatPriceWithCurrency } from "../utils/currency";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const mounted = React.useRef(true);

  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      try {
        const res = await api.get(`/api/orders/${id}/`);
        if (mounted.current) setOrder(res.data);
      } catch (err) {
        if (mounted.current)
          setError(
            err.response?.data?.detail || err.message || "Failed to load order",
          );
      } finally {
        if (mounted.current) setLoading(false);
      }
    };
    load();
    return () => {
      mounted.current = false;
    };
  }, [id]);

  const updateStatus = async (field, value) => {
    setUpdating(true);
    setStatusMessage(null);
    try {
      const payload = { [field]: value };
      const res = await api.patch(`/api/orders/${id}/`, payload);
      // update local state with response from server
      if (mounted) setOrder(res.data);
      setStatusMessage(`Order ${field} updated successfully`);
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Update failed";
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setUpdating(false);
    }
  };

  const approveTransferPayment = async () => {
    setUpdating(true);
    setStatusMessage(null);
    try {
      const res = await api.post(`/api/orders/${id}/approve-transfer/`);
      if (mounted) setOrder(res.data.order);
      setStatusMessage("Transfer payment approved! Order marked as paid.");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Approval failed";
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="admin-dashboard">
      <Link to="/orders" className="btn btn-outline-secondary mb-3">
        ← Back to Orders
      </Link>
      <h2>Order #{order.id}</h2>

      {statusMessage && <div className="alert alert-info">{statusMessage}</div>}

      <div className="row">
        <div className="col-md-8">
          {/* Order Info */}
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Order Information</h5>
              <div className="row">
                <div className="col-md-6 mb-2">
                  <strong>Order ID:</strong> {order.id}
                </div>
                <div className="col-md-6 mb-2">
                  <strong>Date:</strong>{" "}
                  {new Date(
                    order.createdAt || order.created_at || "",
                  ).toLocaleString()}
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-2">
                  <strong>Customer:</strong>{" "}
                  {order.user?.email || order.user?.username || "Unknown"}
                </div>
                <div className="col-md-6 mb-2">
                  <strong>Total:</strong>{" "}
                  {formatPriceWithCurrency(
                    order.totalPrice || order.total || 0,
                    "USD",
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Items</h5>
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.orderitems || []).map((item) => (
                      <tr key={item.id}>
                        <td>{item.product?.name || "N/A"}</td>
                        <td>{item.qty}</td>
                        <td>
                          {formatPriceWithCurrency(
                            item.price || 0,
                            item.priceCurrency || "USD",
                          )}
                        </td>
                        <td>
                          {formatPriceWithCurrency(
                            Number(item.qty || 0) * Number(item.price || 0),
                            item.priceCurrency || "USD",
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingaddress && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Shipping Address</h5>
                <p>
                  {order.shippingaddress.address}
                  <br />
                  {order.shippingaddress.city},{" "}
                  {order.shippingaddress.postalCode}{" "}
                  {order.shippingaddress.country}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Controls */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Order Status</h5>

              <div className="mb-3">
                <label className="form-label">Payment Status</label>
                {order.paymentMethod === "Transfer" &&
                order.transferConfirmedAt &&
                !order.isPaid ? (
                  <div className="card border-warning mb-2">
                    <div className="card-body p-3">
                      <div className="alert alert-warning mb-2">
                        <strong>Bank Transfer Pending Approval</strong>
                        <p className="mb-0 small">
                          User confirmed transfer on{" "}
                          {new Date(order.transferConfirmedAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        className="btn btn-success w-100"
                        disabled={updating}
                        onClick={approveTransferPayment}
                      >
                        {updating ? "Processing..." : "✓ Approve Transfer"}
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="btn-group w-100" role="group">
                  <button
                    className={`btn btn-sm ${
                      order.isPaid ? "btn-success" : "btn-outline-secondary"
                    }`}
                    disabled={updating}
                    onClick={() => updateStatus("isPaid", true)}
                  >
                    Mark Paid
                  </button>
                  <button
                    className={`btn btn-sm ${
                      !order.isPaid
                        ? "btn-outline-secondary"
                        : "btn-outline-danger"
                    }`}
                    disabled={updating}
                    onClick={() => updateStatus("isPaid", false)}
                  >
                    Unpaid
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Delivery Status</label>
                <div className="btn-group w-100" role="group">
                  <button
                    className={`btn btn-sm ${
                      order.isDelivered
                        ? "btn-success"
                        : "btn-outline-secondary"
                    }`}
                    disabled={updating}
                    onClick={() => updateStatus("isDelivered", true)}
                  >
                    Delivered
                  </button>
                  <button
                    className={`btn btn-sm ${
                      !order.isDelivered
                        ? "btn-outline-secondary"
                        : "btn-outline-danger"
                    }`}
                    disabled={updating}
                    onClick={() => updateStatus("isDelivered", false)}
                  >
                    Not Delivered
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Refund Status</label>
                <div className="btn-group w-100" role="group">
                  <button
                    className={`btn btn-sm ${
                      order.isRefunded ? "btn-danger" : "btn-outline-secondary"
                    }`}
                    disabled={updating}
                    onClick={() => updateStatus("isRefunded", true)}
                  >
                    Refunded
                  </button>
                  <button
                    className={`btn btn-sm ${
                      !order.isRefunded
                        ? "btn-outline-secondary"
                        : "btn-outline-success"
                    }`}
                    disabled={updating}
                    onClick={() => updateStatus("isRefunded", false)}
                  >
                    Not Refunded
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
