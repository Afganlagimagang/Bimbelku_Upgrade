import { Navigate, Outlet } from "react-router-dom";

export default function GuestPackageRoute() {
  const token = localStorage.getItem("token");
  if (!token) return <Outlet />;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null") as { role?: string } | null;
    if (user?.role === "student") return <Outlet />;
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    if (user?.role === "teacher") return <Navigate to="/guru" replace />;
  } catch {
    // A malformed browser cache does not grant access to an authenticated route.
  }
  return <Navigate to="/login" replace />;
}
