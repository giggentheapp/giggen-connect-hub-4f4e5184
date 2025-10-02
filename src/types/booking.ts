/**
 * Booking-related TypeScript interfaces and types
 */

export type BookingStatus = 
  | 'pending' 
  | 'allowed' 
  | 'approved_by_sender' 
  | 'approved_by_receiver' 
  | 'approved_by_both' 
  | 'upcoming' 
  | 'completed' 
  | 'cancelled';

export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  [key: string]: string | undefined;
}

export interface BookingCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Core booking interface representing a booking request/agreement
 */
export interface Booking {
  id: string;
  sender_id: string;
  receiver_id: string;
  title: string;
  description?: string;
  status: BookingStatus;
  event_date?: string;  // Primary date field (start date)
  end_date?: string;    // New: end date for multi-day events
  time?: string;        // Legacy: kept for backwards compatibility
  start_time?: string;  // New: start time in HH:MM format
  end_time?: string;    // New: end time in HH:MM format
  venue?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price_musician?: string;
  artist_fee?: number;
  ticket_price?: number;
  audience_estimate?: number;
  door_deal?: boolean;
  door_percentage?: number;
  by_agreement?: boolean;
  personal_message?: string;
  sender_contact_info?: ContactInfo;
  hospitality_rider?: string;
  hospitality_rider_status?: string;
  tech_spec?: string;
  concept_ids: string[];
  selected_concept_id?: string;
  is_public_after_approval?: boolean;
  both_parties_approved?: boolean;
  approved_by_sender: boolean;
  approved_by_receiver: boolean;
  sender_approved_at?: string;
  receiver_approved_at?: string;
  sender_confirmed?: boolean;
  receiver_confirmed?: boolean;
  sender_read_agreement?: boolean;
  receiver_read_agreement?: boolean;
  allowed_at?: string;
  approved_at?: string;
  published_at?: string;
  cancelled_at?: string;
  rejected_at?: string;
  deleted_at?: string;
  contact_info_shared_at?: string;
  last_modified_by?: string;
  last_modified_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Safe booking interface for public viewing with sensitive data removed
 */
export interface SafeBooking {
  id: string;
  sender_id: string;
  receiver_id: string;
  title: string;
  description?: string;
  status: BookingStatus;
  event_date?: string;
  end_date?: string;
  time?: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  audience_estimate?: number;
  is_public_after_approval?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Booking change history entry
 */
export interface BookingChange {
  id: string;
  booking_id: string;
  changed_by: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  change_timestamp: string;
  status: string;
  requires_approval?: boolean;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Booking field update request
 */
export interface BookingFieldUpdate {
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Booking creation request
 */
export interface CreateBookingRequest {
  receiverId: string;
  conceptIds: string[];
  selectedConceptId?: string;
  title: string;
  description?: string;
  eventDate?: string;
  time?: string;
  venue?: string;
  address?: string;
  coordinates?: BookingCoordinates;
  personalMessage?: string;
  contactInfo?: ContactInfo;
}

/**
 * Booking update request - includes all possible fields for flexibility
 */
export interface UpdateBookingRequest {
  title?: string;
  description?: string;
  event_date?: string;  // Primary date field (start date)
  end_date?: string;    // New: end date for multi-day events
  time?: string;        // Legacy: kept for backwards compatibility
  start_time?: string;  // New: start time in HH:MM format
  end_time?: string;    // New: end time in HH:MM format
  venue?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price_musician?: string;
  artist_fee?: number;
  ticket_price?: number;
  audience_estimate?: number;
  personal_message?: string;
  hospitality_rider?: string;
  tech_spec?: string;
  is_public_after_approval?: boolean;
  status?: BookingStatus;
  public_visibility_settings?: Record<string, string | number | boolean | null>;
  door_deal?: boolean;
  door_percentage?: number;
  by_agreement?: boolean;
  last_modified_by?: string;
  last_modified_at?: string;
  receiver_allowed_at?: string;
  agreement_summary_text?: string;
  both_parties_approved?: boolean;
  approved_by_sender?: boolean;
  approved_by_receiver?: boolean;
  sender_contact_info?: ContactInfo;
}