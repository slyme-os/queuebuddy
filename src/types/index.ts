// Core Types for QueueBuddy – Bengaluru

export type OfficeType =
  | 'rto'
  | 'sub_registrar'
  | 'psk'
  | 'ward_civic'
  | 'utility'
  | 'taluk'
  | 'other';

export type OfficeStatus = 'bookable' | 'coming_soon';

export type CopyType = 'original' | 'photocopy' | 'both';

export type UserRole = 'customer' | 'buddy' | 'admin';

export type AdminSubRole = 'super_admin' | 'ops' | 'support' | 'content';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  role: UserRole;
  admin_sub_role?: AdminSubRole;
  avatar_url?: string;
  created_at: string;
  mfa_enabled?: boolean;
}

export interface BuddyApplication {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  languages: SupportedLanguage[];
  preferred_zones: string[];
  id_document_type: string;
  id_document_url?: string;
  selfie_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_review_notes?: string;
  created_at: string;
}

export interface AdminInvitation {
  id: string;
  email: string;
  admin_sub_role: AdminSubRole;
  token: string;
  is_accepted: boolean;
  expires_at: string;
  created_at: string;
}

export type BookingStatus =
  | 'requested'
  | 'assigned'
  | 'buddy_arrived'
  | 'in_queue'
  | 'customer_summoned'
  | 'handover_completed'
  | 'cancelled';

export type CrowdSource = 'buddy_report' | 'customer_report' | 'historical_agg';

export type SupportedLanguage = 'English' | 'Kannada' | 'Hindi' | 'Tamil' | 'Telugu';

export interface Office {
  id: string;
  name: string;
  name_kn: string;
  office_type: OfficeType;
  area: string;
  address: string;
  lat: number;
  lng: number;
  status: OfficeStatus;
  working_hours: {
    mon_fri: string;
    counter?: string;
    lunch?: string;
    token_issue?: string;
    khata_counter?: string;
    cash_counter?: string;
  };
  holidays: string[];
  last_verified_date: string;
}

export interface Service {
  id: string;
  office_id: string;
  title: string;
  title_kn: string;
  description: string;
  government_fee: number;
  queue_buddy_base_fee: number;
  estimated_wait_minutes: number;
}

export interface DocumentChecklistItem {
  id: string;
  service_id: string;
  item_name: string;
  item_name_kn: string;
  help_text: string;
  copy_type: CopyType;
  copies_count: number;
  is_mandatory: boolean;
  where_to_get: string;
  order_index: number;
}

export interface CrowdReport {
  id: string;
  office_id: string;
  source: CrowdSource;
  people_ahead: number;
  estimated_wait_minutes: number;
  reported_at: string;
  weekday?: number;
  hour_of_day?: number;
  reporter_name?: string;
  notes?: string;
}

export interface BuddyProfile {
  id: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  languages: SupportedLanguage[];
  verification_status: 'pending' | 'verified' | 'rejected';
  rating: number;
  total_jobs: number;
  earnings_balance: number;
  is_active: boolean;
  preferred_zones: string[];
  current_lat?: number;
  current_lng?: number;
}

export interface Booking {
  id: string;
  booking_code: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  buddy_id?: string;
  buddy?: BuddyProfile;
  office_id: string;
  office: Office;
  service_id: string;
  service: Service;
  booking_date: string;
  arrival_time: string;
  expected_wait_hours: number;
  preferred_language: SupportedLanguage;
  backup_language?: SupportedLanguage;
  status: BookingStatus;
  token_number?: string;
  people_ahead?: number;
  queue_buddy_fee: number;
  government_fee: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  checklist_progress: string[]; // List of DocumentChecklistItem ids
  reminder_sent?: boolean;
  created_at: string;
  updated_at: string;
  notes?: string;
  rating?: number;
  cancel_reason?: string;
}

export interface QueueUpdate {
  id: string;
  booking_id: string;
  buddy_id: string;
  buddy_name: string;
  office_id: string;
  token_number?: string;
  people_ahead: number;
  estimated_mins_per_person: number;
  notes?: string;
  photo_url?: string;
  created_at: string;
}

export interface OfficeDemand {
  id: string;
  office_id: string;
  phone_or_email: string;
  service_interest?: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  booking_id: string;
  booking_code: string;
  raised_by: string;
  customer_name: string;
  reason: string;
  status: 'open' | 'investigating' | 'resolved' | 'refunded';
  admin_notes?: string;
  created_at: string;
}

export interface StaffInvite {
  id: string;
  email: string;
  sub_role: AdminSubRole;
  token: string;
  created_at: string;
}

export interface CustomerPreferences {
  preferredLanguage: SupportedLanguage;
  backupLanguage?: SupportedLanguage;
  eveningReminders: boolean;
  queuePings: boolean;
}
