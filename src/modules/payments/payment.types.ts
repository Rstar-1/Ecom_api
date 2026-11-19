export interface CreatePaymentOrderBody {
  orderId?: string;
  amount?: number;
}

export interface VerifyPaymentBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  orderId?: string;
}

export interface CodPaymentBody {
  orderId?: string;
  amount?: number;
}

export interface PaymentResult {
  success: true;
  message: string;
}
