import type { OrderStatus } from "../../models";

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
