import { cn } from "@/lib/utils";
import { Trash2, GripVertical, Plus, X, Loader2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useTourPoints, useTourMutations } from "@/hooks";
import type { LangCode, Tour, TourPointDetailInline, TourStatus } from "@/types/api.types";
import SelectPOIModal from "./SelectPOIModal";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "react-toastify";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TourModalProps {
  tour?: Tour;
  onClose: () => void;
  onSaved?: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const LANG_OPTIONS: { code: LangCode; label: string }[] = [
  { code: "en", label: "ENGLISH (EN)" },
  { code: "vi", label: "TIẾNG VIỆT (VI)" },
  { code: "fr", label: "FRENCH (FR)" },
  { code: "zh", label: "CHINESE (ZH)" },
  { code: "ja", label: "JAPANESE (JA)" },
];

const STATUS_OPTIONS: { value: TourStatus; label: string; helper: string }[] = [
  { value: "draft", label: "Draft", helper: "Hidden from end-users" },
  { value: "published", label: "Published", helper: "Live for app users" },
];

// ─── Main Modal ────────────────────────────────────────────────────────────────

export default function TourModal({ tour, onClose, onSaved }: TourModalProps) {
  const tourId = tour?.id ?? null;
  const { points, isLoading, error, refetch, addPoint, removePoint, reorder } = useTourPoints(tourId);

  const { updateTour, isLoading: isSaving } = useTourMutations();

  const [name, setName] = useState(tour?.name ?? "");
  const [desc, setDesc] = useState(tour?.description ?? "");
  const [image, setImage] = useState<File | string | null>(tour?.image ?? null);
  const [status, setStatus] = useState<TourStatus>(tour?.status ?? "draft");
  const [langs, setLangs] = useState<LangCode[]>(["en"]);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showAddPoi, setShowAddPoi] = useState(false);
  const [orderedPoints, setOrderedPoints] = useState<TourPointDetailInline[]>([]);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const [hasReorderChanges, setHasReorderChanges] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    setName(tour?.name ?? "");
    setDesc(tour?.description ?? "");
    setStatus(tour?.status ?? "draft");
    setImage(tour?.image ?? null);
  }, [tour]);

  useEffect(() => {
    setOrderedPoints([...points].sort((a, b) => a.position - b.position));
    setHasReorderChanges(false);
  }, [points]);

  const toggleLang = (code: LangCode) => {
    setLangs((prev) => (prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]));
  };

  /**
   * Receives an array of real POI IDs from SelectPOIModal, then adds each to the tour.
   */
  const handleAddFromLibrary = useCallback(
    async (selectedIds: string[]) => {
      setShowAddPoi(false);
      if (!tourId || selectedIds.length === 0) return;
      const startingLength = orderedPoints.length;
      for (let i = 0; i < selectedIds.length; i++) {
        await addPoint({ poi_id: selectedIds[i], position: startingLength + i + 1 });
      }
      toast.success("Add points successfully");
      refetch();
    },
    [tourId, orderedPoints.length, addPoint, refetch],
  );

  const handleSave = async () => {
    if (!tourId) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name is required");
      return;
    }
    setNameError(null);

    const payload: { name: string; description?: string | null; status: TourStatus; image?: File | null } = {
      name: trimmed,
      description: desc ?? "",
      status,
    };

    if (image instanceof File) {
      payload.image = image;
    }

    const updated = await updateTour(tourId, payload);
    if (!updated) return;

    if (hasReorderChanges) {
      setIsReordering(true);
      const success = await reorder(
        orderedPoints.map((point, index) => ({
          poi_id: point.poi.id,
          position: index + 1,
        })),
      );
      setIsReordering(false);
      if (!success) {
        return;
      }
      setHasReorderChanges(false);
    }
    toast.success("Success");
    onSaved?.();
    onClose();
  };

  const now = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isBusy = isSaving || isReordering;

  const safeClose = () => {
    if (isBusy) return;
    onClose();
  };

  const handleRemovePoint = async (pointId: string) => {
    setOrderedPoints((prev) => prev.filter((p) => p.id !== pointId).map((p, index) => ({ ...p, position: index + 1 })));
    await removePoint(pointId);
    refetch();
  };

  const handleDragStart = (event: React.DragEvent, pointId: string) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", pointId);
    setDraggingPointId(pointId);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!draggingPointId || draggingPointId === targetId) return;
    setOrderedPoints((prev) => {
      const next = [...prev];
      const fromIdx = next.findIndex((p) => p.id === draggingPointId);
      const toIdx = next.findIndex((p) => p.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next.map((p, index) => ({ ...p, position: index + 1 }));
    });
    setHasReorderChanges(true);
    setDraggingPointId(null);
  };

  const handleDragEnd = () => {
    setDraggingPointId(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={safeClose} />

        {/* Modal */}
        <div className="relative bg-[#F5F7FA] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-white px-8 py-6 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#1a2b6b]">
                  {tourId ? "Edit Tour Journey" : "New Tour Journey"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Configure sequence, metadata, and localization for this narrative.
                </p>
              </div>
              <button
                onClick={safeClose}
                disabled={isBusy}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors mt-0.5 disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* ── Left panel ── */}
            <div className="w-full md:w-[42%] bg-white p-8 overflow-y-auto border-r border-gray-100 space-y-6">
              {/* Tour name */}
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">
                  Tour Narrative Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prague Old Town Mysteries"
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50",
                    nameError ? "border-red-400" : "border-gray-200",
                  )}
                />
                {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">
                  Description
                </label>
                <textarea
                  value={desc ?? ""}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={10}
                  placeholder="Brief description of the tour…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 resize-none"
                />
              </div>

              {/* Status selector */}
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">
                  Publication Status
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STATUS_OPTIONS.map((option) => {
                    const active = status === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStatus(option.value)}
                        className={cn(
                          "text-left p-3 rounded-xl border transition-colors",
                          active
                            ? "border-blue-500 bg-blue-50 text-blue-800"
                            : "border-gray-200 bg-white text-gray-600 hover:border-blue-200",
                        )}
                      >
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="text-[11px] text-gray-500 mt-1">{option.helper}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cover image */}
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">
                  Cover Image
                </label>
                <ImageUpload
                  value={image}
                  aspectRatio="aspect-[21/9]"
                  onChange={(file) => {
                    setImage(file);
                  }}
                  onRemove={() => {
                    setImage(null);
                  }}
                />
              </div>

              {/* Languages - Coming soon*/}
              {/* <div className="bg-[#EEF2FF] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m5 8 6 6" />
                    <path d="m4 14 6-6 2-3" />
                    <path d="M2 5h12" />
                    <path d="M7 2h1" />
                    <path d="m22 22-5-10-5 10" />
                    <path d="M14 18h6" />
                  </svg>
                  <span className="text-sm font-bold text-blue-700">Supported Languages</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {langs.map((code) => {
                    const opt = LANG_OPTIONS.find((l) => l.code === code)!;
                    return (
                      <span
                        key={code}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-[11px] font-bold tracking-wide text-blue-700"
                      >
                        {opt?.label ?? code.toUpperCase()}
                        <button onClick={() => toggleLang(code)} className="text-blue-400 hover:text-blue-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                  <div className="relative">
                    <button
                      onClick={() => setShowLangPicker(!showLangPicker)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-dashed border-blue-300 rounded-lg text-[11px] font-bold tracking-wide text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      ADD
                    </button>
                    {showLangPicker && (
                      <div className="absolute top-full mt-1.5 left-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 min-w-[180px]">
                        {LANG_OPTIONS.filter((l) => !langs.includes(l.code)).map((opt) => (
                          <button
                            key={opt.code}
                            onClick={() => {
                              toggleLang(opt.code);
                              setShowLangPicker(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-blue-600/80 mt-3 leading-relaxed">
                  All selected POIs must have finalized scripts in these languages before publishing.
                </p>
              </div> */}
            </div>

            {/* ── Right panel ── */}
            <div className="w-full md:flex-1 p-8 overflow-y-auto">
              {/* Header row */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                  Sequence of POIs ({orderedPoints.length})
                </p>
                <div className="flex items-center gap-3">
                  {(isLoading || isReordering) && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                  <button
                    onClick={() => refetch()}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <p className="text-sm text-red-500">Error: {error.message}</p>
              ) : orderedPoints.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                  No POIs in this tour yet. Use "Add POI from Library" to build your route.
                </div>
              ) : (
                <div className="space-y-3">
                  {orderedPoints.map((point, index) => (
                    <div
                      key={point.id}
                      className={cn(
                        "bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 p-3.5 group hover:shadow-md transition-shadow",
                        draggingPointId === point.id && "ring-2 ring-blue-200",
                      )}
                      onDragOver={handleDragOver}
                      onDrop={(event) => handleDrop(event, point.id)}
                    >
                      {/* Drag handle */}
                      <button
                        type="button"
                        className="cursor-grab text-gray-300 hover:text-gray-500 transition-colors"
                        draggable
                        onDragStart={(event) => handleDragStart(event, point.id)}
                        onDragEnd={handleDragEnd}
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-4 h-4" />
                      </button>

                      {/* Number badge */}
                      <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{String(index + 1).padStart(2, "0")}</span>
                      </div>

                      {/* POI image */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {point.poi.image ? (
                          <img src={point.poi.image} alt={point.poi.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-200 to-indigo-300" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{point.poi.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 font-medium uppercase tracking-wide">
                          {point.poi.type} • Position #{point.position}
                        </p>
                      </div>

                      {/* Reorder + delete */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRemovePoint(point.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from tour"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add POI button */}
              <button
                onClick={() => tourId && !isBusy && setShowAddPoi(true)}
                disabled={!tourId || isBusy}
                className={cn(
                  "mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed text-sm font-semibold transition-all",
                  tourId && !isBusy
                    ? "border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50"
                    : "border-gray-100 text-gray-300 cursor-not-allowed",
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    tourId && !isBusy ? "border-gray-400" : "border-gray-300",
                  )}
                >
                  <Plus className="w-3 h-3" />
                </div>
                Add POI from Library
              </button>
              {!tourId && <p className="mt-2 text-center text-xs text-gray-400">Save tour first to add POI points.</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white px-8 py-5 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              Last autosaved at {now} PM
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={safeClose}
                disabled={isBusy}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                disabled={isBusy}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                Save & Update Journey
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add POI sub-modal */}
      {showAddPoi && tourId && (
        <SelectPOIModal
          tourName={name || "this tour"}
          tourId={tourId}
          existingPoiIds={orderedPoints.map((p) => p.poi.id)}
          onDone={handleAddFromLibrary}
          onCancel={() => setShowAddPoi(false)}
        />
      )}
    </>
  );
}
