# Phân tích cấu trúc thư mục dự án

## Thư mục gốc

- .env, .gitignore: Cấu hình môi trường và git
- index.html: File HTML gốc
- metadata.json: Metadata dự án
- package.json, package-lock.json: Quản lý package Node.js
- README.md: Hướng dẫn sử dụng
- tsconfig.json: Cấu hình TypeScript
- vite.config.ts: Cấu hình Vite
- dist/: Thư mục build
- node_modules/: Thư viện cài đặt
- docs/: Tài liệu dự án
- src/: Mã nguồn chính
- tmp/: File HTML mẫu, prototype

## Thư mục src/

- App.tsx: Component gốc React
- main.tsx: Điểm khởi động ứng dụng
- index.css: CSS tổng
- components/: Các component giao diện tái sử dụng (Layout, Sidebar, TopNav, MapPickerModal)
- lib/: Thư viện dùng chung (utils.ts)
- pages/: Các trang chính (Dashboard, Login, POIManagement, TourManagement)
- modals/: Các modal liên quan (PoiModal)

## Thư mục docs/

- db.md: Thiết kế database
- path_pattern.md: Quy ước đường dẫn
- swagger.yml: Định nghĩa API
- ui-schema.json: Định nghĩa UI schema
- usecase.md: Các trường hợp sử dụng

## Thư mục tmp/

- Các file HTML mẫu cho từng màn hình, modal

---

# Đề xuất cải thiện cấu trúc/code clean

1. **Tách biệt rõ ràng domain và UI:**
   - Tạo thêm thư mục `services/` (gọi API, xử lý dữ liệu), `hooks/` (custom hooks), `types/` (định nghĩa kiểu dữ liệu).
2. **Đặt tên nhất quán:**
   - Đặt tên file, component, biến theo chuẩn camelCase/PascalCase, tránh viết tắt khó hiểu.
3. **Tách nhỏ component:**
   - Các component lớn nên tách thành component con, tránh file quá dài.
4. **Quản lý state rõ ràng:**
   - Sử dụng context hoặc state management (nếu app lớn), tránh truyền props lồng nhiều cấp.
5. **Tách modal ra khỏi pages:**
   - Đưa các modal vào `components/modals/` thay vì lồng trong `pages/modals/`.
6. **Tách CSS theo component:**
   - Nếu dùng CSS module hoặc styled-components, tách riêng file style cho từng component.
7. **Tài liệu hóa code:**
   - Thêm comment, README cho từng thư mục chính, giải thích vai trò.
8. **Kiểm tra và chuẩn hóa import:**
   - Sử dụng alias cho import, tránh import tương đối dài dòng.

---

## Ví dụ cấu trúc đề xuất

src/
components/
modals/
hooks/
pages/
services/
types/
lib/
App.tsx
main.tsx
index.css
