import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, MapPin, Route, Wallet, TrendingUp, Activity, Trophy, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { adminDashboardService } from "@/services";
import type {
  AdminActiveUsersPoint,
  AdminDashboardOverview,
  AdminRevenuePoint,
  AdminTopPoi,
  AdminTopTour,
  AdminVisitsPoint,
  DateRangeParams,
} from "@/types/api.types";
import type { ApiError } from "@/lib/api";
import { toast } from "react-toastify";

type RangePreset = "7d" | "30d" | "90d";

const RANGE_OPTIONS: Array<{ value: RangePreset; label: string; days: number }> = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
];

const formatNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const formatCurrency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function Dashboard() {
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [visits, setVisits] = useState<AdminVisitsPoint[]>([]);
  const [revenue, setRevenue] = useState<AdminRevenuePoint[]>([]);
  const [topPois, setTopPois] = useState<AdminTopPoi[]>([]);
  const [topTours, setTopTours] = useState<AdminTopTour[]>([]);
  const [activeUsers, setActiveUsers] = useState<AdminActiveUsersPoint[]>([]);
  const [rangePreset, setRangePreset] = useState<RangePreset>("30d");
  const [isLoading, setIsLoading] = useState(false);

  const dateParams = useMemo<DateRangeParams>(() => buildRange(rangePreset), [rangePreset]);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [overviewRes, visitsRes, revenueRes, poisRes, toursRes, activeUsersRes] = await Promise.all([
        adminDashboardService.getOverview(dateParams),
        adminDashboardService.getVisits(dateParams),
        adminDashboardService.getRevenue(dateParams),
        adminDashboardService.getTopPois({ ...dateParams, limit: 5 }),
        adminDashboardService.getTopTours({ ...dateParams, limit: 5 }),
        adminDashboardService.getActiveUsers(dateParams),
      ]);

      setOverview(overviewRes);
      setVisits(visitsRes);
      setRevenue(revenueRes);
      setTopPois(poisRes);
      setTopTours(toursRes);
      setActiveUsers(activeUsersRes);
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.message ?? "Không thể tải dữ liệu dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [dateParams]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const statCards = [
    {
      title: "Total Users",
      icon: Users,
      value: overview ? formatNumber.format(overview.totalUsers) : "–",
      description: "Nguời dùng đã đăng ký",
    },
    {
      title: "Total POIs",
      icon: MapPin,
      value: overview ? formatNumber.format(overview.totalPois) : "–",
      description: "Điểm tham quan đang quản lý",
    },
    {
      title: "Total Visits",
      icon: Activity,
      value: overview ? formatNumber.format(overview.totalVisits) : "–",
      description: "Lượt scan/visit",
    },
    {
      title: "Revenue",
      icon: Wallet,
      value: overview ? formatCurrency.format(overview.totalRevenue) : "–",
      description: "Doanh thu đã thu",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-surface">Admin Analytics</h1>
          <p className="text-on-surface-variant mt-1">Realtime insight for admin & operations.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <label className="text-xs uppercase tracking-wide text-on-surface-variant">Date range</label>
          <select
            value={rangePreset}
            onChange={(event) => setRangePreset(event.target.value as RangePreset)}
            className="bg-surface-container-low border border-outline-variant/40 rounded-2xl px-4 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none min-w-[150px]"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} isLoading={isLoading && !overview} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Visits over time" description="Daily POI visits" isLoading={isLoading}>
          <AnalyticsAreaChart
            data={visits.map((item) => ({ date: item.date, visits: item.visits }))}
            areaKey="visits"
            color="#2563eb"
            gradientId="visitsGradient"
            emptyMessage="No visits recorded in this range"
          />
        </ChartCard>
        <ChartCard title="Revenue over time" description="Total revenue (VND)" isLoading={isLoading}>
          <AnalyticsAreaChart
            data={revenue.map((item) => ({ date: item.date, value: item.revenue }))}
            areaKey="value"
            color="#16a34a"
            gradientId="revenueGradient"
            formatter={(value) => formatCurrency.format(value as number)}
            emptyMessage="No revenue data"
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCard title="Daily active users" description="Unique users scanning" isLoading={isLoading}>
          <AnalyticsAreaChart
            data={activeUsers.map((item) => ({ date: item.date, value: item.users }))}
            areaKey="value"
            color="#8b5cf6"
            gradientId="usersGradient"
            emptyMessage="No users tracked"
          />
        </ChartCard>

        <ListCard
          title="Top POIs"
          icon={TrendingUp}
          items={topPois.map((poi) => ({
            id: poi.poiId,
            name: poi.name,
            metric: `${formatNumber.format(poi.visits)} visits`,
          }))}
          placeholder="No POIs in this period"
          isLoading={isLoading}
        />

        <ListCard
          title="Top Tours"
          icon={Trophy}
          items={topTours.map((tour) => ({
            id: tour.tourId,
            name: tour.name,
            metric: `${formatNumber.format(tour.starts)} starts`,
          }))}
          placeholder="No tours have traffic"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-success text-sm font-medium bg-success/10 px-3 py-1 rounded-full">
          <TrendingUp className="w-4 h-4" />
          <span>Live</span>
        </div>
      </div>
      <div>
        <p className="text-sm text-on-surface-variant">{title}</p>
        {isLoading ? (
          <div className="w-32 h-9 bg-outline-variant/20 rounded-xl mt-2 animate-pulse" />
        ) : (
          <p className="text-3xl font-display font-bold text-on-surface mt-1">{value}</p>
        )}
        {description && <p className="text-xs text-on-surface-variant mt-3">{description}</p>}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
  isLoading,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-on-surface">{title}</h2>
          {description && <p className="text-sm text-on-surface-variant">{description}</p>}
        </div>
        {isLoading && <Clock className="w-5 h-5 text-outline animate-spin" />}
      </div>
      <div className="h-[280px]">{children}</div>
    </div>
  );
}

