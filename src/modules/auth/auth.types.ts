export interface RegisterBody {
  id?: string;
  fullname?: string;
  email?: string;
  mobile?: string;
  password?: string;
  /** Role selection: any of these (only honoured for public sign-up roles unless an admin registers the user) */
  roleId?: string;
  rolename?: string;
  role?: string;
  image?: string;
  /** Array or JSON string (multipart) */
  address?: unknown;
  documents?: Record<string, string | undefined> | null;
  /** Only honoured when an authorised user creates the account */
  isOtpVerified?: boolean | string;
  isActive?: boolean | string;
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

export interface ContactBody {
  email?: string;
  mobile?: string;
}

export interface ResetPasswordBody extends ContactBody {
  password?: string;
}

export interface OtpTarget {
  mobile?: string | null;
  email?: string | null;
}

export type RegisterFileField = "image" | "gstCertificate" | "panCard" | "shopPhoto";
export type RegisterFiles = Partial<Record<RegisterFileField, Express.Multer.File[]>>;
