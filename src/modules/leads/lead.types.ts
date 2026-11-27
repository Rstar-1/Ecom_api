import type { ListQuery } from "../../utils";

/** Accepts both API field names and the dashboard/website form names. */
export interface LeadBody {
  id?: string;
  category?: string;
  products?: string[] | unknown;
  quantity?: number | string;
  name?: string;
  leadFullName?: string;
  fullName?: string;
  mobile?: string;
  mobileNumber?: string;
  phone?: string;
  contactNumber?: string;
  email?: string;
  emailAddress?: string;
  location?: string;
  address?: string;
  city?: string;
  requirementDetails?: string;
  notes?: string;
  description?: string;
  requirements?: string;
  severity?: string;
  publishedStatus?: boolean | string | number;
  isActive?: boolean | string | number;
  isDeleted?: boolean | string;
}

export interface LeadListQuery extends ListQuery {
  publishedStatus?: string;
  severity?: string;
  category?: string;
}

export interface DeleteQuery {
  permanent?: string;
}

export interface SeverityBody {
  severity?: string;
}
