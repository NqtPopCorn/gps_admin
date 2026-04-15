import { useMemo, useState, useEffect, useCallback } from "react";
import { Loader2, MapPin, QrCode, Search, Copy, Check, Route, RefreshCw, Timer, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { usePOIList, useTourList } from "../hooks";
import type { POIDetail, Tour } from "../types";
import { buildPoiUrl, buildTourUrl, buildQrDownloadFilename, tourQRService, type TourQRData } from "../services";
const QR_SIZE = 256;

// ─── Skeletons ─────────────────────────────────────────────────────────────────

function QRSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 animate-pulse">
      <div className="w-[256px] h-[256px] bg-surface-container-highest rounded-3xl" />
      <div className="w-40 h-10 bg-surface-container-highest rounded-2xl" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 bg-surface-container-highest rounded-2xl" />
      ))}
    </div>
  );
}

// ─── Helper: download QR canvas as PNG ────────────────────────────────────────

function downloadQRCanvas(canvasId: string, filename: string) {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ─── TAB 1 · Static POI QR ────────────────────────────────────────────────────

function POIQRTab() {
  const [search, setSearch] = useState("");
  const [selectedPoi, setSelectedPoi] = useState<POIDetail | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const { pois, isLoading } = usePOIList({ limit: 100 });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pois;
    return pois.filter((poi) => poi.name.toLowerCase().includes(q) || poi.slug.toLowerCase().includes(q));
  }, [pois, search]);

  const qrUrl = selectedPoi ? buildPoiUrl(selectedPoi) : "";
  const downloadName = selectedPoi ? buildQrDownloadFilename(selectedPoi) : "qr.png";

  const handleSelectPoi = (poi: POIDetail) => {
    if (selectedPoi?.id === poi.id) return;
    setQrLoading(true);
    setSelectedPoi(poi);
    setTimeout(() => setQrLoading(false), 400);
  };

  const handleCopyUrl = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-6 items-start animate-in fade-in duration-300">
      {/* Left: POI list */}
      <div className="w-[320px] shrink-0 bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc slug…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>
        <div className="overflow-y-auto p-4 space-y-2 max-h-[520px]">
          {isLoading ? (
            <ListSkeleton />
          ) : (
            filtered.map((poi) => (
              <button
                key={poi.id}
                onClick={() => handleSelectPoi(poi)}
                className={`group w-full flex items-center gap-3 text-left rounded-2xl border px-4 py-3.5 transition-all ${
                  selectedPoi?.id === poi.id
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-transparent bg-surface hover:bg-surface-container-low"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedPoi?.id === poi.id ? "bg-primary text-white" : "bg-surface-container text-outline"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold text-sm truncate ${
                      selectedPoi?.id === poi.id ? "text-primary" : "text-on-surface"
                    }`}
                  >
                    {poi.name}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5 truncate font-mono">{poi.slug}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: QR display */}
      <div className="flex-1 bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-on-surface-variant" />
          <span className="text-sm font-semibold text-on-surface">
            {selectedPoi ? selectedPoi.name : "Chưa chọn POI"}
          </span>
        </div>

        <div className="p-8 flex flex-col items-center justify-center min-h-[480px]">
          {!selectedPoi ? (
            <div className="text-center text-on-surface-variant/60">
              <MapPin className="w-12 h-12 mx-auto opacity-30 mb-3" />
              <p className="font-medium">Chọn một POI để xem QR Code</p>
            </div>
          ) : qrLoading ? (
            <QRSkeleton />
          ) : (
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
              {/* QR Code */}
              <div className="p-4 bg-white rounded-3xl shadow-lg border border-outline-variant/15">
                <QRCodeCanvas
                  id={`poi-qr-${selectedPoi.id}`}
                  value={qrUrl}
                  size={QR_SIZE}
                  marginSize={2}
                  imageSettings={{
                    src: "/favicon.ico",
                    height: 32,
                    width: 32,
                    excavate: true,
                  }}
                />
              </div>

              {/* URL chip */}
              <p className="text-xs font-mono text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-xl max-w-xs truncate">
                {qrUrl}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCopyUrl}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-outline-variant/40 bg-surface font-semibold text-sm hover:bg-surface-container-low transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Đã chép" : "Sao chép Link"}
                </button>

                <button
                  onClick={() => downloadQRCanvas(`poi-qr-${selectedPoi.id}`, downloadName)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Tải về
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2 · Dynamic Tour QR ──────────────────────────────────────────────────

const FALLBACK_TTL = 300;

function TourQRTab() {
  const [search, setSearch] = useState("");
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const { tours, isLoading } = useTourList({ limit: 100 });

  const [qrData, setQrData] = useState<TourQRData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tours.filter((t) => t.name.toLowerCase().includes(q));
  }, [tours, search]);

  // ── Fetch fresh QR data from real API ──────────────────────────────────────
  const fetchTourQR = useCallback(async (tourId: string) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await tourQRService.getQRData(tourId);
      setQrData(res.data);
      setTimeLeft(res.data.expires_in ?? FALLBACK_TTL);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải mã QR";
      setError(msg);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const refreshTourQR = useCallback(async (tourId: string) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await tourQRService.refresh(tourId, FALLBACK_TTL);
      setQrData(res.data);
      setTimeLeft(res.data.expires_in ?? FALLBACK_TTL);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải mã QR";
      setError(msg);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ── Countdown timer + auto-refresh ────────────────────────────────────────
  useEffect(() => {
    if (!selectedTour || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchTourQR(selectedTour.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [selectedTour, timeLeft, fetchTourQR]);

  const handleSelectTour = (tour: Tour) => {
    if (selectedTour?.id === tour.id) return;
    setSelectedTour(tour);
    setQrData(null);
    setTimeLeft(0);
    fetchTourQR(tour.id);
  };

  const handleForceRefresh = () => {
    if (selectedTour) refreshTourQR(selectedTour.id);
  };

  const tourUrl = selectedTour ? buildTourUrl(selectedTour) : "";
  // Value embedded in the QR: the tour deep-link with the activation code appended
  const qrValue = qrData ? `${tourUrl}?code=${qrData.code}` : "";
  const maxTtl = qrData?.expires_in ?? FALLBACK_TTL;
  const progressPct = maxTtl > 0 ? (timeLeft / maxTtl) * 100 : 0;
  const isExpiring = timeLeft <= 5 && timeLeft > 0;

  return (
    <div className="flex gap-6 items-start animate-in fade-in duration-300">
      {/* Left: Tour list */}
      <div className="w-[320px] shrink-0 bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên Tour…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
        <div className="overflow-y-auto p-4 space-y-2 max-h-[520px]">
          {isLoading ? (
            <ListSkeleton />
          ) : (
            filtered.map((tour) => (
              <button
                key={tour.id}
                onClick={() => handleSelectTour(tour)}
                className={`group w-full flex items-center gap-3 text-left rounded-2xl border px-4 py-3.5 transition-all ${
                  selectedTour?.id === tour.id
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-transparent bg-surface hover:bg-surface-container-low"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedTour?.id === tour.id ? "bg-primary text-white" : "bg-surface-container text-outline"
                  }`}
                >
                  <Route className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold text-sm truncate ${
                      selectedTour?.id === tour.id ? "text-primary" : "text-on-surface"
                    }`}
                  >
                    {tour.name}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{tour.point_count} POIs</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Dynamic QR display */}
      <div className="flex-1 bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <span className="text-sm font-semibold text-on-surface">
            {selectedTour ? selectedTour.name : "Chưa chọn Tour"}
          </span>
          {qrData && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                isExpiring ? "bg-error/10 text-error animate-pulse" : "bg-success/10 text-success"
              }`}
            >
              {isExpiring ? "Sắp hết hạn" : "Active Code"}
            </span>
          )}
        </div>

        <div className="p-8 flex flex-col items-center justify-center min-h-[480px]">
          {!selectedTour ? (
            <div className="text-center text-on-surface-variant/60">
              <Route className="w-12 h-12 mx-auto opacity-30 mb-3" />
              <p className="font-medium">Chọn một Tour để quản lý QR Kích hoạt</p>
            </div>
          ) : error ? (
            <div className="text-center space-y-4">
              <p className="text-error text-sm font-medium">{error}</p>
              <button
                onClick={handleForceRefresh}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-outline-variant/40 text-sm font-semibold hover:bg-surface-container-low transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Thử lại
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-300">
              {/* Countdown progress bar */}
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-1.5 text-on-surface-variant">
                    <Timer className="w-4 h-4" />
                    Làm mới sau
                  </span>
                  <span className={isExpiring ? "text-error font-bold" : "text-primary"}>{timeLeft}s</span>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                      isExpiring ? "bg-error" : "bg-primary"
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* QR Code area */}
              <div className="relative flex justify-center">
                <div
                  className={`p-4 bg-white rounded-3xl shadow-lg border border-outline-variant/15 transition-all duration-300 ${
                    isRefreshing ? "opacity-40 scale-95" : "opacity-100 scale-100"
                  }`}
                >
                  {qrData ? (
                    <QRCodeCanvas id={`tour-qr-${selectedTour.id}`} value={qrValue} size={QR_SIZE} marginSize={2} />
                  ) : (
                    /* Placeholder before first fetch resolves */
                    <div className="w-[256px] h-[256px] bg-surface-container-highest rounded-2xl animate-pulse" />
                  )}
                </div>

                {isRefreshing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </div>
                )}
              </div>

              {/* Active code chip */}
              {qrData && (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs text-on-surface-variant">Mã kích hoạt</p>
                  <p className="text-2xl font-mono font-bold tracking-[0.25em] text-on-surface bg-surface-container-low px-6 py-2 rounded-2xl border border-outline-variant/30">
                    {qrData.code}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="w-full flex gap-3">
                <button
                  onClick={handleForceRefresh}
                  disabled={isRefreshing}
                  className="flex-1 inline-flex justify-center items-center gap-2 px-5 py-3 rounded-2xl border border-outline-variant/40 hover:bg-surface-container-low font-semibold text-sm transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Tạo mã mới ngay
                </button>

                {qrData && (
                  <button
                    onClick={() => downloadQRCanvas(`tour-qr-${selectedTour.id}`, `tour-qr-${qrData.code}.png`)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Tải về
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function QRManagement() {
  const [activeTab, setActiveTab] = useState<"poi" | "tour">("poi");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-on-surface">Quản lý QR Code</h1>
            <p className="text-on-surface-variant mt-0.5 text-sm">
              Cung cấp mã QR tĩnh cho điểm đến và mã QR động kích hoạt Tour.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-surface-container-low rounded-xl w-fit border border-outline-variant/20">
          <button
            onClick={() => setActiveTab("poi")}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "poi"
                ? "bg-surface shadow-sm text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Static POI QR
          </button>
          <button
            onClick={() => setActiveTab("tour")}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "tour"
                ? "bg-surface shadow-sm text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Dynamic Tour QR
          </button>
        </div>
      </header>

      {activeTab === "poi" ? <POIQRTab /> : <TourQRTab />}
    </div>
  );
}

export default QRManagement;
