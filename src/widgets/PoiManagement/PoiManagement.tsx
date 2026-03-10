import React, { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import {
  Image as ImageIcon,
  Languages,
  MapPin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { POI, POIType, Tour } from "../../types";
import { getPoiIcon } from "../../lib/leafletIcons";
import { MapEvents } from "./MapEvents";
import { LanguageDialog } from "./LanguageDialog";

export function PoiManagement({
  pois,
  setPois,
  tours,
  setTours,
}: {
  pois: POI[];
  setPois: React.Dispatch<React.SetStateAction<POI[]>>;
  tours: Tour[];
  setTours: React.Dispatch<React.SetStateAction<Tour[]>>;
}) {
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [editingPoi, setEditingPoi] = useState<Partial<POI> | null>(null);
  const [mode, setMode] = useState<"new" | "edit">("new");
  const [gallerySearch, setGallerySearch] = useState("");
  const [isLangDialogOpen, setIsLangDialogOpen] = useState(false);

  const startNew = () => {
    setMode("new");
    setSelectedPoiId(null);
    setEditingPoi({
      radius: 50,
      type: POIType.MAIN,
      image: `https://picsum.photos/seed/${Math.random()}/400/300`,
    });
  };

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    if (editingPoi) {
      setEditingPoi({
        ...editingPoi,
        latitude: latlng.lat,
        longitude: latlng.lng,
      });
    } else {
      setMode("new");
      setEditingPoi({
        latitude: latlng.lat,
        longitude: latlng.lng,
        radius: 50,
        type: POIType.MAIN,
        image: `https://picsum.photos/seed/${Math.random()}/400/300`,
      });
      setSelectedPoiId(null);
    }
  };

  const handlePoiClick = (id: string) => {
    setMode("edit");
    setSelectedPoiId(id);
    const poi = pois.find((p) => p.id === id);
    if (poi) setEditingPoi(poi);
  };

  const filteredGalleryPois = useMemo(() => {
    const q = gallerySearch.trim().toLowerCase();
    if (!q) return pois;
    return pois.filter((p) =>
      p.localizedData["vi"].name.toLowerCase().includes(q),
    );
  }, [pois, gallerySearch]);

  const savePoi = (poiData: Partial<POI>) => {
    if (
      !poiData.localizedData["vi"].name ||
      !poiData.latitude ||
      !poiData.longitude ||
      !poiData.radius ||
      !poiData.type
    ) {
      alert("Vui lòng nhập tên và chọn vị trí trên bản đồ!");
      return;
    }
    if (
      poiData.latitude < 15.87 ||
      poiData.latitude > 15.885 ||
      poiData.longitude < 108.32 ||
      poiData.longitude > 108.34
    ) {
      alert(
        "Vui lòng nhập tên và chọn vị trí trên bản đồ! (Trong khu vực Hội An)",
      );
      return;
    }

    if (poiData.id) {
      setPois(pois.map((p) => (p.id === poiData.id ? (poiData as POI) : p)));
    } else {
      const newPoi = { ...poiData, id: uuidv4() } as POI;
      setPois([...pois, newPoi]);
      setSelectedPoiId(newPoi.id);
      setMode("edit");
    }
    setEditingPoi(null);
  };

  const deletePoi = (id: string) => {
    const toursUsingPoi = tours.filter((t) => t.poiIds.includes(id));
    if (toursUsingPoi.length > 0) {
      const confirm = window.confirm(
        `Điểm này đang được dùng trong ${toursUsingPoi.length} tours. Xóa?`,
      );
      if (!confirm) return;
    } else {
      const confirm = window.confirm("Xóa điểm này?");
      if (!confirm) return;
    }

    setPois(pois.filter((p) => p.id !== id));
    setTours(
      tours.map((t) => ({
        ...t,
        poiIds: t.poiIds.filter((pid) => pid !== id),
      })),
    );
    if (selectedPoiId === id) {
      setSelectedPoiId(null);
      setEditingPoi(null);
    }
  };

  const getPoiName = (poi: Partial<POI>) =>
    poi.localizedData?.["vi"]?.name || poi.localizedData?.["en"]?.name || "";
  const getPoiDesc = (poi: Partial<POI>) =>
    poi.localizedData?.["vi"]?.description?.text ||
    poi.localizedData?.["en"]?.description?.text ||
    "";

  const updateLocalizedData = (
    field: "name" | "description",
    value: string,
  ) => {
    if (!editingPoi) return;

    setEditingPoi({
      ...editingPoi,
      localizedData: {
        ...editingPoi.localizedData,
        // @ts-ignore
        ["vi"]: { [field]: value },
      },
    });
  };

  return (
    <div className="flex-1 flex h-full relative">
      <div className="flex-1 flex flex-col relative">
        {/* Map */}
        <div className="flex-1 relative bg-slate-200 max-h-[70vh]">
          <MapContainer
            center={[15.877, 108.327]}
            zoom={16}
            zoomControl={false}
            className="w-full h-full z-0 cursor-crosshair"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapEvents onMapClick={handleMapClick} />

            {pois.map((poi) => (
              <Marker
                key={poi.id}
                position={[poi.latitude, poi.longitude]}
                icon={getPoiIcon(poi.type, selectedPoiId === poi.id)}
                eventHandlers={{ click: () => handlePoiClick(poi.id) }}
              >
                {/* <Popup>{poi.localizedData["vi"].name}</Popup> */}
                <Popup className="rounded-xl overflow-hidden">
                  <div className="p-0 m-0 w-48">
                    <img
                      src={poi.image}
                      alt={poi.localizedData?.["vi"]?.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {poi.localizedData?.["vi"]?.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2 line-clamp-2">
                        {/* {poi.localizedData?.["vi"]?.description?.text} */}
                        Lorem Ipsum is simply dummy text of the printing and
                        typesetting industry. Lorem Ipsum has been the
                        industry's standard dummy text ever since the 1500s,
                        when an unknown printer took a galley of type and
                        scrambled it to make a type specimen book. It has
                        survived not only five centuries, but also the leap into
                        electronic typesetting, remaining essentially unchanged.
                        It was popularised in the 1960s with the release of
                        Letraset sheets containing Lorem Ipsum passages, and
                        more recently with desktop publishing software like
                        Aldus PageMaker including versions of Lorem Ipsum.
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {editingPoi &&
              !editingPoi.id &&
              editingPoi.latitude &&
              editingPoi.longitude && (
                <Marker
                  position={[editingPoi.latitude, editingPoi.longitude]}
                  icon={getPoiIcon(POIType.MAIN, true)}
                />
              )}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white p-3 rounded-xl shadow-md text-sm">
            <div className="font-bold text-slate-700 mb-2">Legend</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div> Major POI
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div> Minor
              POI
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div> Selected
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="h-56 bg-white border-t border-slate-200 shrink-0 p-4 overflow-x-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
                placeholder="Search POIs..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
              />
            </div>
            <button
              onClick={startNew}
              className="shrink-0 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
          {pois.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <MapPin className="w-8 h-8 mb-2 opacity-50" />
              <p>Chưa có điểm tham quan nào</p>
              <button
                onClick={startNew}
                className="text-emerald-600 font-medium mt-2 hover:underline"
              >
                Tạo điểm đầu tiên
              </button>
            </div>
          ) : (
            <div className="flex gap-4 h-full">
              {filteredGalleryPois.map((poi) => (
                <div
                  key={poi.id}
                  onClick={() => handlePoiClick(poi.id)}
                  className={`w-64 shrink-0 bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group ${
                    selectedPoiId === poi.id
                      ? "border-emerald-500 ring-1 ring-emerald-500"
                      : "border-slate-200"
                  }`}
                >
                  <div className="h-24 bg-slate-100 relative">
                    <img
                      src={poi.image}
                      alt={poi.localizedData?.["vi"]?.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                      {poi.type}
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-slate-800 text-sm truncate">
                      {poi.localizedData?.["vi"]?.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Bán kính: {poi.radius}m
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePoi(poi.id);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Form */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-lg z-10 max-h-[100vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-bold text-lg text-slate-800">
              {mode === "edit" ? "Edit location" : "New location"}
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={startNew}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                  mode === "new"
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                NEW
              </button>
              <button
                onClick={() => {
                  if (!selectedPoiId) return;
                  setMode("edit");
                  const poi = pois.find((p) => p.id === selectedPoiId);
                  if (poi) setEditingPoi(poi);
                }}
                disabled={!selectedPoiId}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                  mode === "edit"
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                EDIT
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {mode === "edit"
              ? "Chọn POI trong gallery / click marker để chỉnh sửa."
              : "Nhập thông tin rồi click bản đồ để chọn vị trí."}
          </p>
        </div>

        <div className="p-4 space-y-6">
          {/* Location Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              1. Vị trí (Location)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={editingPoi?.latitude || ""}
                  onChange={(e) =>
                    setEditingPoi({
                      ...editingPoi,
                      latitude: parseFloat(e.target.value),
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="15.877000"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={editingPoi?.longitude || ""}
                  onChange={(e) =>
                    setEditingPoi({
                      ...editingPoi,
                      longitude: parseFloat(e.target.value),
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="108.327000"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Radius (m)
                </label>
                <input
                  type="number"
                  value={editingPoi?.radius || 50}
                  onChange={(e) =>
                    setEditingPoi({
                      ...editingPoi,
                      radius: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <p className="text-xs text-slate-400 italic">
                Click vào bản đồ hoặc nhập thủ công
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. Thông tin (Info)
              </h3>
              <button
                onClick={() => {
                  if (mode === "edit") {
                    setIsLangDialogOpen(true);
                  }
                }}
                className={`flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors ${
                  mode === "edit"
                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                Đa ngôn ngữ
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Tên điểm (Base: Tiếng Việt) *
                </label>
                <input
                  type="text"
                  value={editingPoi ? getPoiName(editingPoi) : ""}
                  onChange={(e) => updateLocalizedData("name", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Mô tả (Base: Tiếng Việt)
                </label>
                <textarea
                  value={editingPoi ? getPoiDesc(editingPoi) : ""}
                  onChange={(e) =>
                    updateLocalizedData("description", e.target.value)
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              3. Ảnh (Image)
            </h3>
            <div className="aspect-[4/3] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative overflow-hidden group">
              {editingPoi?.image ? (
                <>
                  <img
                    src={editingPoi.image}
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
                    Hover để nhập URL ảnh
                  </span>
                </>
              )}
              <input
                type="text"
                placeholder="Image URL"
                value={editingPoi?.image || ""}
                onChange={(e) =>
                  setEditingPoi({ ...editingPoi, image: e.target.value })
                }
                className="absolute bottom-3 left-3 right-3 px-3 py-2 bg-white/90 backdrop-blur text-sm rounded-lg border border-slate-200 outline-none opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* Type Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              4. Loại điểm (Type)
            </h3>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Phân loại (Category) *
              </label>
              <select
                value={editingPoi?.type || POIType.MAIN}
                onChange={(e) =>
                  setEditingPoi({
                    ...editingPoi,
                    type: e.target.value as POIType,
                  })
                }
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value={POIType.MAIN}>Điểm chính (MAIN)</option>
                <option value={POIType.WC}>WC</option>
                <option value={POIType.TICKET}>Bán vé (TICKET)</option>
                <option value={POIType.PARKING}>Gửi xe (PARKING)</option>
                <option value={POIType.BOAT}>Bến thuyền (BOAT)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2 mt-auto">
          <button
            onClick={() => setEditingPoi(null)}
            className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Đặt lại
          </button>
          <button
            onClick={() => savePoi(editingPoi || {})}
            disabled={mode === "edit" && !selectedPoiId}
            className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mode === "edit" ? "Cập nhật điểm" : "Tạo điểm"}
          </button>
        </div>
      </div>

      {editingPoi && mode === "edit" && (
        <LanguageDialog
          isOpen={isLangDialogOpen}
          onClose={() => setIsLangDialogOpen(false)}
          initialData={
            editingPoi.localizedData || {
              vi: { name: "", description: { text: "" } },
            }
          }
          onSave={(data) =>
            setEditingPoi({ ...editingPoi, localizedData: data })
          }
        />
      )}
    </div>
  );
}
