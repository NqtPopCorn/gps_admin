import { Search, Bell, MapPin, LogOut, BarChart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

interface TopNavProps {
  hideSearch?: boolean;
}

export function TopNav({ hideSearch }: TopNavProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const isPartner = user?.role === "partner";
  const subtitle = useMemo(() => {
    if (!user?.role) return "admin";
    if (user.role === "partner") return "partner";
    return user.role;
  }, [user?.role]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="h-16 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between px-8 sticky top-0 z-10">
      {!isPartner && !hideSearch && (
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
            <input
              type="text"
              placeholder="Search POIs, tours, or languages..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      )}
      {isPartner && (
        <div className="flex items-center gap-3 text-on-surface-variant">
          <MapPin className="w-5 h-5" />
          <span className="text-sm">Partner Dashboard</span>
        </div>
      )}
      {!isPartner && hideSearch && (
        <div className="flex items-center gap-3 text-on-surface-variant">
          <BarChart className="w-5 h-5" />
          <span className="text-sm">Analytics</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        {!isPartner ? (
          <>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-surface-container-lowest"></span>
            </button>
            <div className="h-8 w-px bg-outline-variant/30 mx-2"></div>
          </>
        ) : (
          <div className="text-sm text-on-surface-variant">Poi Credit: {user?.poi_credits ?? 0}</div>
        )}
        <div className="flex items-center gap-3 p-1 pr-3 bg-surface-container-lowest rounded-full">
          <div className="w-8 h-8 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center font-medium text-sm">
            {user?.email?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-on-surface leading-none">{user?.email ?? "Admin User"}</p>
            <p className="text-xs text-on-surface-variant mt-1">{subtitle}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="text-on-surface-variant hover:text-error transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
