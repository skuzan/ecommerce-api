export interface PaginationMetaInput {
  page: number;
  limit: number;
  total: number;
}

export interface ListMeta extends PaginationMetaInput {
  totalPages: number;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: ListMeta;
}
