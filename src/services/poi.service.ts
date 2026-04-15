import { get, post, patch, del, toFormData } from "../lib/api";
import type {
  POI,
  POIDetail,
  AdminPOIListParams,
  CreatePOIRequest,
  UpdatePOIRequest,
  NearbyPOIParams,
  LocalizationResponse,
  LocalizationWriteRequest,
  LangCode,
  ApiResponse,
  PaginatedResponse,
} from "../types/api.types";

// ─── Public POI endpoints ─────────────────────────────────────────────────────

export const poiPublicService = {
  /**
   * Get nearby POIs sorted by distance.
   */
  getNearby(params: NearbyPOIParams): Promise<POI[]> {
    return get<POI[]>("/api/pois/nearby", { params });
  },

  /**
   * Get single POI detail in the requested language.
   */
  getById(id: string, lang: LangCode): Promise<POI> {
    return get<POI>(`/api/pois/${id}`, { params: { lang } });
  },
};

// ─── Admin POI endpoints ──────────────────────────────────────────────────────

export const poiAdminService = {
  /**
   * List all POIs with optional filters and pagination.
   */
  list(params?: AdminPOIListParams): Promise<PaginatedResponse<POIDetail>> {
    return get<PaginatedResponse<POIDetail>>("/api/admin/pois/", { params });
  },

  /**
   * Get full POI detail (admin view).
   */
  getById(id: string): Promise<ApiResponse<POIDetail>> {
    return get<ApiResponse<POIDetail>>(`/api/admin/pois/${id}`);
  },

  /**
   * Create a new POI. Uploads image/audio via multipart/form-data.
   */
  create(payload: CreatePOIRequest): Promise<ApiResponse<POIDetail>> {
    return post<ApiResponse<POIDetail>>("/api/admin/pois/", toFormData(payload as unknown as Record<string, unknown>), {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * Partially update POI fields.
   */
  update(id: string, payload: UpdatePOIRequest): Promise<ApiResponse<POIDetail>> {
    return patch<ApiResponse<POIDetail>>(
      `/api/admin/pois/${id}`,
      toFormData(payload as unknown as Record<string, unknown>),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  /**
   * Permanently delete a POI.
   */
  delete(id: string): Promise<void> {
    return del<void>(`/api/admin/pois/${id}`);
  },
};

// ─── Admin Localization endpoints ─────────────────────────────────────────────

export const localizationService = {
  /**
   * Get all language versions for a POI.
   */
  list(poiId: string): Promise<ApiResponse<LocalizationResponse[]>> {
    return get<ApiResponse<LocalizationResponse[]>>(`/api/admin/pois/${poiId}/localizations`);
  },

  /**
   * Create or overwrite localized content for a language.
   */
  upsert(poiId: string, payload: LocalizationWriteRequest): Promise<ApiResponse<LocalizationResponse>> {
    const fd = toFormData({
      lang_code: payload.lang_code,
      name: payload.name,
      ...(payload.description && { description: payload.description }),
      ...(payload.audio && { audio: payload.audio }),
    });

    return post<ApiResponse<LocalizationResponse>>(`/api/admin/pois/${poiId}/localizations`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * Remove localized content for a specific language.
   */
  delete(poiId: string, langCode: string): Promise<void> {
    return del<void>(`/api/admin/pois/${poiId}/localizations/${langCode}`);
  },
};
