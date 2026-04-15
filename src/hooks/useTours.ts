import { useState, useEffect, useCallback } from "react";
import { tourAdminService, tourPointService } from "../services/tour.service";
import type {
  Tour,
  TourPointDetailInline,
  TourPointInput,
  CreateTourRequest,
  UpdateTourRequest,
  AddTourPointRequest,
  UpdateTourPointRequest,
  PaginationParams,
} from "../types/api.types";
import type { ApiError } from "../lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// useTourList
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useTourList
 *
 * Fetches the admin tour list. Re-fetches when pagination params change.
 *
 * @example
 * const { tours, setParams, refetch } = useTourList();
 */
export function useTourList(initialParams: PaginationParams = {}) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [params, setParamsState] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    ...initialParams,
  });
  const [totalData, setTotalData] = useState({
    total: 0,
    totalPage: 0,
  });

  const fetch = useCallback(async (p: PaginationParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tourAdminService.list(p);
      setTours(response.data.results);
      setTotalData({
        total: response.data.total,
        totalPage: response.data.totalPage,
      });
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(params);
  }, [params, fetch]);

  const setParams = useCallback((next: Partial<PaginationParams>) => {
    setParamsState((prev) => ({ ...prev, ...next }));
  }, []);

  return {
    totalData,
    tours,
    isLoading,
    error,
    params,
    setParams,
    refetch: () => fetch(params),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useTourMutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useTourMutations
 *
 * Imperative create / update / delete for tours.
 *
 * @example
 * const { createTour, deleteTour } = useTourMutations({ onSuccess: refetch });
 */
export function useTourMutations({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const run = useCallback(
    async <T>(fn: () => Promise<any>): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fn();
        onSuccess?.();
        // Extract data from ApiResponse wrapper
        return result.data || result;
      } catch (err) {
        setError(err as ApiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess],
  );

  return {
    isLoading,
    error,
    createTour: (payload: CreateTourRequest) => run<Tour>(() => tourAdminService.create(payload)),
    updateTour: (id: string, payload: UpdateTourRequest) => run<Tour>(() => tourAdminService.update(id, payload)),
    deleteTour: (id: string) => run(() => tourAdminService.delete(id)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useTourPoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useTourPoints
 *
 * Loads and manages the ordered POI list for a tour.
 * Exposes add / reorder / remove operations that optimistically keep local
 * state in sync, then re-fetch to confirm.
 *
 * Points are typed as `TourPointDetailInline` – each item carries the
 * server-assigned point `id` (used for delete), its `position`, and the
 * embedded `poi` object.
 *
 * @example
 * const { points, addPoint, reorder, removePoint } = useTourPoints("tour-id");
 */
export function useTourPoints(tourId: string | null) {
  const [points, setPoints] = useState<TourPointDetailInline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetch = useCallback(async () => {
    if (!tourId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = (await tourPointService.list(tourId)).data;
      // Sort by position to guarantee UI ordering
      setPoints([...data].sort((a, b) => a.position - b.position));
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addPoint = useCallback(
    async (payload: AddTourPointRequest): Promise<TourPointDetailInline | null> => {
      if (!tourId) return null;
      setIsLoading(true);
      try {
        const point = (await tourPointService.add(tourId, payload)).data;
        await fetch();
        return point;
      } catch (err) {
        setError(err as ApiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [tourId, fetch],
  );

  /**
   * Reorder tour points. Accepts an array of `{ poi_id, position }` items
   * (`TourPointInput[]` / `UpdateTourPointRequest[]`).
   */
  const reorder = useCallback(
    async (payload: UpdateTourPointRequest[]): Promise<boolean> => {
      if (!tourId) return false;
      setIsLoading(true);
      try {
        await tourPointService.reorder(tourId, payload);
        await fetch();
        return true;
      } catch (err) {
        setError(err as ApiError);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [tourId, fetch],
  );

  /**
   * Remove a tour point by its server-assigned point `id`
   * (i.e. `TourPointDetailInline.id`, NOT `poi.id`).
   */
  const removePoint = useCallback(
    async (pointId: string): Promise<boolean> => {
      if (!tourId) return false;
      // Optimistic update – filter by the tour-point record id
      setPoints((prev) => prev.filter((p) => p.id !== pointId));
      try {
        await tourPointService.remove(tourId, pointId);
        return true;
      } catch (err) {
        setError(err as ApiError);
        await fetch(); // rollback on error
        return false;
      }
    },
    [tourId, fetch],
  );

  return {
    points,
    isLoading,
    error,
    refetch: fetch,
    addPoint,
    reorder,
    removePoint,
  };
}

// Re-export TourPointInput for callers that build reorder payloads
export type { TourPointInput };
