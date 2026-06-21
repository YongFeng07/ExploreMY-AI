export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  requestId?: string;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  errors?: string[];
  requestId?: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
