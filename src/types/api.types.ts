// ─────────────────────────────────────────────────────────────────────────────
// Shared / primitives
// ─────────────────────────────────────────────────────────────────────────────

export type LangCode = "vi" | "en" | "fr" | "zh" | "ja";
export enum LangCodeEnum {
  vi,
  en,
  fr,
  zh,
  ja,
}

export type POIType = "food" | "drink" | "museum" | "park" | "historical" | "shopping" | "other";

export type POIStatus = "active" | "inactive";

/** Tour publication status – matches Swagger Status68aEnum */
export type TourStatus = "draft" | "published";

export type RoleEnum = "admin" | "tourist" | "partner";

export type PaymentMethod = "momo" | "zalopay" | "stripe" | "other";

export type InvoiceStatus = "pending" | "success" | "failed";

export interface Invoice {
  id: string;
  invoice_type: string;
  reason: string;
  amount: string;
  status: InvoiceStatus;
  transaction_code?: string | null;
}

export interface PayPalLink {
  href: string;
  rel: string;
  method: string;
}

export interface PayPalOrder {
  id: string;
  status: string;
  intent?: string;
  purchase_units?: Array<Record<string, unknown>>;
  links?: PayPalLink[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard & Analytics
// ─────────────────────────────────────────────────────────────────────────────

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export interface AdminDashboardOverview {
  totalUsers: number;
  totalPois: number;
  totalVisits: number;
  totalRevenue: number;
}

export interface AdminVisitsPoint {
  date: string;
  visits: number;
}

export interface AdminRevenuePoint {
  date: string;
  revenue: number;
}

export interface AdminTopPoi {
  poiId: string;
  name: string;
  visits: number;
}

export interface AdminTopTour {
  tourId: string;
  name: string;
  starts: number;
}

export interface AdminActiveUsersPoint {
  date: string;
  users: number;
}

export interface PartnerDashboardOverview {
  totalVisits: number;
  uniqueUsers: number;
}

export interface PartnerVisitsPoint {
  date: string;
  visits: number;
}

export interface PartnerPoiPerformance {
  poiId: string;
  name: string;
  visits: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Response Wrappers
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  results: T[];
  total: number;
  totalPage: number;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

// ─────────────────────────────────────────────────────────────────────────────
// Pagination & Query Parameters
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  /** Minimum 8 characters */
  password: string;
  role: Exclude<RoleEnum, "admin">;
}

export interface UserResponse {
  id: string;
  email: string;
  role: RoleEnum;
  date_joined: string;
  is_active: boolean;
  poi_credits?: number;
}

export interface LoginData {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface LoginResponse {
  status: number;
  message: string;
  data: LoginData;
}

// ─────────────────────────────────────────────────────────────────────────────
// POI – Public
// ─────────────────────────────────────────────────────────────────────────────

export interface POI {
  id: string;
  name: string;
  description: string;
  audio: string;
  image: string | null;
  latitude: number;
  longitude: number;
  type: POIType;
  slug: string;
  /** Distance in metres (float). Read-only, computed by the server. */
  distance: number;
  /** ISO language codes for which a localization exists. Read-only. */
  supported_languages: string[];
}

export interface NearbyPOIParams extends PaginationParams {
  lat: number;
  lng: number;
  lang: LangCode;
  radius?: number;
  limit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// POI – Admin
// ─────────────────────────────────────────────────────────────────────────────

export interface POIDetail extends POI {
  radius: number;
  status: POIStatus;
  default_lang: LangCode;
  created_at: string;
  updated_at: string;
}

export interface AdminPOIListParams extends PaginationParams {
  type?: POIType;
  status?: POIStatus;
}

export interface CreatePOIRequest {
  default_name: string;
  latitude: number;
  longitude: number;
  slug: string;
  type: POIType;
  default_lang: string;
  default_description: string;
  default_audio: File;
  radius: number;
  image: File;
}

export interface UpdatePOIRequest {
  default_lang?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  image?: File;
  type?: POIType;
  slug?: string;
  status?: POIStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Localization
// ─────────────────────────────────────────────────────────────────────────────

export interface LocalizationResponse {
  id: string;
  poi_id: string;
  lang_code: LangCode;
  name: string;
  description: string | null;
  audio: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalizationWriteRequest {
  lang_code: LangCode;
  name: string;
  description?: string;
  audio?: File;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tour – Tour point shapes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read response shape for a single tour point.
 * Matches Swagger `TourPointDetailInline`.
 */
export interface TourPointDetailInline {
  /** Server-assigned tour-point record id (used for delete/reorder). */
  id: string;
  position: number;
  poi: POI;
}

/**
 * Write payload for adding or reordering a tour point.
 * Matches Swagger `AddTourPointRequest` / `UpdateTourPointRequest`.
 */
export interface TourPointInput {
  poi_id: string;
  /** Minimum 1 */
  position: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tour
// ─────────────────────────────────────────────────────────────────────────────

/** List-level tour object (no `pois` array). Matches Swagger `Tour`. */
export interface Tour {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
  point_count: number;
  status?: TourStatus;
  created_at: string;
  updated_at: string;
}

/** Detail-level tour object with ordered POIs. Matches Swagger `TourDetail`. */
export interface TourDetail extends Tour {
  /** Ordered list of tour points with embedded POI data. Read-only. */
  pois: TourPointDetailInline[];
}

/** Multipart payload to create a new tour. Matches Swagger `CreateTourRequest`. */
export interface CreateTourRequest {
  name: string;
  description?: string | null;
  image?: File | null;
  status?: TourStatus;
}

/** Multipart payload to update a tour. Matches Swagger `UpdateTourRequest`. */
export interface UpdateTourRequest {
  /** Required – tour name. */
  name: string;
  description?: string | null;
  image?: File | null;
  status?: TourStatus;
}

/** Payload for adding a POI to a tour. Matches Swagger `AddTourPointRequest`. */
export interface AddTourPointRequest {
  poi_id: string;
  /** Minimum 1 */
  position: number;
}

/**
 * Payload item for reordering tour points.
 * Matches Swagger `UpdateTourPointRequest`.
 * Aliased to TourPointInput for semantic clarity.
 */
export type UpdateTourPointRequest = TourPointInput;

// ─────────────────────────────────────────────────────────────────────────────
// NLS (Natural Language Services)
// ─────────────────────────────────────────────────────────────────────────────

export interface TranslateRequest {
  name: string;
  description: string;
  target_language: LangCode;
}

export interface TranslateResponse {
  name: string;
  description: string;
}

export interface TTSRequest {
  text: string;
  lang_code: string;
}

export interface TTSResponse {
  url: string;
  blob: Blob;
}
