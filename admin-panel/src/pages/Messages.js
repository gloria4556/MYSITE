import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { Link } from "react-router-dom";

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState(null);

  const fetchPage = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/messages/?page=${p}&page_size=20`);
      const data = res.data || {};
      setMessages(data.results || []);
      setCount(data.count || 0);
      setPage(data.current_page || p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, []);

  const openMsg = async (m) => {
    try {
      const id = m._id || m.id || m.pk;
      const res = await api.get(`/api/messages/${id}/`);
      setSelected(res.data);
      // mark read on open
      if (!res.data.is_read) {
        await api.patch(`/api/messages/${id}/`, { is_read: true });
        fetchPage(page);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const reply = async (replyText) => {
    if (!selected) return;
    try {
      const id = selected._id || selected.id || selected.pk;
      const res = await api.patch(`/api/messages/${id}/`, {
        admin_reply: replyText,
        is_read: true,
      });
      setSelected(res.data);
      fetchPage(page);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-page messages-page">
      <div className="page-header d-flex justify-content-between align-items-center">
        <h3>Messages</h3>
        <div className="text-muted">Total: {count}</div>
      </div>

      <div className="messages-grid d-flex gap-3 mt-3">
        <div className="messages-list" style={{ flex: 1 }}>
          {loading ? (
            <div>Loading…</div>
          ) : (
            <ul className="list-group">
              {messages.map((m) => (
                <li
                  key={m._id || m.id}
                  className={`list-group-item ${m.is_read ? "" : "unread"}`}
                >
                  <a
                    href="#open"
                    onClick={(e) => {
                      e.preventDefault();
                      openMsg(m);
                    }}
                  >
                    <strong>
                      {m.subject || (m.message || "").slice(0, 40)}
                    </strong>
                    <div className="small text-muted">
                      {m.email || (m.user && m.user.email) || "anonymous"} ·{" "}
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="messages-detail" style={{ flex: 2 }}>
          {selected ? (
            <div className="card p-3">
              <h5>{selected.subject || "Message"}</h5>
              <div className="text-muted small">
                From:{" "}
                {selected.email ||
                  (selected.user && selected.user.email) ||
                  "anonymous"}
              </div>
              <hr />
              <div style={{ whiteSpace: "pre-wrap" }}>{selected.message}</div>
              <hr />
              <div className="admin-reply">
                <ReplyForm
                  initial={selected.admin_reply || ""}
                  onReply={reply}
                />
              </div>
            </div>
          ) : (
            <div className="text-muted">Select a message to view</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReplyForm({ initial, onReply }) {
  const [val, setVal] = useState(initial || "");
  const [saving, setSaving] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await onReply(val);
        setSaving(false);
      }}
    >
      <div className="mb-2">
        <label className="form-label small">Admin reply</label>
        <textarea
          className="form-control"
          rows={4}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      </div>
      <div className="d-flex justify-content-end">
        <Link to="/messages" className="btn btn-sm btn-secondary me-2">
          Close
        </Link>
        <button
          className="btn btn-primary btn-sm"
          type="submit"
          disabled={saving}
        >
          {saving ? "Saving..." : "Send reply"}
        </button>
      </div>
    </form>
  );
}
