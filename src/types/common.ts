/**
 * Common TypeScript interfaces and utility types
 */

/**
 * Standard error response structure
 */
export interface AppError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: AppError | null;
  loading: boolean;
}

/**
 * File upload/storage related types
 */
export interface FileItem {
  id: string;
  filename: string;
  file_path: string;
  file_url?: string;
  file_type: string;
  file_size?: number;
  mime_type?: string;
  title?: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Generic pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Generic sort parameters
 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Generic filter parameters
 */
export interface FilterParams {
  [key: string]: unknown;
}

/**
 * Generic list response with pagination
 */
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Coordinates interface
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Address suggestion for autocomplete
 */
export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

/**
 * Generic callback types
 */
export type VoidCallback = () => void;
export type AsyncVoidCallback = () => Promise<void>;
export type ErrorCallback = (error: AppError) => void;

/**
 * Event handler types
 */
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler<T = Record<string, unknown>> = (data: T) => void | Promise<void>;

/**
 * Utility type for making properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for making properties required
 */
export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Type guard for checking if value is defined
 */
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

/**
 * Type guard for checking if error is an Error instance
 */
export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

/**
 * Type guard for checking if value is a string
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Extract error message from unknown error
 */
export const getErrorMessage = (error: unknown): string => {
  if (isError(error)) {
    return error.message;
  }
  if (isString(error)) {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as { message: unknown }).message;
    if (isString(msg)) {
      return msg;
    }
  }
  return 'Unknown error occurred';
};