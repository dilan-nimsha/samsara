// ─── ENUMS ────────────────────────────────────────────────────────────────────

export type ReservationStatus =
  | 'enquiry'
  | 'under_review'
  | 'confirmed'
  | 'invoice_sent'
  | 'paid'
  | 'trip_active'
  | 'completed'
  | 'cancelled'
  | 'feedback_pending';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded';
export type Currency = 'GBP' | 'USD' | 'EUR' | 'LKR' | 'CNY';
export type TravelPurpose = 'leisure' | 'honeymoon' | 'business' | 'anniversary' | 'birthday' | 'group_tour' | 'corporate' | 'other';
export type MealPlan = 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
export type VehicleType = 'car' | 'van' | 'minibus' | 'coach' | 'tuk_tuk';

// ─── CLIENT ───────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  full_name: string;
  company_name?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  nationality: string;
  passport_number?: string;
  passport_expiry?: string;
  date_of_birth?: string;
  dietary_restrictions?: string;
  medical_notes?: string;
  is_vip: boolean;
  is_repeat_client: boolean;
  special_occasions?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── TRAVELLER ────────────────────────────────────────────────────────────────

export interface Traveller {
  id: string;
  reservation_id: string;
  full_name: string;
  passport_number?: string;
  nationality: string;
  date_of_birth?: string;
  type: 'adult' | 'child' | 'infant';
}

// ─── PARTNER ──────────────────────────────────────────────────────────────────

export interface Partner {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  country: string;
  commission_rate: number;
  contract_reference?: string;
  is_active: boolean;
  total_bookings: number;
  total_commission_earned: number;
  created_at: string;
}

// ─── ACCOMMODATION ────────────────────────────────────────────────────────────

export interface Accommodation {
  id: string;
  reservation_id: string;
  hotel_name: string;
  hotel_category: '3_star' | '4_star' | '5_star' | 'luxury' | 'villa' | 'boutique';
  check_in: string;
  check_out: string;
  room_type: 'single' | 'double' | 'twin' | 'triple' | 'suite' | 'villa';
  num_rooms: number;
  meal_plan: MealPlan;
  special_requests?: string;
  confirmation_number?: string;
  cost: number;
  currency: Currency;
}

// ─── TRANSFER ─────────────────────────────────────────────────────────────────

export interface Transfer {
  id: string;
  reservation_id: string;
  type: 'airport_pickup' | 'airport_dropoff' | 'intercity' | 'excursion';
  pickup_location: string;
  dropoff_location: string;
  date: string;
  time: string;
  vehicle_type: VehicleType;
  num_vehicles: number;
  is_chauffeur: boolean;
  driver_name?: string;
  driver_phone?: string;
  flight_number?: string;
  luggage_notes?: string;
  cost: number;
  currency: Currency;
}

// ─── ACTIVITY ─────────────────────────────────────────────────────────────────

export interface Activity {
  id: string;
  reservation_id: string;
  name: string;
  date: string;
  location: string;
  duration_hours?: number;
  guide_required: boolean;
  guide_language?: string;
  tickets_required: boolean;
  num_participants: number;
  special_notes?: string;
  cost: number;
  currency: Currency;
}

// ─── ITINERARY DAY ────────────────────────────────────────────────────────────

export interface ItineraryDay {
  id: string;
  reservation_id: string;
  day_number: number;
  date: string;
  title: string;
  description: string;
  accommodation_id?: string;
  transfer_ids: string[];
  activity_ids: string[];
  meals_included: string[];
  notes?: string;
}

// ─── PAYMENT ──────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  reservation_id: string;
  amount: number;
  currency: Currency;
  method: 'bank_transfer' | 'card' | 'stripe' | 'cash' | 'paypal';
  status: PaymentStatus;
  reference?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
}

// ─── RESERVATION ──────────────────────────────────────────────────────────────

export interface Reservation {
  id: string;
  reference: string;
  status: ReservationStatus;
  client_id: string;
  client?: Client;
  partner_id?: string;
  partner?: Partner;
  partner_reference?: string;
  travel_purpose: TravelPurpose;
  arrival_date: string;
  departure_date: string;
  num_adults: number;
  num_children: number;
  num_infants: number;
  destinations: string[];
  flight_arrival?: string;
  flight_departure?: string;
  airport_arrival?: string;
  airport_departure?: string;
  budget_range?: string;
  currency: Currency;
  total_cost: number;
  total_paid: number;
  commission_amount: number;
  payment_status: PaymentStatus;
  assigned_staff?: string;
  internal_notes?: string;
  is_vip: boolean;
  special_occasions?: string[];
  accommodations?: Accommodation[];
  transfers?: Transfer[];
  activities?: Activity[];
  itinerary?: ItineraryDay[];
  payments?: Payment[];
  travellers?: Traveller[];
  created_at: string;
  updated_at: string;
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

export interface DashboardStats {
  total_reservations: number;
  active_trips: number;
  pending_enquiries: number;
  revenue_this_month: number;
  revenue_currency: Currency;
  upcoming_arrivals: number;
  overdue_payments: number;
  new_enquiries_today: number;
}
