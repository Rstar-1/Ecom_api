export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
  isDeleted?: string | boolean;
  isActive?: string | boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PagedResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
} & PaginationMeta;
