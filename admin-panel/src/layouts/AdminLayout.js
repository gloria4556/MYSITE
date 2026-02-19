import React from "react";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main">
        <AdminHeader />
        <div className="container py-4">{children}</div>
      </div>
    </div>
  );
}
