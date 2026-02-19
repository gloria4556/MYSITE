import React, { useEffect, useState, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Spinner,
  Table,
  ListGroup,
  Badge,
  Pagination,
} from "react-bootstrap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import KPIWidget from "../components/KPIWidget";
import api from "../utils/api";
import { formatPriceWithCurrency } from "../utils/currency";
import "./dashboard.css";

function aggregateLast7Days(orders) {
  const dayMap = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = {
      name: d.toLocaleDateString(undefined, { weekday: "short" }),
      sales: 0,
    };
  }

  orders.forEach((o) => {
    if (!o.created_at) return;
    const key = o.created_at.slice(0, 10);
    if (dayMap[key]) {
      dayMap[key].sales += parseFloat(o.totalPrice || 0);
    }
  });

  return Object.values(dayMap);
}

function smallSeriesFromOrders(orders) {
  // build monthly series (Jan-Aug mock or derived)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const map = months.map((m) => ({ name: m, value: 0 }));
  orders.forEach((o) => {
    const d = new Date(o.created_at);
    if (!isNaN(d)) {
      const idx = d.getMonth();
      if (idx < map.length) map[idx].value += parseFloat(o.totalPrice || 0);
    }
  });
  return map;
}

function formatShortId(id) {
  if (id == null) return "-";
  return String(id).slice(-6);
}

