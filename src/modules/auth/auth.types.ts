export interface RegisterBody {
  fullname?: string;
  email?: string;
  mobile?: string;
  password?: string;
  role?: string;
  image?: string;
  /** Array or JSON string (multipart) */
  address?: unknown;
  /** Object or JSON string (multipart) */
  shopDetails?: unknown;
  /** Object or JSON string (multipart) */
  documents?: unknown;
}

export interface VerifyOtpBody {
  mobile?: string;
  email?: string;
  otp?: string;
}

export interface LoginBody {
  email?: string;
  mobile?: string;
  password?: string;
}

export interface OtpTarget {
  mobile?: string | null;
  email?: string | null;
}
