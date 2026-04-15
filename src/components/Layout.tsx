import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { ToastContainer } from "react-toastify";
import type { SidebarNavItem } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, MapPin, Route, Languages, Settings, QrCode } from "lucide-react";

const adminNavItems: SidebarNavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: MapPin, label: "Points of Interest", path: "/pois" },
  { icon: Route, label: "Tours", path: "/tours" },
  { icon: QrCode, label: "QR Codes", path: "/qr-codes" },
  // { icon: Languages, label: "Languages", path: "/languages" },
  // { icon: Settings, label: "Settings", path: "/settings" },
];

const partnerNavItems: SidebarNavItem[] = [
  { icon: LayoutDashboard, label: "Partner Overview", path: "/partner/dashboard" },
  { icon: MapPin, label: "Manage POIs", path: "/partner/pois" },
  { icon: Route, label: "Tours", path: "/partner/tours" },
  { icon: QrCode, label: "QR Codes", path: "/partner/qr-codes" },
];

export function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const isPartner = user?.role === "partner";
  const hideSearch = isPartner || location.pathname === "/";

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar
        navItems={isPartner ? partnerNavItems : adminNavItems}
        brandLabel={isPartner ? "Partner Portal" : undefined}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav hideSearch={hideSearch} />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
      <ToastContainer autoClose={3000} />
    </div>
  );
}
