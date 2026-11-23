export interface PageInfo {
  isPaginated: boolean;
  page: number;
  limit: number;
  skip: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PagedResult<K extends string, T> = Record<K, T[]> & Pagination & { pagination: Pagination };

export const readPagination = (
  query: { page?: unknown; limit?: unknown },
  defaultLimit = 10,
  always = false
): PageInfo => {
  const isPaginated = always || query.page !== undefined || query.limit !== undefined;
  const page = Math.max(1, Number.parseInt(String(query.page ?? ""), 10) || 1);
  const limit = Math.min(Math.max(1, Number.parseInt(String(query.limit ?? ""), 10) || defaultLimit), 500);
  return { isPaginated, page, limit, skip: (page - 1) * limit };
};

export const pagedResult = <K extends string, T>(
  key: K,
  items: T[],
  total: number,
  { page, limit }: Pick<PageInfo, "page" | "limit">
): PagedResult<K, T> => {
  const pagination: Pagination = { total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  return { [key]: items, ...pagination, pagination } as PagedResult<K, T>;
};
