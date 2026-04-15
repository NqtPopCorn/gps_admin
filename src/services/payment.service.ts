import { post } from "../lib/api";
import type { Invoice, PayPalOrder } from "../types/api.types";

const PAYMENTS_BASE = "/api/payments";

export interface BuyPoiCreditResponse extends Invoice {}

export const paymentService = {
  /**
   * Create a pending invoice for purchasing one POI credit.
   */
  async buyPoiCreditInvoice(): Promise<BuyPoiCreditResponse> {
    return post<BuyPoiCreditResponse>(`${PAYMENTS_BASE}/buy-poi-credit/`);
  },

  /**
   * Create a PayPal order for the given invoice id.
   */
  async paypalCreateOrder(invoiceId: string): Promise<PayPalOrder> {
    return post<PayPalOrder>(`${PAYMENTS_BASE}/paypal/create-order/`, { invoiceId });
  },

  /**
   * Capture the PayPal order and finalize the invoice.
   */
  async paypalCaptureOrder(orderId: string, invoiceId: string): Promise<PayPalOrder> {
    return post<PayPalOrder>(`${PAYMENTS_BASE}/paypal/capture-order/${orderId}/`, { invoiceId });
  },
};

export default paymentService;