function AnalyticsAreaChart({
  data,
  areaKey,
  color,
  gradientId,
  emptyMessage,
  formatter,
}: {
  data: Array<Record<string, number | string>>;
  areaKey: string;
  color: string;
  gradientId: string;
  emptyMessage: string;
  formatter?: (value: number | string) => string;
}) {
  if (!data.length) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 20, left: 20, bottom: 0 }} // 👈 FIX CHÍNH
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* X Axis */}
        <XAxis dataKey="date" stroke="#72777f" fontSize={12} tickLine={false} axisLine={false} tickMargin={8} />

        {/* Y Axis */}
        <YAxis
          stroke="#72777f"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={60} // 👈 QUAN TRỌNG
          tickMargin={10} // 👈 TRÁNH ĐÈ LABEL
          tickFormatter={(value) => formatAxisTick(value, formatter)}
        />

        {/* Grid */}
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e3e5" />

        {/* Tooltip */}
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
          formatter={(value) => formatAxisTick(value as number, formatter)}
          labelFormatter={(label) => new Date(label).toLocaleDateString("vi-VN")}
        />

        {/* Area */}
        <Area
          type="monotone"
          dataKey={areaKey}
          stroke={color}
          strokeWidth={2} // 👈 giảm nhẹ cho gọn
          fillOpacity={1}
          fill={`url(#${gradientId})`}
          dot={false} // 👈 đỡ rối
          activeDot={{ r: 4 }} // 👈 hover đẹp hơn
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ListCard({
  title,
  icon: Icon,
  items,
  placeholder,
  isLoading,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Array<{ id: string; name: string; metric: string }>;
  placeholder: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-display font-semibold text-on-surface">{title}</h2>
          <p className="text-xs text-on-surface-variant uppercase tracking-wide">Updated live</p>
        </div>
      </div>
      {isLoading && !items.length ? (
        <div className="flex-1 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 bg-outline-variant/20 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length ? (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-outline-variant/20 p-4"
            >
              <div>
                <p className="text-sm text-on-surface-variant">#{index + 1}</p>
                <p className="text-on-surface font-medium">{item.name}</p>
              </div>
              <span className="text-sm font-semibold text-on-surface">{item.metric}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState message={placeholder} />
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center text-on-surface-variant border border-dashed border-outline-variant/30 rounded-3xl">
      <p className="text-sm">{message}</p>
    </div>
  );
}

function buildRange(preset: RangePreset): DateRangeParams {
  const option = RANGE_OPTIONS.find((item) => item.value === preset) ?? RANGE_OPTIONS[1];
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (option.days - 1));

  return {
    from: formatDate(from),
    to: formatDate(to),
  };
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatAxisTick(value: number | string, formatter?: (value: number | string) => string) {
  if (formatter) {
    return formatter(value);
  }
  if (typeof value === "number") {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}k`;
    }
  }
  return typeof value === "number" ? formatNumber.format(value) : String(value);
}
