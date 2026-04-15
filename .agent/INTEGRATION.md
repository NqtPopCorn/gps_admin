# API Integration Guide

## Cấu trúc file

```
src/
├── services/
│   ├── api.ts                  # Axios instance, interceptors, token storage
│   ├── auth.service.ts         # /api/auth/*
│   ├── poi.service.ts          # /api/pois/* + /api/admin/pois/*
│   ├── tour.service.ts         # /api/tours/* + /api/admin/tours/*
│   ├── nls.service.ts          # /api/admin/nls/*
│   ├── subscription.service.ts # /api/subscription/*
│   └── index.ts                # barrel export
├── hooks/
│   ├── useAuth.ts
│   ├── usePOIs.ts              # usePOIList · usePOIDetail · usePOIMutations · useLocalizations
│   ├── useTours.ts             # useTourList · useTourMutations · useTourPoints
│   ├── useNLS.ts               # useTranslate · useTTS
│   ├── useSubscription.ts
│   └── index.ts                # barrel export
└── types/
    ├── api.types.ts            # All TypeScript types from swagger
    └── index.ts                # barrel export
```

## Setup

### 1. Biến môi trường

Tạo file `.env.local` ở root dự án:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Cài đặt dependencies (nếu chưa có)

```bash
npm install axios
```

---

## Ví dụ tích hợp

### Login.tsx

```tsx
import { useAuth } from "@/hooks";

export function Login() {
  const { login, isLoading, error } = useAuth();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const success = await login({
      email: fd.get("email") as string,
      password: fd.get("password") as string,
    });
    if (success) navigate("/");
  };

  return (
    <form onSubmit={handleLogin}>
      {error && <p className="text-error text-sm">{error.message}</p>}
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
```

---

### POIManagement.tsx

```tsx
import { usePOIList, usePOIMutations } from "@/hooks";
import type { POIType, POIStatus } from "@/types";

export function POIManagement() {
  const { pois, isLoading, setParams, refetch } = usePOIList();
  const { deletePOI, isLoading: mutating } = usePOIMutations({ onSuccess: refetch });

  return (
    <>
      {/* Filter */}
      <select onChange={(e) => setParams({ type: e.target.value as POIType, page: 1 })}>
        <option value="">All types</option>
        <option value="museum">Museum</option>
        <option value="park">Park</option>
      </select>

      {/* Table */}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        pois.map((poi) => (
          <tr key={poi.id}>
            <td>{poi.name}</td>
            <td>{poi.status}</td>
            <td>
              <button onClick={() => deletePOI(poi.id)} disabled={mutating}>
                Delete
              </button>
            </td>
          </tr>
        ))
      )}
    </>
  );
}
```

---

### PoiModal.tsx – Tích hợp TTS và Localizations

```tsx
import { useTTS, useLocalizations, usePOIMutations } from "@/hooks";
import type { LangCode } from "@/types";

export default function POIModal({ poiId, onClose }: { poiId: string; onClose: () => void }) {
  const { generateAudio, audioUrl, isLoading: ttsLoading } = useTTS();
  const { localizations, upsert, remove } = useLocalizations(poiId);
  const { updatePOI } = usePOIMutations({ onSuccess: onClose });

  const handleGenerateTTS = async (text: string, lang: LangCode) => {
    const res = await generateAudio({ text, lang_code: lang });
    if (res) {
      // upsert the localization with the generated audio URL
      await upsert({ lang_code: lang, name: "...", description: text });
    }
  };

  return (
    <div>
      {/* Existing modal UI */}
      <button onClick={() => handleGenerateTTS("Notre-Dame de Paris...", "en")} disabled={ttsLoading}>
        {ttsLoading ? "Generating..." : "Generate Audio"}
      </button>
      {audioUrl && <audio src={audioUrl} controls />}
    </div>
  );
}
```

---

### TourManagement.tsx

```tsx
import { useTourList, useTourMutations, useTourPoints } from "@/hooks";

export function TourManagement() {
  const { tours, isLoading, refetch } = useTourList();
  const { createTour, deleteTour } = useTourMutations({ onSuccess: refetch });

  return (
    <>
      <button onClick={() => createTour({ name: "New Tour" })}>Create</button>
      {tours.map((tour) => (
        <div key={tour.id}>
          <span>{tour.name}</span>
          <button onClick={() => deleteTour(tour.id)}>Delete</button>
        </div>
      ))}
    </>
  );
}
```

---

### TourModal.tsx – Quản lý Tour Points

```tsx
import { useTourPoints } from "@/hooks";

function RouteBuilder({ tourId }: { tourId: string }) {
  const { points, addPoint, reorder, removePoint, isLoading } = useTourPoints(tourId);

  return (
    <>
      {points.map((p, i) => (
        <div key={p.id}>
          <span>#{p.position}</span>
          <button onClick={() => reorder(p.id, { position: p.position - 1 })}>↑</button>
          <button onClick={() => reorder(p.id, { position: p.position + 1 })}>↓</button>
          <button onClick={() => removePoint(p.id)}>Remove</button>
        </div>
      ))}
      <button onClick={() => addPoint({ poi_id: "some-poi-id", position: points.length + 1 })}>
        Add Stop
      </button>
    </>
  );
}
```

---

## Error handling

Tất cả hooks đều expose `error: ApiError | null`:

```tsx
const { error } = usePOIList();

if (error) {
  if (error.status === 403) return <p>Bạn không có quyền truy cập.</p>;
  if (error.status === 404) return <p>Không tìm thấy.</p>;
  return <p>Lỗi: {error.message}</p>;
}
```

## Token & Auth flow

- Token được lưu trong `localStorage` với key `ag_access_token`
- Axios interceptor tự đính kèm `Authorization: Bearer <token>` vào mọi request
- Khi server trả về 401, một event `auth:unauthorized` được dispatch → `useAuth` hook tự redirect về `/login`
- Gọi `logout()` từ `useAuth` để xóa token và redirect
