

# 🧩 1. Base config

* Base URL: `/api/v1`
* Auth: JWT (role = `admin | partner`)
* Format response:

```json
{
  "success": true,
  "data": ...
}
```

---

# 👑 2. ADMIN APIs

## 2.1. Get overview (KPI cards)

### `GET /admin/dashboard/overview`

### Response:

```json
{
  "totalUsers": 1200,
  "totalPois": 85,
  "totalVisits": 54321,
  "totalRevenue": 12500000
}
```

### Logic:

* users → COUNT(Users)
* pois → COUNT(Pois)
* visits → COUNT(History)
* revenue → SUM(Invoice.amount WHERE status=SUCCESS)

---

## 2.2. Visits over time

### `GET /admin/dashboard/visits`

### Query params:

* `from` (optional, ISO date)
* `to` (optional)

### Response:

```json
[
  { "date": "2026-04-01", "visits": 120 },
  { "date": "2026-04-02", "visits": 98 }
]
```

---

## 2.3. Revenue over time

### `GET /admin/dashboard/revenue`

### Response:

```json
[
  { "date": "2026-04-01", "revenue": 200000 },
  { "date": "2026-04-02", "revenue": 150000 }
]
```

---

## 2.4. Top POIs

### `GET /admin/dashboard/top-pois`

### Query params:

* `limit` (default: 5)

### Response:

```json
[
  {
    "poiId": "poi_1",
    "name": "Bún bò Huế",
    "visits": 1200
  }
]
```

👉 cần JOIN `LocalizedData` để lấy name theo lang

---

## 2.5. Top Tours (basic)

### `GET /admin/dashboard/top-tours`

### Response:

```json
[
  {
    "tourId": "tour_1",
    "name": "Food Tour Q1",
    "starts": 340
  }
]
```

👉 logic:

* đếm scan tại `tour_points.position = 1`

---

# 🤝 3. PARTNER APIs

👉 tất cả endpoint filter theo:

```sql
Pois.owner_id = current_user.id
```

---

## 3.1. Overview

### `GET /partner/dashboard/overview`

### Response:

```json
{
  "totalVisits": 3200,
  "uniqueUsers": 850
}
```

---

## 3.2. Visits over time

### `GET /partner/dashboard/visits`

### Response:

```json
[
  { "date": "2026-04-01", "visits": 50 },
  { "date": "2026-04-02", "visits": 70 }
]
```

---

## 3.3. POI performance

### `GET /partner/dashboard/pois`

### Response:

```json
[
  {
    "poiId": "poi_1",
    "name": "Cafe ABC",
    "visits": 500
  },
  {
    "poiId": "poi_2",
    "name": "Bánh mì XYZ",
    "visits": 300
  }
]
```

---

# 🔧 4. Optional (nice-to-have nhưng vẫn MVP ok)

## 4.1. Unique users over time

### `GET /admin/dashboard/users-active`

```json
[
  { "date": "2026-04-01", "users": 45 }
]
```

---

## 4.2. Filter theo khoảng thời gian (áp dụng chung)

Support cho tất cả endpoint:

```
?from=2026-04-01&to=2026-04-14
```

---

# ⚙️ 5. Index nên có (rất quan trọng)

Để API chạy nhanh:

```sql
CREATE INDEX idx_history_created_at ON History(created_at);
CREATE INDEX idx_history_poi ON History(poi_id);
CREATE INDEX idx_history_user ON History(user_id);

CREATE INDEX idx_invoice_paid_at ON Invoice(paid_at);
CREATE INDEX idx_invoice_status ON Invoice(status);
```

---

# 🚀 6. Tổng kết scope API MVP

## Admin (5 endpoint):

* overview
* visits
* revenue
* top-pois
* top-tours

## Partner (3 endpoint):

* overview
* visits
* pois

👉 Tổng: **8 endpoints là đủ chạy production MVP**


## ✅ Analytics Module — Done

**8 endpoints implemented** across 3 files:

### Admin (`/api/admin/dashboard/...`)
| Endpoint | View | Description |
|---|---|---|
| `GET /overview` | `AdminOverviewView` | KPI cards: users, POIs, visits, revenue |
| `GET /visits` | `AdminVisitsView` | Daily visit counts (`?from`, `?to`) |
| `GET /revenue` | `AdminRevenueView` | Daily revenue from `SUCCESS` invoices |
| `GET /top-pois` | `AdminTopPoisView` | Top N POIs by visits with `LocalizedData` names |
| `GET /top-tours` | `AdminTopToursView` | Tours ranked by scans at `position=1` entry point |
| `GET /users-active` | `AdminActiveUsersView` | Daily unique user counts *(optional endpoint)* |

### Partner (`/api/partner/dashboard/...`)
| Endpoint | View | Description |
|---|---|---|
| `GET /overview` | `PartnerOverviewView` | Total visits + unique users for owned POIs |
| `GET /visits` | `PartnerVisitsView` | Daily visits for owned POIs |
| `GET /pois` | `PartnerPoisPerformanceView` | Per-POI breakdown with visit counts |

### Key design decisions:
- **Auth**: `IsAdminUser` (new, added to `accounts/permissions.py`) for admin routes; `IsPartnerUser` for partner routes — both validate `user.role` from JWT.
- **Date filtering**: All endpoints accept `?from=YYYY-MM-DD&to=YYYY-MM-DD` consistently via `_parse_date_range()` + `_apply_date_filter()` helpers.
- **POI names**: Multi-language resolution with graceful fallback (requested lang → any available lang) using `LocalizedData`.
- **No migrations needed** — `analystics` has no models.