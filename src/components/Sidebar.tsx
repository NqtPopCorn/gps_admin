import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, MapPin, Route, Languages, Settings, LogOut } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export interface SidebarNavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

const defaultNavItems: SidebarNavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: MapPin, label: "Points of Interest", path: "/pois" },
  { icon: Route, label: "Tours", path: "/tours" },
  { icon: Languages, label: "Languages", path: "/languages" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarProps {
  navItems?: SidebarNavItem[];
  brandLabel?: string;
}

export function Sidebar({ navItems = defaultNavItems, brandLabel = "AudioGuide Admin" }: SidebarProps) {
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <MapPin className="w-5 h-5 text-on-primary" />
        </div>
        <span className="font-display font-bold text-lg text-on-surface">{brandLabel}</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium",
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-outline-variant/30">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
