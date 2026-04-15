import { get } from "@/lib/api";
import type {
  AdminActiveUsersPoint,
  AdminDashboardOverview,
  AdminRevenuePoint,
  AdminTopPoi,
  AdminTopTour,
  AdminVisitsPoint,
  ApiResponse,
  DateRangeParams,
  PartnerDashboardOverview,
  PartnerPoiPerformance,
  PartnerVisitsPoint,
} from "@/types/api.types";

type WithLimit = DateRangeParams & { limit?: number };

const ADMIN_BASE = "/api/admin/dashboard";
const PARTNER_BASE = "/api/partner/dashboard";

export const adminDashboardService = {
  getOverview(params?: DateRangeParams): Promise<AdminDashboardOverview> {
    return get<ApiResponse<AdminDashboardOverview>>(`${ADMIN_BASE}/overview`, { params }).then((res) => res.data);
  },

  getVisits(params?: DateRangeParams): Promise<AdminVisitsPoint[]> {
    return get<ApiResponse<AdminVisitsPoint[]>>(`${ADMIN_BASE}/visits`, { params }).then((res) => res.data);
  },

  getRevenue(params?: DateRangeParams): Promise<AdminRevenuePoint[]> {
    return get<ApiResponse<AdminRevenuePoint[]>>(`${ADMIN_BASE}/revenue`, { params }).then((res) => res.data);
  },

  getTopPois(params?: WithLimit): Promise<AdminTopPoi[]> {
    return get<ApiResponse<AdminTopPoi[]>>(`${ADMIN_BASE}/top-pois`, { params }).then((res) => res.data);
  },

  getTopTours(params?: WithLimit): Promise<AdminTopTour[]> {
    return get<ApiResponse<AdminTopTour[]>>(`${ADMIN_BASE}/top-tours`, { params }).then((res) => res.data);
  },

  getActiveUsers(params?: DateRangeParams): Promise<AdminActiveUsersPoint[]> {
    return get<ApiResponse<AdminActiveUsersPoint[]>>(`${ADMIN_BASE}/users-active`, { params }).then((res) => res.data);
  },
};

export const partnerDashboardService = {
  getOverview(params?: DateRangeParams): Promise<PartnerDashboardOverview> {
    return get<ApiResponse<PartnerDashboardOverview>>(`${PARTNER_BASE}/overview`, { params }).then((res) => res.data);
  },

  getVisits(params?: DateRangeParams): Promise<PartnerVisitsPoint[]> {
    return get<ApiResponse<PartnerVisitsPoint[]>>(`${PARTNER_BASE}/visits`, { params }).then((res) => res.data);
  },

  getPoiPerformance(params?: DateRangeParams): Promise<PartnerPoiPerformance[]> {
    return get<ApiResponse<PartnerPoiPerformance[]>>(`${PARTNER_BASE}/pois`, { params }).then((res) => res.data);
  },
};

export type { DateRangeParams };
