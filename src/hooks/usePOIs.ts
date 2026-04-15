import { useState, useEffect, useCallback, useRef } from "react";
import { poiAdminService, localizationService } from "../services/poi.service";
import type {
  POIDetail,
  AdminPOIListParams,
  CreatePOIRequest,
  UpdatePOIRequest,
  LocalizationResponse,
  LocalizationWriteRequest,
} from "../types/api.types";
import type { ApiError } from "../lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// usePOIList – fetch & filter admin POI list
// ─────────────────────────────────────────────────────────────────────────────

interface UsePOIListState {
  pois: POIDetail[];
  isLoading: boolean;
  error: ApiError | null;
  params: AdminPOIListParams;
  meta: {
    totalPage: number;
    total: number;
  };
}

/**
 * usePOIList
 *
 * Fetches the admin POI list. Re-fetches whenever filter params change.
 *
 * @example
 * const { pois, isLoading, setParams, refetch } = usePOIList();
 * setParams({ type: "museum", page: 2 });
 */
export function usePOIList(initialParams: AdminPOIListParams = {}) {
  const [state, setState] = useState<UsePOIListState>({
    pois: [],
    isLoading: false,
    error: null,
    params: { page: 1, limit: 5, ...initialParams },
    meta: {
      total: 0,
      totalPage: 0,
    },
  });

  const fetch = useCallback(async (params: AdminPOIListParams) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const response = await poiAdminService.list(params);
      const pois = response.data.results;
      const meta = {
        total: response.data.total,
        totalPage: response.data.totalPage,
      };
      setState((s) => ({
        ...s,
        pois,
        isLoading: false,
        meta,
      }));
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false, error: err as ApiError }));
    }
  }, []);

  useEffect(() => {
    fetch(state.params);
  }, [state.params, fetch]);

  const setParams = useCallback((next: Partial<AdminPOIListParams>) => {
    setState((s) => ({ ...s, params: { ...s.params, ...next } }));
  }, []);

  return {
    totalPages: state.meta.totalPage,
    pois: state.pois,
    isLoading: state.isLoading,
    error: state.error,
    params: state.params,
    setParams,
    refetch: () => fetch(state.params),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// usePOIDetail – single POI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * usePOIDetail
 *
 * Fetches a single admin POI by ID.
 *
 * @example
 * const { poi, isLoading } = usePOIDetail("abc-123");
 */
export function usePOIDetail(id: string | null) {
  const [poi, setPOI] = useState<POIDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    poiAdminService
      .getById(id)
      .then((response) => {
        if (!cancelled) setPOI(response.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { poi, isLoading, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// usePOIMutations – create, update, delete
// ─────────────────────────────────────────────────────────────────────────────

/**
 * usePOIMutations
 *
 * Returns imperative mutation functions for POI CRUD.
 * Pass `onSuccess` callback to refresh the list after mutations.
 *
 * @example
 * const { createPOI, updatePOI, deletePOI, isLoading } = usePOIMutations({
 *   onSuccess: refetch,
 * });
 */
export function usePOIMutations({
  onSuccess,
  onError,
}: { onSuccess?: () => void; onError?: (err: ApiError) => void } = {}) {
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
        onError?.(err as ApiError);
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
    createPOI: (payload: CreatePOIRequest) => run(() => poiAdminService.create(payload)),
    updatePOI: (id: string, payload: UpdatePOIRequest) => run(() => poiAdminService.update(id, payload)),
    deletePOI: (id: string) => run(() => poiAdminService.delete(id)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useLocalizations – per-POI language management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useLocalizations
 *
 * Manages all localizations for a given POI.
 *
 * @example
 * const { localizations, upsert, remove } = useLocalizations("poi-id");
 */
export function useLocalizations(poiId: string | null) {
  const [localizations, setLocalizations] = useState<LocalizationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetch = useCallback(async () => {
    if (!poiId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await localizationService.list(poiId);
      setLocalizations(response.data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [poiId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const upsert = useCallback(
    async (payload: LocalizationWriteRequest) => {
      if (!poiId) return null;
      setIsLoading(true);
      try {
        const updated = await localizationService.upsert(poiId, payload);
        await fetch();
        return updated;
      } catch (err) {
        setError(err as ApiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [poiId, fetch],
  );

  const remove = useCallback(
    async (langCode: string) => {
      if (!poiId) return;
      setIsLoading(true);
      try {
        await localizationService.delete(poiId, langCode);
        setLocalizations((prev) => prev.filter((l) => l.lang_code !== langCode));
      } catch (err) {
        setError(err as ApiError);
      } finally {
        setIsLoading(false);
      }
    },
    [poiId],
  );

  return { localizations, isLoading, error, refetch: fetch, upsert, remove };
}
