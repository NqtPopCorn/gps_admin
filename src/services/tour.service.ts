import { get, post, put, del } from "../lib/api";
import type {
  Tour,
  TourDetail,
  TourPointDetailInline,
  TourPointInput,
  CreateTourRequest,
  UpdateTourRequest,
  AddTourPointRequest,
  UpdateTourPointRequest,
  PaginationParams,
  LangCode,
  ApiResponse,
  PaginatedResponse,
} from "../types/api.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a multipart FormData object from a tour create/update payload.
 * Only appends fields that are explicitly provided (non-undefined).
 * A `null` value for `image` or `description` is intentionally omitted so the
 * server treats the missing field as "no change" – callers that want to clear a
 * value should pass the appropriate sentinel string if the API supports it.
 */
function buildTourFormData(payload: CreateTourRequest | UpdateTourRequest): FormData {
  const fd = new FormData();

  fd.append("name", payload.name);

  if (payload.description !== undefined && payload.description !== null) {
    fd.append("description", payload.description);
  }

  if (payload.image) {
    fd.append("image", payload.image);
  }

  if (payload.status !== undefined) {
    fd.append("status", payload.status);
  }

  return fd;
}

// ─── Public Tour endpoints ────────────────────────────────────────────────────

export const tourPublicService = {
  /**
   * List all tours with pagination.
   */
  list(params?: PaginationParams): Promise<PaginatedResponse<Tour>> {
    return get<PaginatedResponse<Tour>>("/api/tours/", { params });
  },

  /**
   * Get a tour with its ordered list of POIs, localized to the requested language.
   */
  getById(id: string, lang: LangCode): Promise<ApiResponse<TourDetail>> {
    return get<ApiResponse<TourDetail>>(`/api/tours/${id}`, {
      params: { lang },
    });
  },
};

// ─── Admin Tour endpoints ──────────────────────────────────────────────────────

export const tourAdminService = {
  /**
   * List all tours (admin view) with pagination.
   *
   */
  list(params?: PaginationParams): Promise<PaginatedResponse<Tour>> {
    return get<PaginatedResponse<Tour>>("/api/admin/tours/", { params });
  },

  all(): Promise<PaginatedResponse<Tour>> {
    return get<PaginatedResponse<Tour>>("/api/admin/tours/");
  },

  /**
   * Create a new tour. Sends multipart/form-data to support optional image upload.
   */
  create(payload: CreateTourRequest): Promise<ApiResponse<Tour>> {
    return post<ApiResponse<Tour>>("/api/admin/tours/", buildTourFormData({ ...payload }), {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Update tour fields. Sends multipart/form-data to support optional image upload.
   */
  update(id: string, payload: UpdateTourRequest): Promise<ApiResponse<Tour>> {
    return put<ApiResponse<Tour>>(`/api/admin/tours/${id}`, buildTourFormData({ ...payload }), {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Permanently delete a tour and all its points.
   */
  delete(id: string): Promise<void> {
    return del<void>(`/api/admin/tours/${id}`);
  },
};

// ─── Admin Tour Points endpoints ───────────────────────────────────────────────

export const tourPointService = {
  /**
   * Get all POIs in a tour ordered by position.
   * Returns `TourPointDetailInline[]` – each item carries the server-assigned
   * point `id`, its `position`, and the embedded `poi` object.
   */
  list(tourId: string): Promise<ApiResponse<TourPointDetailInline[]>> {
    return get<ApiResponse<TourPointDetailInline[]>>(`/api/admin/tours/${tourId}/points`);
  },

  /**
   * Add an existing POI to a tour at a specific position.
   */
  add(tourId: string, payload: AddTourPointRequest): Promise<ApiResponse<TourPointDetailInline>> {
    return post<ApiResponse<TourPointDetailInline>>(`/api/admin/tours/${tourId}/points`, payload);
  },

  /**
   * Reorder POIs within a tour by submitting a full ordered list of
   * `{ poi_id, position }` items (`TourPointInput[]`).
   */
  reorder(tourId: string, payload: UpdateTourPointRequest[]): Promise<ApiResponse<TourPointDetailInline[]>> {
    return put<ApiResponse<TourPointDetailInline[]>>(`/api/admin/tours/${tourId}/points-position`, payload);
  },

  /**
   * Remove a specific point from a tour using the server-assigned point `id`
   * (not the POI id).
   */
  remove(tourId: string, pointId: string): Promise<void> {
    return del<void>(`/api/admin/tours/${tourId}/points/${pointId}`);
  },
};
