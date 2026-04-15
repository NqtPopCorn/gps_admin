import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Route,
  ImageOff,
} from "lucide-react";
import TourModal from "@/modals/TourModal";
import { useTourList, useTourMutations } from "@/hooks";
import type { Tour, TourStatus } from "@/types";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

type SortKey = "name" | "point_count" | "status" | "created_at";
type SortDir = "asc" | "desc" | null;

interface SortState {
  key: SortKey | null;
  dir: SortDir;
}

const STATUS_OPTIONS: { label: string; value: TourStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TourThumbnail({ image, name }: { image: string | null; name: string }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-outline-variant/20"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl shrink-0 bg-primary-container flex items-center justify-center border border-outline-variant/20">
      <Route className="w-5 h-5 text-on-primary-container" />
    </div>
  );
}

function StatusBadge({ status }: { status?: TourStatus }) {
  const s = status ?? "draft";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        s === "published" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", s === "published" ? "bg-success" : "bg-warning")} />
      {s === "published" ? "Published" : "Draft"}
    </span>
  );
}

interface SortIconProps {
  col: SortKey;
  sort: SortState;
}
function SortIcon({ col, sort }: SortIconProps) {
  if (sort.key !== col) return <ChevronsUpDown className="w-3.5 h-3.5 text-outline/50 shrink-0" />;
  if (sort.dir === "asc") return <ChevronUp className="w-3.5 h-3.5 text-primary shrink-0" />;
  return <ChevronDown className="w-3.5 h-3.5 text-primary shrink-0" />;
}

