import type { ShopDetails, UserDocuments } from "../../models";

export interface UserListQuery {
  role?: string;
  status?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export interface UpdateUserBody {
  fullname?: string;
  email?: string;
  mobile?: string;
  image?: string;
  role?: string;
  password?: string;
  address?: unknown;
  shopDetails?: Partial<ShopDetails>;
  documents?: Partial<UserDocuments>;
}

export type DocumentField = "gstCertificate" | "panCard" | "shopPhoto";
export type UploadedDocuments = Partial<Record<DocumentField, Express.Multer.File[]>>;
