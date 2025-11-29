/**
 * Service-related TypeScript types
 * 
 * These types are used across service layers to ensure type safety
 * for service inputs, outputs, and error handling.
 */

import type { Database } from '@/integrations/supabase/types';

/**
 * Generic service response wrapper
 */
export interface ServiceResponse<T> {
  data: T | null;
  error: ServiceError | null;
}

/**
 * Service error structure
 */
export interface ServiceError {
  message: string;
  code?: string;
  details?: unknown;
  context?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Pagination response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Filter operators
 */
export type FilterOperator = 
  | 'eq'  // equals
  | 'neq' // not equals
  | 'gt'  // greater than
  | 'gte' // greater than or equal
  | 'lt'  // less than
  | 'lte' // less than or equal
  | 'like'   // pattern matching
  | 'ilike'  // case-insensitive pattern matching
  | 'in'     // in array
  | 'is'     // is null/not null
  | 'contains'  // contains
  | 'containedBy'; // contained by

/**
 * Generic filter
 */
export interface Filter<T = any> {
  field: keyof T;
  operator: FilterOperator;
  value: any;
}

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort parameters
 */
export interface SortParams<T = any> {
  field: keyof T;
  order: SortOrder;
}

/**
 * Query parameters for list operations
 */
export interface QueryParams<T = any> {
  filters?: Filter<T>[];
  sort?: SortParams<T>;
  pagination?: PaginationParams;
}

/**
 * Service operation context for logging and error tracking
 */
export interface ServiceContext {
  operation: string;
  userId?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Upload result
 */
export interface UploadResult {
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

/**
 * Batch operation result
 */
export interface BatchResult<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: ServiceError;
  }>;
  total: number;
  successCount: number;
  failureCount: number;
}
