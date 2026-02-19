import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import UsersList from "./pages/UsersList";
import UserDetail from "./pages/UserDetail";
import ProductsList from "./pages/ProductsList";
import ProductForm from "./pages/ProductForm";
import OrdersList from "./pages/OrdersList";
import OrderDetail from "./pages/OrderDetail";
import Messages from "./pages/Messages";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";

const router = createBrowserRouter(
  [
    { path: "/login", element: <Login /> },
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: "/users",
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <UsersList />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: "/users/:id",
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <UserDetail />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: "/products",
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <ProductsList />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: "/products/new",
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <ProductForm />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: "/products/:id",
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <ProductForm />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: "/orders",
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <OrdersList />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: "/messages",
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <Messages />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: "/orders/:id",
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <OrderDetail />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    { path: "*", element: <Navigate to="/" replace /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  },
);

export default function App() {
  return <RouterProvider router={router} />;
}
