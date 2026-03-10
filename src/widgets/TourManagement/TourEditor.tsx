import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Image as ImageIcon,
  MapPin,
  Search,
  X,
} from "lucide-react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";

import { POI, POIType, Tour } from "../../types";
import { getPoiIcon } from "../../lib/leafletIcons";

export function TourEditor({
  tour,
  setTour,
  pois,
  onSave,
  onCancel,
}: {
  tour: Tour;
  setTour: React.Dispatch<React.SetStateAction<Tour | null>>;
  pois: POI[];
  onSave: (t: Tour) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "MAIN" | "SUB">("ALL");

  // Resizable sidebars (left POI list + right editor)
  const LEFT_MIN = 260;
  const LEFT_MAX = 520;
  const RIGHT_MIN = 320;
  const RIGHT_MAX = 720;
  const SPLITTER_W = 8;
  const CENTER_MIN = 320;
  const LS_LEFT_KEY = "tourEditor.leftSidebarWidth";
  const LS_RIGHT_KEY = "tourEditor.rightSidebarWidth";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [leftW, setLeftW] = useState<number>(() => {
    const v = Number(localStorage.getItem(LS_LEFT_KEY));
    return Number.isFinite(v) && v > 0 ? v : 320;
  });
  const [rightW, setRightW] = useState<number>(() => {
    const v = Number(localStorage.getItem(LS_RIGHT_KEY));
    return Number.isFinite(v) && v > 0 ? v : 400;
  });
  const [dragging, setDragging] = useState<null | "left" | "right">(null);

  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));

  const computeLimits = () => {
    const el = containerRef.current;
    const width = el?.getBoundingClientRect().width ?? 0;
    const leftMax = Math.min(
      LEFT_MAX,
      Math.max(LEFT_MIN, width - rightW - CENTER_MIN - SPLITTER_W * 2),
    );
    const rightMax = Math.min(
      RIGHT_MAX,
      Math.max(RIGHT_MIN, width - leftW - CENTER_MIN - SPLITTER_W * 2),
    );
    return { leftMax, rightMax };
  };

  useEffect(() => {
    localStorage.setItem(LS_LEFT_KEY, String(leftW));
  }, [leftW]);

  useEffect(() => {
    localStorage.setItem(LS_RIGHT_KEY, String(rightW));
  }, [rightW]);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const { leftMax, rightMax } = computeLimits();

      if (dragging === "left") {
        const raw = e.clientX - rect.left;
        setLeftW(clamp(raw, LEFT_MIN, leftMax));
      } else if (dragging === "right") {
        const raw = rect.right - e.clientX;
        setRightW(clamp(raw, RIGHT_MIN, rightMax));
      }
    };

    const stop = () => setDragging(null);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [dragging]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const sync = () => {
      const { leftMax, rightMax } = computeLimits();
      setLeftW((w) => clamp(w, LEFT_MIN, leftMax));
      setRightW((w) => clamp(w, RIGHT_MIN, rightMax));
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const filteredPois = useMemo(() => {
    return pois.filter((p) => {
      const matchesSearch = p.localizedData["vi"].name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter =
        filter === "ALL" ||
        (filter === "MAIN" && p.type === POIType.MAIN) ||
        (filter === "SUB" && p.type !== POIType.MAIN);
      return matchesSearch && matchesFilter;
    });
  }, [pois, search, filter]);

  const togglePoi = (poiId: string) => {
    if (tour.poiIds.includes(poiId)) {
      setTour({ ...tour, poiIds: tour.poiIds.filter((id) => id !== poiId) });
    } else {
      setTour({ ...tour, poiIds: [...tour.poiIds, poiId] });
    }
  };

  const movePoi = (index: number, direction: number) => {
    if (index + direction < 0 || index + direction >= tour.poiIds.length)
      return;
    const newIds = [...tour.poiIds];
    const temp = newIds[index];
    newIds[index] = newIds[index + direction];
    newIds[index + direction] = temp;
    setTour({ ...tour, poiIds: newIds });
  };

  const handleSave = () => {
    if (!tour.name.trim()) {
      alert("Vui lòng nhập tên tour và chọn ít nhất một điểm!");
      return;
    }
    if (tour.poiIds.length === 0) {
      alert("Vui lòng nhập tên tour và chọn ít nhất một điểm!");
      return;
    }
    onSave(tour);
  };

  const tourPositions = tour.poiIds
    .map((id) => pois.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => [p!.latitude, p!.longitude] as [number, number]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 h-full bg-slate-50 overflow-hidden ${dragging ? "select-none cursor-col-resize" : ""}`}
      style={{
        display: "grid",
        gridTemplateColumns: `${leftW}px ${SPLITTER_W}px 1fr ${SPLITTER_W}px ${rightW}px`,
      }}
    >
      {/* Left Sidebar - POI Selection */}
      <div className="bg-white border-r border-slate-200 flex flex-col shadow-sm z-10 min-w-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-lg text-slate-800">Điểm tham quan</h2>
          <p className="text-sm text-slate-500">Chọn điểm để thêm vào tour</p>
        </div>

        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm điểm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("ALL")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === "ALL" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter("MAIN")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === "MAIN" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Điểm chính
            </button>
            <button
              onClick={() => setFilter("SUB")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === "SUB" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Điểm phụ
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredPois.map((poi) => {
            const isSelected = tour.poiIds.includes(poi.id);
            return (
              <div
                key={poi.id}
                onClick={() => togglePoi(poi.id)}
                className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-emerald-50 border border-emerald-200" : "hover:bg-slate-50 border border-transparent"}`}
              >
                <img
                  src={poi.image}
                  alt=""
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
                <div className="ml-3 flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800 truncate">
                    {poi.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {poi.type}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Splitter - Left */}
      <div
        role="separator"
        aria-label="Resize left sidebar"
        aria-orientation="vertical"
        onPointerDown={(e) => {
          e.preventDefault();
          setDragging("left");
        }}
        className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-col-resize flex items-center justify-center"
        style={{ width: SPLITTER_W }}
      >
        <div className="w-[2px] h-10 bg-slate-300 rounded-full" />
      </div>

      {/* Middle - Map Area */}
      <div className="relative bg-slate-200 z-0 min-w-0">
        <MapContainer
          center={[15.877, 108.327]}
          zoom={16}
          zoomControl={false}
          className="w-full h-full z-0"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {filteredPois.map((poi) => {
            const isSelected = tour.poiIds.includes(poi.id);
            const orderIndex = tour.poiIds.indexOf(poi.id);
            return (
              <Marker
                key={poi.id}
                position={[poi.latitude, poi.longitude]}
                icon={getPoiIcon(poi.type, isSelected)}
                eventHandlers={{ click: () => togglePoi(poi.id) }}
              >
                <Popup>
                  <div className="font-medium">{poi.name}</div>
                  {isSelected && (
                    <div className="text-xs text-emerald-600 font-bold mt-1">
                      Điểm số {orderIndex + 1}
                    </div>
                  )}
                </Popup>
              </Marker>
            );
          })}

          {tourPositions.length > 1 && (
            <Polyline
              positions={tourPositions}
              color="#10B981"
              weight={4}
              opacity={0.8}
              dashArray="10, 10"
            />
          )}
        </MapContainer>
      </div>

      {/* Splitter - Right */}
      <div
        role="separator"
        aria-label="Resize right sidebar"
        aria-orientation="vertical"
        onPointerDown={(e) => {
          e.preventDefault();
          setDragging("right");
        }}
        className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-col-resize flex items-center justify-center"
        style={{ width: SPLITTER_W }}
      >
        <div className="w-[2px] h-10 bg-slate-300 rounded-full" />
      </div>

      {/* Right Main Area - Tour Editor */}
      <div className="bg-white border-l border-slate-200 flex flex-col shadow-sm z-10 min-w-0 overflow-y-auto">
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div>
            <h1 className="font-bold text-lg text-slate-800">
              {tour.name ? "Chỉnh sửa Tour" : "Tạo Tour mới"}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
            >
              Lưu
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Banner Section */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-3">
                Ảnh bìa tour
              </h3>
              <div className="aspect-[21/9] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative overflow-hidden group">
                {tour.image ? (
                  <>
                    <img
                      src={tour.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-medium bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                        Thay đổi ảnh
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-500 font-medium">
                      Click để chọn ảnh bìa
                    </span>
                  </>
                )}
                <input
                  type="text"
                  placeholder="Image URL"
                  value={tour.image || ""}
                  onChange={(e) => setTour({ ...tour, image: e.target.value })}
                  className="absolute bottom-3 left-3 right-3 px-3 py-2 bg-white/90 backdrop-blur text-sm rounded-lg border border-slate-200 outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>

            {/* Info Section */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Tên tour *
                </label>
                <input
                  type="text"
                  value={tour.name}
                  onChange={(e) => setTour({ ...tour, name: e.target.value })}
                  placeholder="Nhập tên tour..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors text-sm"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Mô tả ngắn
                </label>
                <textarea
                  value={tour.description || ""}
                  onChange={(e) =>
                    setTour({ ...tour, description: e.target.value })
                  }
                  placeholder="Mô tả hành trình..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors resize-none text-sm"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Thời lượng (phút)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    value={tour.duration}
                    onChange={(e) =>
                      setTour({
                        ...tour,
                        duration: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors text-sm"
                    min={0}
                    max={1440}
                  />
                </div>
              </div>
            </div>

            {/* Route Section */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Lộ trình tham quan
                </h3>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                  {tour.poiIds.length} điểm
                </span>
              </div>

              {tour.poiIds.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 text-center">
                  <MapPin className="w-6 h-6 mb-2 opacity-30" />
                  <p className="text-xs font-medium">
                    Hành trình chưa có điểm nào. Chọn từ danh sách bên trái hoặc
                    click trên bản đồ.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tour.poiIds.map((poiId, index) => {
                    const poi = pois.find((p) => p.id === poiId);
                    if (!poi) return null;
                    return (
                      <div
                        key={`${poiId}-${index}`}
                        className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-2 group"
                      >
                        <div className="flex flex-col gap-0.5 mr-2">
                          <button
                            onClick={() => movePoi(index, -1)}
                            disabled={index === 0}
                            className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => movePoi(index, 1)}
                            disabled={index === tour.poiIds.length - 1}
                            className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mr-3">
                          {index + 1}
                        </div>
                        <div className="flex-1 font-medium text-slate-800 text-sm truncate">
                          {poi.localizedData["vi"].name}
                        </div>
                        <button
                          onClick={() =>
                            setTour({
                              ...tour,
                              poiIds: tour.poiIds.filter((_, i) => i !== index),
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
