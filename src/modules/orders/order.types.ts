import type { OrderStatus } from "./order.model";

export interface OrderAddressBody {
  fullName?: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface CreateOrderBody {
  address?: OrderAddressBody;
}

export interface UpdateOrderStatusBody {
  status?: OrderStatus;
}
