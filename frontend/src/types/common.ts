export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  error_code: string;
  details?: any;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  pages?: number;
}

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "JPY";
