***

### 📋 Mẫu Prompt cho AI Frontend

```markdown
**Context:** Tôi đang xây dựng một ứng dụng React (TypeScript) có tính năng thanh toán bằng PayPal (Sandbox) để mua lượt tạo POI (Credit). 
Backend (Django REST Framework) đã xây dựng xong các API. Hãy đóng vai là một Frontend Expert, giúp tôi viết code cho các **API Services** (dùng axios) và **React Component** xử lý giao diện thanh toán.

---

### 🌊 1. Business Flow (Luồng xử lý)
1. User bấm nút "Mua 1 lượt POI".
2. Trình duyệt gọi API `buy_poi_credit` để tạo một Invoice (Hóa đơn) dưới DB, nhận về `invoiceId`.
3. Trình duyệt hiển thị component `PayPalButtons` (từ thư viện `@paypal/react-paypal-js`).
4. Khi component PayPal khởi tạo (`createOrder`): Gọi API `paypal_create_order` kèm `invoiceId` để backend tạo Order với PayPal. Backend trả về `orderId` của PayPal.
5. User xác nhận thanh toán trên popup của PayPal.
6. Khi thanh toán xong (`onApprove`): Gọi API `paypal_capture_order` kèm `orderId` và `invoiceId` để backend capture tiền và cộng điểm.
7. Hiển thị thông báo thành công hoặc lỗi cho user.

---

### 📡 2. API Specifications
Các API đều yêu cầu Header: `Authorization: Bearer <token>`.

#### API 1: Tạo hóa đơn mua POI
- **Endpoint:** `POST /api/payments/buy-poi-credit/`
- **Request Body:** Không có (Trống)
- **Response Body (Success 201):**
  ```json
  {
    "id": "uuid-của-invoice",
    "invoice_type": "poi_credit",
    "reason": "Mua 1 lượt tạo POI",
    "amount": "50000.00",
    "status": "pending"
  }
  ```

#### API 2: Tạo PayPal Order
- **Endpoint:** `POST /api/payments/paypal/create-order/`
- **Request Body:**
  ```json
  {
    "invoiceId": "uuid-của-invoice-lấy-từ-API-1"
  }
  ```
- **Response Body (Success 200):** Trả về PayPal Order Object, quan trọng nhất là trường `id`.
  ```json
  {
    "id": "PAYPAL_ORDER_ID_XXXXX",
    "status": "CREATED"
  }
  ```

#### API 3: Capture PayPal Order
- **Endpoint:** `POST /api/payments/paypal/capture-order/{order_id}/` (Lưu ý: `order_id` truyền trên URL)
- **Request Body:**
  ```json
  {
    "invoiceId": "uuid-của-invoice"
  }
  ```
- **Response Body (Success 200):**
  ```json
  {
    "id": "PAYPAL_ORDER_ID_XXXXX",
    "status": "COMPLETED"
  }
  ```

---

### 💻 3. Yêu cầu Code đầu ra
Vui lòng viết cho tôi 2 phần code:

1. **`paymentService.ts`**: Chứa 3 hàm gọi API tương ứng với spec ở trên, có type definition đàng hoàng.
2. **`BuyPoiCreditComponent.tsx`**: 
   - Sử dụng thư viện `@paypal/react-paypal-js`.
   - Có state quản lý loading, error, và `invoiceId`.
   - Xử lý mượt mà luồng `createOrder` và `onApprove` của thẻ `<PayPalButtons />`.
   - Hiển thị UI rõ ràng (Ví dụ: Ẩn nút mua sau khi đã tạo invoice, hiện nút PayPal lên thay thế).

Vui lòng chỉ sử dụng TypeScript và Functional Components (React Hooks), phân lớp service.
```
