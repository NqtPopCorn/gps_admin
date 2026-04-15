import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, MapPin, Users, TrendingUp, Layers, ArrowUpRight, QrCode, Wallet } from "lucide-react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { BuyPoiCreditComponent } from "../components/BuyPoiCreditComponent";
import { Link } from "react-router-dom";
import type {
  DateRangeParams,
  PartnerDashboardOverview,
  PartnerPoiPerformance,
  PartnerVisitsPoint,
} from "@/types/api.types";
import { partnerDashboardService } from "@/services";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "react-toastify";
import type { ApiError } from "@/lib/api";

type RangePreset = "7d" | "30d";

const RANGE_OPTIONS: Array<{ value: RangePreset; label: string; days: number }> = [
  { value: "7d", label: "7 ngày qua", days: 7 },
  { value: "30d", label: "30 ngày qua", days: 30 },
];

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function PartnerDashboard() {
  // @ts-ignore
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID ?? "";

  const [overview, setOverview] = useState<PartnerDashboardOverview | null>(null);
  const [visits, setVisits] = useState<PartnerVisitsPoint[]>([]);
  const [poiPerformance, setPoiPerformance] = useState<PartnerPoiPerformance[]>([]);
  const [rangePreset, setRangePreset] = useState<RangePreset>("30d");
  const [isLoading, setIsLoading] = useState(false);

  const dateParams = useMemo<DateRangeParams>(() => buildRange(rangePreset), [rangePreset]);

  const loadPartnerDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [overviewRes, visitsRes, poiRes] = await Promise.all([
        partnerDashboardService.getOverview(dateParams),
        partnerDashboardService.getVisits(dateParams),
        partnerDashboardService.getPoiPerformance(dateParams),
      ]);

      setOverview(overviewRes);
      setVisits(visitsRes);
      setPoiPerformance(poiRes);
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.message ?? "Không thể tải dữ liệu đối tác");
    } finally {
      setIsLoading(false);
    }
  }, [dateParams]);

  useEffect(() => {
    void loadPartnerDashboard();
  }, [loadPartnerDashboard]);

  const stats = [
    {
      label: "Tổng lượt ghé",
      value: overview ? numberFormat.format(overview.totalVisits) : "–",
      icon: Activity,
      description: "Tổng lượt khách quét QR",
    },
    {
      label: "Người dùng unique",
      value: overview ? numberFormat.format(overview.uniqueUsers) : "–",
      icon: Users,
      description: "Độc nhất theo tài khoản",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Partner Dashboard</h1>
            <p className="text-on-surface-variant">Theo dõi hiệu suất POI bạn đang sở hữu</p>
          </div>
        </div>
        <select
          className="bg-surface-container-low border border-outline-variant/40 rounded-2xl px-4 py-2 text-sm"
          value={rangePreset}
          onChange={(event) => setRangePreset(event.target.value as RangePreset)}
        >
          {RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat) => (
          <PartnerStat
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            description={stat.description}
            isLoading={isLoading && !overview}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {visits.length ? (
          <PartnerChart title="Visits" description="Daily visits" className="lg:col-span-2" isLoading={isLoading}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={visits.map((item) => ({ date: item.date, visits: item.visits }))}
                margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="partnerVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#72777f" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#72777f"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => numberFormat.format(Number(value))}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e3e5" />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                  formatter={(value) => numberFormat.format(Number(value))}
                  labelFormatter={(label) => new Date(label).toLocaleDateString("vi-VN")}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#partnerVisits)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </PartnerChart>
        ) : (
          <EmptyState message="Chưa có lượt ghé trong giai đoạn này" />
        )}

        <PartnerChart title="Top POIs" description="Theo lượt ghé" isLoading={isLoading}>
          {poiPerformance.length ? (
            <ul className="space-y-3">
              {poiPerformance.map((poi, index) => (
                <li
                  key={poi.poiId}
                  className="flex items-center justify-between rounded-2xl border border-outline-variant/20 p-4"
                >
                  <div>
                    <p className="text-sm text-on-surface-variant">#{index + 1}</p>
                    <p className="text-on-surface font-semibold">{poi.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-success text-sm font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    {numberFormat.format(poi.visits)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Không có dữ liệu POI" />
          )}
        </PartnerChart>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Mua lượt tạo POI</h2>
              <p className="text-sm text-on-surface-variant">Thanh toán qua PayPal – xử lý tức thì</p>
            </div>
          </div>
          <PayPalScriptProvider options={{ clientId: paypalClientId, "client-id": paypalClientId, currency: "USD" }}>
            <BuyPoiCreditComponent />
          </PayPalScriptProvider>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-1">Tải QR Code cho POI</h2>
              <p className="text-on-surface-variant text-sm">Quản lý và tải mã QR cho từng POI để in hoặc chia sẻ.</p>
            </div>
          </div>
          <Link
            to="/qr-codes"
            className="px-5 py-2 rounded-2xl bg-primary text-white font-semibold shadow hover:bg-primary/90 inline-flex items-center gap-2"
          >
            Đến QR Management <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function PartnerStat({
  label,
  value,
  icon: Icon,
  description,
  isLoading,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-on-surface-variant">{label}</p>
        {isLoading ? (
          <div className="w-32 h-8 bg-outline-variant/20 rounded-xl mt-2 animate-pulse" />
        ) : (
          <p className="text-2xl font-display font-semibold text-on-surface mt-1">{value}</p>
        )}
        {description && <p className="text-xs text-on-surface-variant mt-2">{description}</p>}
      </div>
    </div>
  );
}

function PartnerChart({
  title,
  description,
  children,
  className,
  isLoading,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-6 shadow-sm h-full flex flex-col ${className ?? ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-display font-semibold text-on-surface">{title}</h2>
          {description && <p className="text-sm text-on-surface-variant">{description}</p>}
        </div>
        {isLoading && <Layers className="w-5 h-5 text-outline animate-spin" />}
      </div>
      <div className="flex-1 min-h-[240px]">{children}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center text-on-surface-variant text-sm border border-dashed border-outline-variant/30 rounded-3xl">
      {message}
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
