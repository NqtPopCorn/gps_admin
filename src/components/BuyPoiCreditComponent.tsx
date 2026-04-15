import { useCallback, useMemo, useState } from "react";
import { PayPalButtons, PayPalButtonsComponentProps } from "@paypal/react-paypal-js";
// import type { OnApproveData } from "@paypal/react-paypal-js";
import paymentService from "../services/payment.service";
import type { Invoice, PayPalOrder } from "../types/api.types";

interface BuyPoiCreditComponentProps {
  onSuccess?: (invoice: Invoice, paypalOrder: PayPalOrder) => void;
  onError?: (message: string) => void;
}

export function BuyPoiCreditComponent({ onSuccess, onError }: BuyPoiCreditComponentProps) {
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isPayPalReady, setIsPayPalReady] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);

  const handleBuyClick = useCallback(async () => {
    setIsCreatingInvoice(true);
    setError(null);
    try {
      const createdInvoice = await paymentService.buyPoiCreditInvoice();
      setInvoice(createdInvoice);
      setIsPayPalReady(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Không thể tạo hóa đơn";
      setError(message);
      onError?.(message);
    } finally {
      setIsCreatingInvoice(false);
    }
  }, [onError]);

  const paypalButtonProps = useMemo<PayPalButtonsComponentProps>(
    () => ({
      style: { layout: "vertical", shape: "pill", label: "pay" },
      disabled: !invoice,
      forceReRender: [invoice?.id],
      createOrder: async () => {
        if (!invoice) throw new Error("Missing invoice");
        const order = await paymentService.paypalCreateOrder(invoice.id);
        if (!order.id) throw new Error("Không nhận được PayPal orderId");
        return order.id;
      },
      onApprove: async (data: any) => {
        if (!invoice) return;
        if (!data.orderID) throw new Error("Missing orderID from PayPal");
        setIsCapturing(true);
        setError(null);
        try {
          const captured = await paymentService.paypalCaptureOrder(data.orderID, invoice.id);
          setInvoice((prev) => (prev ? { ...prev, status: "success", transaction_code: captured.id } : prev));
          onSuccess?.(invoice, captured);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Thanh toán thất bại";
          setError(message);
          onError?.(message);
        } finally {
          setIsCapturing(false);
        }
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : "Không thể khởi tạo PayPal";
        setError(message);
        onError?.(message);
      },
    }),
    [invoice, onError, onSuccess],
  );

  return (
    <div className="space-y-4">
      {!invoice && (
        <button
          className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50"
          disabled={isCreatingInvoice}
          onClick={handleBuyClick}
        >
          {isCreatingInvoice ? "Đang tạo hóa đơn..." : "Mua 1 lượt POI"}
        </button>
      )}

      {invoice && (
        <div className="space-y-3">
          <div className="rounded border border-muted p-3 text-sm">
            <div className="font-medium">Hóa đơn: {invoice.id}</div>
            <div>Lý do: {invoice.reason}</div>
            <div>Số tiền: {invoice.amount} VND</div>
            <div>Trạng thái: {invoice.status}</div>
          </div>

          {isPayPalReady && (
            <div className="max-w-sm">
              <PayPalButtons {...paypalButtonProps} fundingSource={undefined} />
              {isCapturing && <p className="text-sm text-muted-foreground mt-2">Đang xác nhận thanh toán...</p>}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default BuyPoiCreditComponent;
