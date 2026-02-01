import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Ensures the CRM theme variables apply to Radix portals (Select/Dialog/etc.)
 * by attaching the `admin-theme` class to the document root when on /admin routes.
 */
export default function AdminThemeClassManager() {
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const isAdminRoute = location.pathname.startsWith("/admin");

    if (isAdminRoute) root.classList.add("admin-theme");
    else root.classList.remove("admin-theme");

    return () => {
      root.classList.remove("admin-theme");
    };
  }, [location.pathname]);

  return null;
}
