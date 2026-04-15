import { useMemo, useState } from "react";
import { Search, Plus, Filter, Edit2, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import POIModal from "../modals/EditPoiModal";
import AddPOIModal from "@/modals/CreatePoiModal";
import { usePOIList, usePOIMutations } from "@/hooks";
import type { POIType, POIStatus } from "@/types";

const poiTypeOptions: Array<{ value: POIType | ""; label: string }> = [
  { value: "", label: "All types" },
  { value: "museum", label: "Museum" },
  { value: "park", label: "Park" },
  { value: "food", label: "Food" },
  { value: "historical", label: "Historical" },
  { value: "other", label: "Other" },
];

const statusOptions: Array<{ value: POIStatus | ""; label: string }> = [
  { value: "", label: "All status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function POIManagement() {
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { pois, isLoading, error, params, setParams, totalPages, refetch } = usePOIList();
  const { deletePOI, isLoading: isMutating } = usePOIMutations({
    onSuccess: refetch,
  });

  const currentPage = params.page ?? 1;

  const filteredPois = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();
    return pois.filter((poi) => {
      const matchesSearch =
        !lowerSearch || poi.name.toLowerCase().includes(lowerSearch) || poi.slug.toLowerCase().includes(lowerSearch);
      return matchesSearch;
    });
  }, [pois, search]);

  const pageNumbers = useMemo(() => {
    if (!totalPages || totalPages <= 1) return [];
    const delta = 1;
    const range: number[] = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i);
    }
    if (range[0] > 1) range.unshift(1);
    if (range[range.length - 1] < totalPages) range.push(totalPages);
    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-surface">Points of Interest</h1>
          <p className="text-on-surface-variant mt-1">Manage all locations and their audio guides.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add New POI
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/20 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search POIs..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={params.type ?? ""}
              onChange={(e) => setParams({ type: e.target.value as POIType, page: 1 })}
              className="px-3 py-2 rounded-xl border border-outline-variant/50 text-sm"
            >
              {poiTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={params.status ?? ""}
              onChange={(e) => setParams({ status: e.target.value as POIStatus, page: 1 })}
              className="px-3 py-2 rounded-xl border border-outline-variant/50 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setParams({ page: 1 })}
              className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/50 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <Filter className="w-4 h-4" />
              Apply
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-14">
                  #
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-on-surface-variant">
                    Loading...
                  </td>
                </tr>
              ) : filteredPois.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-on-surface-variant">
                    No POIs found
                  </td>
                </tr>
              ) : (
                filteredPois.map((poi, index) => {
                  const rowNumber = (currentPage - 1) * (params.limit ?? 20) + index + 1;
                  return (
                    <tr key={poi.id} className="hover:bg-surface-container-low/50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{rowNumber}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-on-surface">{poi.name}</td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant capitalize">{poi.type}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-3 py-1 text-xs font-medium rounded-full",
                            poi.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                          )}
                        >
                          {poi.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{formatDate(poi.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedPoiId(poi.id);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePOI(poi.id)}
                            disabled={isMutating}
                            className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {error && <div className="p-4 text-error">Error: {error.message}</div>}

        <div className="p-4 border-t border-outline-variant/20 flex items-center justify-between text-sm text-on-surface-variant">
          <span>
            {filteredPois.length === 0
              ? "No entries"
              : `Showing ${(currentPage - 1) * (params.limit ?? 20) + 1}–${(currentPage - 1) * (params.limit ?? 20) + filteredPois.length} entries`}
          </span>

          {pageNumbers.length > 0 && (
            <div className="flex gap-1">
              <button
                onClick={() => setParams({ page: currentPage - 1 })}
                disabled={currentPage <= 1}
                className="px-3 py-1 rounded-lg border border-outline-variant/50 hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>

              {pageNumbers.map((page, i) => {
                const prevPage = pageNumbers[i - 1];
                const showEllipsis = prevPage !== undefined && page - prevPage > 1;
                return (
                  <span key={page} className="flex items-center gap-1">
                    {showEllipsis && <span className="px-2 py-1 text-on-surface-variant">…</span>}
                    <button
                      onClick={() => setParams({ page })}
                      className={cn(
                        "px-3 py-1 rounded-lg",
                        page === currentPage
                          ? "bg-primary text-on-primary"
                          : "border border-outline-variant/50 hover:bg-surface-container-low",
                      )}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}

              <button
                onClick={() => setParams({ page: currentPage + 1 })}
                disabled={currentPage >= (totalPages ?? 1)}
                className="px-3 py-1 rounded-lg border border-outline-variant/50 hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <POIModal poiId={selectedPoiId ?? undefined} onClose={() => setIsEditModalOpen(false)} onSaved={refetch} />
      )}

      {isAddModalOpen && <AddPOIModal onClose={() => setIsAddModalOpen(false)} onSaved={refetch} />}
    </div>
  );
}