interface ThProps {
  label: string;
  col: SortKey;
  sort: SortState;
  onSort: (col: SortKey) => void;
  className?: string;
}
function Th({ label, col, sort, onSort, className }: ThProps) {
  return (
    <th className={cn("px-4 py-4", className)}>
      <button
        onClick={() => onSort(col)}
        className={cn(
          "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors select-none",
          sort.key === col ? "text-primary" : "text-on-surface-variant hover:text-on-surface",
        )}
      >
        {label}
        <SortIcon col={col} sort={sort} />
      </button>
    </th>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TourManagement() {
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TourStatus | "all">("all");
  const [sort, setSort] = useState<SortState>({ key: "created_at", dir: "desc" });

  const { tours, isLoading, error, refetch, setParams, params, totalData } = useTourList();
  const { createTour, deleteTour, isLoading: isMutating } = useTourMutations({ onSuccess: refetch });

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleCreateTour = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const newTour = await createTour({ name: "New Tour", description: "" });
      if (newTour) {
        setSelectedTour(newTour);
        setIsModalOpen(true);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSort = (col: SortKey) => {
    setSort((prev) => {
      if (prev.key !== col) return { key: col, dir: "asc" };
      if (prev.dir === "asc") return { key: col, dir: "desc" };
      return { key: null, dir: null };
    });
  };

  // ── derived data ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tours.filter((t) => {
      const matchesSearch =
        !term || t.name.toLowerCase().includes(term) || (t.description ?? "").toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || (t.status ?? "draft") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tours, search, statusFilter]);

  const sorted = useMemo(() => {
    if (!sort.key || !sort.dir) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sort.key) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "point_count":
          aVal = a.point_count;
          bVal = b.point_count;
          break;
        case "status":
          aVal = a.status ?? "draft";
          bVal = b.status ?? "draft";
          break;
        case "created_at":
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
      }

      if (aVal < bVal) return sort.dir === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sort]);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-surface">Tours</h1>
          <p className="text-on-surface-variant mt-1">Create and manage guided routes.</p>
        </div>
        <button
          onClick={handleCreateTour}
          disabled={isCreating}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          {isCreating ? "Creating…" : "Create New Tour"}
        </button>
      </div>

      {/* Table card */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/20 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-5 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search tours…"
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl shrink-0">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  statusFilter === opt.value
                    ? "bg-surface-container-lowest text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/40">
                {/* Image col – not sortable */}
                <th className="px-4 py-4 w-16" />
                <Th label="Tour Name" col="name" sort={sort} onSort={handleSort} />
                <th className="px-4 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">
                  Description
                </th>
                <Th label="Status" col="status" sort={sort} onSort={handleSort} />
                <Th label="Points" col="point_count" sort={sort} onSort={handleSort} className="hidden sm:table-cell" />
                <Th label="Created" col="created_at" sort={sort} onSort={handleSort} className="hidden lg:table-cell" />
                <th className="px-4 py-4 text-right text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                      <ImageOff className="w-8 h-8 opacity-40" />
                      <span className="text-sm">No tours match your filters</span>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((tour) => (
                  <tr key={tour.id} className="hover:bg-surface-container-low/50 transition-colors group">
                    {/* Thumbnail */}
                    <td className="pl-4 pr-2 py-3">
                      <TourThumbnail image={tour.image} name={tour.name} />
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-on-surface line-clamp-1">{tour.name}</span>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3 text-sm text-on-surface-variant hidden md:table-cell max-w-xs">
                      <span className="line-clamp-1">{tour.description ?? "—"}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={tour.status} />
                    </td>

                    {/* Points */}
                    <td className="px-4 py-3 text-sm text-on-surface-variant hidden sm:table-cell">
                      <span className="tabular-nums font-medium">{tour.point_count}</span>
                      <span className="text-xs text-outline ml-1">POIs</span>
                    </td>

                    {/* Created at */}
                    <td className="px-4 py-3 text-sm text-on-surface-variant hidden lg:table-cell tabular-nums whitespace-nowrap">
                      {formatDate(tour.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedTour(tour);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTour(tour.id)}
                          disabled={isMutating}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-6 py-3 bg-error/5 text-error text-sm border-t border-error/10">{error.message}</div>
        )}

        {/* Footer / pagination */}
        {(() => {
          const currentPage = params.page ?? 1;
          const limit = params.limit ?? 10;
          const { total, totalPage } = totalData;

          // Range of items currently visible (after client-side filter/sort)
          const rangeStart = total === 0 ? 0 : (currentPage - 1) * limit + 1;
          const rangeEnd = Math.min(currentPage * limit, total);

          // Compact page number list with ellipsis
          const pageNumbers: (number | "…")[] = (() => {
            if (totalPage <= 7) return Array.from({ length: totalPage }, (_, i) => i + 1);
            const list: (number | "…")[] = [1];
            if (currentPage > 3) list.push("…");
            for (let n = Math.max(2, currentPage - 1); n <= Math.min(totalPage - 1, currentPage + 1); n++) {
              list.push(n);
            }
            if (currentPage < totalPage - 2) list.push("…");
            if (totalPage > 1) list.push(totalPage);
            return list;
          })();

          return (
            <div className="px-5 py-3.5 border-t border-outline-variant/20 flex items-center justify-between gap-4 text-sm text-on-surface-variant">
              {/* Left: range info */}
              <span>
                {total === 0 ? (
                  "No tours found"
                ) : (
                  <>
                    <span className="font-semibold text-on-surface tabular-nums">
                      {rangeStart}–{rangeEnd}
                    </span>{" "}
                    of <span className="font-semibold text-on-surface tabular-nums">{total}</span> tours
                  </>
                )}
              </span>

              {/* Right: page controls */}
              {totalPage > 1 && (
                <div className="flex items-center gap-1">
                  {/* Prev */}
                  <button
                    onClick={() => setParams({ page: currentPage - 1 })}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg border border-outline-variant/50 hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page numbers */}
                  {pageNumbers.map((n, i) =>
                    n === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-outline select-none">
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setParams({ page: n as number })}
                        className={cn(
                          "min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition-colors",
                          n === currentPage
                            ? "bg-primary text-on-primary"
                            : "border border-outline-variant/50 hover:bg-surface-container-low text-on-surface-variant",
                        )}
                      >
                        {n}
                      </button>
                    ),
                  )}

                  {/* Next */}
                  <button
                    onClick={() => setParams({ page: currentPage + 1 })}
                    disabled={currentPage >= totalPage}
                    className="p-1.5 rounded-lg border border-outline-variant/50 hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <TourModal
          tour={selectedTour ?? undefined}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTour(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
