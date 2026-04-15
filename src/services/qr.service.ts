import type { POIDetail } from "../types/api.types";
import { get, post } from "../lib/api";
import type { ApiResponse } from "../types/api.types";

// @ts-ignore – Vite injects import.meta.env at runtime
const CLIENT_HOST = (import.meta.env?.VITE_FE_HOST as string | undefined) ?? "http://localhost:5173";

export function buildPoiUrl(poi: Pick<POIDetail, "slug">): string {
  const normalizedHost = CLIENT_HOST.replace(/\/$/, "");
  return `${normalizedHost}/poi/${poi.slug}`;
}

export function buildTourUrl(tour: { id: string }): string {
  const normalizedHost = CLIENT_HOST.replace(/\/$/, "");
  return `${normalizedHost}/tour/${tour.id}`;
}

export function buildQrImageUrl(targetUrl: string): string {
  const encoded = encodeURIComponent(targetUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encoded}`;
}

export function buildQrDownloadFilename(poi: Pick<POIDetail, "slug" | "name">): string {
  const slugSafe = poi.slug.replace(/[^a-zA-Z0-9-]/g, "-");
  return `poi-${slugSafe}.png`;
}

// ─── Response shape ────────────────────────────────────────────────────────────

export interface TourQRData {
  tour_id: string;
  /** Short activation code, e.g. "15TZPL7A" */
  code: string;
  /** Seconds until expiry */
  expires_in: number;
  /** ISO-8601 expiry timestamp */
  expired_at: string;
}

// ─── Service ───────────────────────────────────────────────────────────────────

export const tourQRService = {
  /**
   * Fetch a fresh dynamic QR code for the given tour.
   * Calls GET /api/tours/{tour_id}/qr-data
   */
  getQRData(tourId: string): Promise<ApiResponse<TourQRData>> {
    return get<ApiResponse<TourQRData>>(`/api/tours/${tourId}/qr-data`);
  },

  refresh(tourId: string, ttl: number): Promise<ApiResponse<TourQRData>> {
    return post<ApiResponse<TourQRData>>(`/api/tours/${tourId}/qr-data?ttl=${ttl}`);
  },
};
