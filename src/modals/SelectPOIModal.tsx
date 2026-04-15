import { cn } from "@/lib/utils";
import type { POIDetail, POIType, POIStatus } from "@/types/api.types";
import { usePOIList } from "@/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search, X, Plus, Check, MapPin } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// ─── Zod schema ────────────────────────────────────────────────────────────────

const schema = z.object({
  selectedIds: z.array(z.string()).min(1, "Please select at least one POI to add."),
});

type SelectPOIFormValues = z.infer<typeof schema>;

// ─── Constants ─────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  museum: "bg-purple-100 text-purple-700",
  park: "bg-emerald-100 text-emerald-700",
  food: "bg-orange-100 text-orange-700",
  drink: "bg-amber-100 text-amber-700",
  historical: "bg-rose-100 text-rose-700",
  other: "bg-gray-100 text-gray-700",
};

const TYPE_OPTIONS: { value: POIType | ""; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "museum", label: "Museum" },
  { value: "park", label: "Park" },
  { value: "food", label: "Food" },
  { value: "drink", label: "Drink" },
  { value: "historical", label: "Historical" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS: { value: POIStatus | ""; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// ─── Props ─────────────────────────────────────────────────────────────────────

interface SelectPOIModalProps {
  tourName: string;
  tourId: string;
  /** POI IDs already present in the tour – these cards are shown as already-added */
  existingPoiIds?: string[];
  onDone: (selectedIds: string[]) => void;
  onCancel: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SelectPOIModal({
  tourName,
  tourId: _tourId,
  existingPoiIds = [],
  onDone,
  onCancel,
}: SelectPOIModalProps) {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<POIType | "">("");
  const [statusFilter, setStatusFilter] = useState<POIStatus | "">("");

  // ── Real API data ─────────────────────────────────────────────────────────
  const { pois, isLoading, error } = usePOIList({
    limit: 100,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });

  // ── react-hook-form ───────────────────────────────────────────────────────
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SelectPOIFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { selectedIds: [] },
  });

  const selectedIds = watch("selectedIds");

  // ── Helpers ───────────────────────────────────────────────────────────────

  const filtered = pois.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
  });

  const isSelected = (id: string) => selectedIds.includes(id);
  const isExisting = (id: string) => existingPoiIds.includes(id);

  const toggle = (id: string) => {
    if (isExisting(id)) return; // cannot re-add existing
    const next = isSelected(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    setValue("selectedIds", next, { shouldValidate: true });
  };

  const onSubmit = (data: SelectPOIFormValues) => {
    onDone(data.selectedIds);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-7 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add POI to Tour</h2>
              <p className="text-sm text-gray-500 mt-1">Select points of interest to curate your "{tourName}" route.</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search + filters */}
          <div className="flex flex-wrap items-center gap-3 mt-5">
            {/* Search */}
            <div className="flex-1 min-w-[180px] relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or slug…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50"
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as POIType | "")}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as POIStatus | "")}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-7 pb-2">
          {isLoading ? (
            /* Loading skeleton */
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-transparent shadow-sm animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-3 bg-white space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Failed to load POIs</p>
              <p className="text-xs text-gray-400 mt-1">{error.message}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No POIs found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((poi: POIDetail) => {
                const selected = isSelected(poi.id);
                const existing = isExisting(poi.id);
                return (
                  <PoiCard
                    key={poi.id}
                    poi={poi}
                    isSelected={selected}
                    isExisting={existing}
                    onToggle={() => toggle(poi.id)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Validation error */}
        {errors.selectedIds && (
          <p className="px-7 pt-2 text-xs font-medium text-red-500">{errors.selectedIds.message}</p>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium">
              {selectedIds.length} POI{selectedIds.length !== 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="px-6 py-2.5 text-sm font-semibold bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedIds.length === 0}
            >
              Add to Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── POI Card ──────────────────────────────────────────────────────────────────

interface PoiCardProps {
  poi: POIDetail;
  isSelected: boolean;
  isExisting: boolean;
  onToggle: () => void;
}

function PoiCard({ poi, isSelected, isExisting, onToggle }: PoiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden border-2 transition-all",
        isExisting
          ? "border-transparent opacity-50 cursor-not-allowed"
          : isSelected
            ? "border-blue-600 shadow-md"
            : "border-transparent shadow-sm hover:shadow-md cursor-pointer",
      )}
      onClick={!isExisting ? onToggle : undefined}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {poi.image ? (
          <img src={poi.image} alt={poi.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-blue-300" />
          </div>
        )}
        {/* Type badge */}
        <span
          className={cn(
            "absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
            TYPE_COLOR[poi.type] ?? TYPE_COLOR.other,
          )}
        >
          {poi.type}
        </span>
        {/* Already added badge */}
        {isExisting && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="px-2 py-1 bg-gray-700 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
              Already Added
            </span>
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="p-3 flex items-start justify-between bg-white">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-sm font-semibold text-gray-900 leading-snug truncate">{poi.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate font-mono">{poi.slug}</p>
        </div>
        {!isExisting && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={cn(
              "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-blue-600 hover:text-white",
            )}
          >
            {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