function formatId(id) {
  return id == null ? "-" : String(id);
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesSeries, setSalesSeries] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, usersRes, productsRes] = await Promise.all([
          api.get("/api/orders/?page_size=1000"),
          api.get("/api/users/?page_size=1000"),
          api.get("/api/products/?page_size=1000"),
        ]);
        if (!mounted) return;
        const ordersData = ordersRes.data.results || ordersRes.data || [];
        const usersData = usersRes.data.results || usersRes.data || [];
        const productsData = productsRes.data.results || productsRes.data || [];
        setOrders(ordersData);
        setUsers(usersData);
        setProducts(productsData);
        setSalesSeries(aggregateLast7Days(ordersData));
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const totalSales = orders.reduce(
    (sum, o) => sum + parseFloat(o.totalPrice || 0),
    0,
  );

  const totalIncome = totalSales; // placeholder (could subtract costs)
  const ordersPaid = orders.filter((o) => o.isPaid).length;
  const totalVisitors = users.length * 10 + Math.floor(Math.random() * 300); // mock

  // Top products by revenue (price * sold proxy)
  const topProducts = useMemo(() => {
    return products
      .slice()
      .sort((a, b) => (b.price || 0) - (a.price || 0))
      .slice(0, 6)
      .map((p) => ({
        id: formatId(p._id || p.id),
        name: p.name,
        stock: p.countInStock || 0,
        coupon:
          Math.random() > 0.6 ? `SAVE${Math.floor(Math.random() * 50)}` : "-",
        discount:
          Math.random() > 0.5 ? `${Math.floor(Math.random() * 50)}%` : "-",
        price: p.price || 0,
      }));
  }, [products]);

  // Top countries by sales
  const countries = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const c = (o.shippingAddress && o.shippingAddress.country) || "Unknown";
      map[c] = (map[c] || 0) + parseFloat(o.totalPrice || 0);
    });
    return Object.entries(map)
      .map(([country, revenue]) => ({ country, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [orders]);

  // monthly series for earnings
  const monthlySeries = useMemo(() => smallSeriesFromOrders(orders), [orders]);

  // product overview pagination
  const [productPage, setProductPage] = useState(1);
  const pageSize = 5;
  const totalProductPages = Math.max(1, Math.ceil(products.length / pageSize));
  const pagedProducts = products.slice(
    (productPage - 1) * pageSize,
    productPage * pageSize,
  );

  // recent orders
  const recentOrders = orders.slice(0, 6);

  return (
    <div className="admin-dashboard">
      <h2 className="mb-4">Overview</h2>

      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <KPIWidget
            title="Total Sales"
            value={
              loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                `$${totalSales.toLocaleString()}`
              )
            }
            change="+4.5%"
          />
        </Col>
        <Col md={3} sm={6}>
          <KPIWidget
            title="Total Income"
            value={
              loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                `$${totalIncome.toLocaleString()}`
              )
            }
            change="+2.1%"
          />
        </Col>
        <Col md={3} sm={6}>
          <KPIWidget
            title="Orders Paid"
            value={
              loading ? <Spinner animation="border" size="sm" /> : ordersPaid
            }
            change="+1.8%"
          />
        </Col>
        <Col md={3} sm={6}>
          <KPIWidget
            title="Total Visitor"
            value={
              loading ? <Spinner animation="border" size="sm" /> : totalVisitors
            }
            change="-0.6%"
          />
        </Col>
      </Row>

      {/* Upper content: Recent Orders / Top Products / Right side cards */}
      <Row className="g-3 mb-3">
        <Col lg={5}>
          <Card className="h-100">
            <Card.Body>
              <h5>Recent Orders</h5>
              <div className="recent-orders mt-3">
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart
                    data={
                      salesSeries.length
                        ? salesSeries
                        : [{ name: "Mon", sales: 0 }]
                    }
                  >
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#60a5fa"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <ListGroup className="mt-3">
                  {recentOrders.map((o) => (
                    <ListGroup.Item
                      key={formatId(o._id || o.id)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div className="fw-semibold">
                          Order #{formatShortId(o._id || o.id)}
                        </div>
                        <small className="text-muted">
                          {new Date(o.created_at).toLocaleString()}
                        </small>
                      </div>
                      <div className="text-end">
                        <div>
                          {formatPriceWithCurrency(o.totalPrice || 0, "USD")}
                        </div>
                        <small className="text-success">
                          {o.isPaid ? "Paid" : "Pending"}
                        </small>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Body>
              <h5 className="mb-3">Top Products</h5>
              <ListGroup variant="flush">
                {topProducts.map((p) => (
                  <ListGroup.Item
                    key={p.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div style={{ maxWidth: 320, wordBreak: "break-word" }}>
                      <div className="fw-semibold">{p.name}</div>
                      <small className="text-muted">
                        Stock: {p.stock} • Coupon: {p.coupon} • Discount:{" "}
                        {p.discount}
                      </small>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">
                        {formatPriceWithCurrency(
                          p.price || 0,
                          p.priceCurrency || "USD",
                        )}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Row className="g-3">
            <Col md={6}>
              <Card className="h-100">
                <Card.Body>
                  <h6>Top Countries By Sales</h6>
                  <div className="mt-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <h5 className="m-0">${totalSales.toLocaleString()}</h5>
                        <small className="text-muted">Total revenue</small>
                      </div>
                      <div className="text-success">+6.2%</div>
                    </div>

                    <ListGroup variant="flush">
                      {countries.map((c, i) => (
                        <ListGroup.Item
                          key={c.country}
                          className="d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <div className="fw-semibold">{c.country}</div>
                            <small className="text-muted">
                              Trend {Math.random() > 0.5 ? "▲" : "▼"}
                            </small>
                          </div>
                          <div className="fw-semibold">
                            {formatPriceWithCurrency(c.revenue || 0, "USD")}
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100">
                <Card.Body>
                  <h6>Best Shop Sellers</h6>
                  <Table hover responsive size="sm" className="mt-3 mb-0">
                    <thead>
                      <tr>
                        <th>Shop</th>
                        <th>Categories</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Robert", "Fashion", 1245, "97%"],
                        ["Calvin", "Groceries", 1024, "90%"],
                        ["Dwight", "Office", 922, "82%"],
                        ["Cody", "Electronics", 802, "75%"],
                        ["Bruce", "Home", 702, "68%"],
                        ["Jorge", "Beauty", 610, "58%"],
                        ["Kristin Watson", "Fitness", 520, "56%"],
                      ].map((r) => (
                        <tr key={r[0]}>
                          <td>{r[0]}</td>
                          <td>{r[1]}</td>
                          <td>${r[2].toLocaleString()}</td>
                          <td>
                            <Badge bg="success">{r[3]}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="mt-3">
            <Card.Body>
              <h6>Earnings</h6>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4>${totalIncome.toLocaleString()}</h4>
                  <small className="text-muted">Revenue</small>
                </div>
                <div style={{ width: 160, height: 80 }}>
                  <ResponsiveContainer width="100%" height={80}>
                    <AreaChart data={monthlySeries}>
                      <defs>
                        <linearGradient
                          id="colorUv"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#60a5fa"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#60a5fa"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" hide />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#60a5fa"
                        fillOpacity={1}
                        fill="url(#colorUv)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Lower content: Product overview and Orders / Comments */}
      <Row className="g-3 mt-3">
        <Col lg={8}>
          <Card>
            <Card.Body>
              <h5>Product overview</h5>
              <Table responsive striped hover className="mt-3 mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Product ID</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Sale</th>
                    <th>Revenue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProducts.map((p) => (
                    <tr key={formatId(p._id || p.id)}>
                      <td style={{ maxWidth: 320, wordBreak: "break-word" }}>
                        {p.name}
                      </td>
                      <td>{formatId(p._id || p.id)}</td>
                      <td>
                        {formatPriceWithCurrency(
                          p.price || 0,
                          p.priceCurrency || "USD",
                        )}
                      </td>
                      <td>{p.countInStock || 0}</td>
                      <td>
                        {Math.random() > 0.7
                          ? `${Math.floor(Math.random() * 50)}%`
                          : "-"}
                      </td>
                      <td>
                        {formatPriceWithCurrency(
                          Number(p.price || 0) * Number(p.countInStock || 0),
                          p.priceCurrency || "USD",
                        )}
                      </td>
                      <td>
                        {(p.countInStock || 0) > 0 ? "Active" : "Out of stock"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="d-flex justify-content-end mt-3">
                <Pagination>
                  <Pagination.Prev
                    disabled={productPage === 1}
                    onClick={() => setProductPage((s) => Math.max(1, s - 1))}
                  />
                  {Array.from({ length: totalProductPages }).map((_, i) => (
                    <Pagination.Item
                      key={i}
                      active={i + 1 === productPage}
                      onClick={() => setProductPage(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={productPage === totalProductPages}
                    onClick={() =>
                      setProductPage((s) => Math.min(totalProductPages, s + 1))
                    }
                  />
                </Pagination>
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Body>
              <h5>Orders</h5>
              <Table responsive size="sm" className="mt-3 mb-0">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Delivery date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 7).map((o) => {
                    const firstItem = (o.orderItems && o.orderItems[0]) || {};
                    return (
                      <tr key={formatId(o._id || o.id)}>
                        <td>{firstItem.name || "—"}</td>
                        <td>
                          {formatPriceWithCurrency(o.totalPrice || 0, "USD")}
                        </td>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Body>
              <h5>Earnings</h5>
              <div className="mt-3">
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="fw-semibold">Revenue</div>
                    <div>${totalIncome.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="fw-semibold">Profit</div>
                    <div>${(totalIncome * 0.72).toLocaleString()}</div>
                  </div>
                </div>

                <div style={{ width: "100%", height: 120 }} className="mt-3">
                  <ResponsiveContainer>
                    <LineChart data={monthlySeries}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Body>
              <h5>New Comments</h5>
              <ListGroup variant="flush" className="mt-3">
                {[
                  ["Kathryn Murphy", 5, "Great service!"],
                  ["Leslie Alexander", 4, "Fast delivery"],
                  ["Devon Lane", 3, "Product as described"],
                  ["Eleanor Pena", 5, "Excellent quality"],
                ].map((c) => (
                  <ListGroup.Item key={c[0]}>
                    <div className="d-flex justify-content-between">
                      <div>
                        <div className="fw-semibold">{c[0]}</div>
                        <small className="text-muted">{c[2]}</small>
                      </div>
                      <div className="text-end">
                        <div>⭐️ {c[1]}</div>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
