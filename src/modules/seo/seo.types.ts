import type { BreadcrumbInput } from "./seo.model";
import type { ListQuery } from "../../utils";

export interface SeoBody {
  id?: string;
  name?: string;
  page?: string;
  path?: string;
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  noindex?: boolean | string;
  /** Array or JSON string (multipart) */
  breadcrumbs?: BreadcrumbInput[] | string;
  isActive?: boolean | string;
  isDeleted?: boolean | string;
  createdBy?: string;
  vendorBy?: string | unknown;
  VendorBy?: string | unknown;
}

export interface SeoListQuery extends ListQuery {
  type?: string;
}

export interface SeoPathQuery {
  path?: string;
}

export interface SeoPageParams {
  page: string;
  [key: string]: string;
}

export interface SeoDeleteQuery {
  permanent?: string;
}
