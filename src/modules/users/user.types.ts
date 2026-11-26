import type { ListQuery } from "../../utils";

export interface UserListQuery extends ListQuery {
  /** Filter by role: Mongo _id, ROLE-001 or role name ("all" = no filter) */
  roleId?: string;
  role?: string;
  rolename?: string;
}

export interface UpdateUserBody {
  fullname?: string;
  email?: string;
  mobile?: string;
  image?: string;
  password?: string;
  address?: unknown;
  social?: unknown;
  documents?: Record<string, string | undefined> | null;
  roleId?: string;
  rolename?: string;
  role?: string;
  isActive?: boolean | string;
  isOtpVerified?: boolean | string;
  isDeleted?: boolean | string;
}

export type DocumentField = "gstCertificate" | "panCard" | "shopPhoto";
export type UploadedDocuments = Partial<Record<DocumentField, Express.Multer.File[]>>;
