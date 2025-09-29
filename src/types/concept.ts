/**
 * Concept-related TypeScript interfaces and types
 */

import { FileItem } from './common';

/**
 * User concept interface
 */
export interface UserConcept {
  id: string;
  maker_id: string;
  title: string;
  description?: string;
  price?: number;
  expected_audience?: number;
  available_dates?: AvailableDates;
  is_published: boolean;
  status?: string;
  tech_spec?: string;
  tech_spec_reference?: string;
  hospitality_rider_reference?: string;
  door_deal?: boolean;
  door_percentage?: number;
  price_by_agreement?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Concept file interface
 */
export interface ConceptFile extends FileItem {
  concept_id: string;
  creator_id: string;
}

/**
 * Concept history entry
 */
export interface ConceptHistoryEntry {
  id: string;
  original_concept_id: string;
  maker_id: string;
  title: string;
  description?: string;
  price?: number;
  expected_audience?: number;
  available_dates?: AvailableDates;
  tech_spec?: string;
  status: string;
  rejected_at: string;
  rejected_by: string;
  rejection_reason?: string;
  original_created_at: string;
  original_data?: Record<string, unknown>;
}

/**
 * Available dates structure
 */
export interface AvailableDates {
  [key: string]: unknown; // Flexible structure for date availability
}

/**
 * Concept creation request
 */
export interface CreateConceptRequest {
  title: string;
  description?: string;
  price?: number;
  expected_audience?: number;
  available_dates?: AvailableDates;
  tech_spec?: string;
  door_deal?: boolean;
  door_percentage?: number;
  price_by_agreement?: boolean;
}

/**
 * Concept update request
 */
export interface UpdateConceptRequest extends Partial<CreateConceptRequest> {
  is_published?: boolean;
  status?: string;
}

/**
 * Concept with files loaded
 */
export interface ConceptWithFiles extends UserConcept {
  files: ConceptFile[];
  techSpecFile?: FileItem;
  hospitalityRiderFile?: FileItem;
}

/**
 * Concept actions return type
 */
export interface ConceptActions {
  createConcept: (data: CreateConceptRequest) => Promise<UserConcept>;
  updateConcept: (id: string, data: UpdateConceptRequest) => Promise<UserConcept>;
  deleteConcept: (id: string) => Promise<void>;
  publishConcept: (id: string) => Promise<UserConcept>;
  unpublishConcept: (id: string) => Promise<UserConcept>;
  loading: boolean;
  error: string | null;
}