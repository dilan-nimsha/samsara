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

// ─── ITINERARY BUILDER ────────────────────────────────────────────────────────

export type ItineraryStatus   = 'draft' | 'sent' | 'approved' | 'locked';
export type ItineraryItemType =
  | 'transfer' | 'accommodation' | 'activity'
  | 'meal' | 'guide' | 'flight' | 'free_time';

export interface ItineraryItem {
  id: string;
  type: ItineraryItemType;
  time: string;
  title: string;
  description: string;
  supplier_name: string;
  duration_minutes: number;
  confirmation_ref: string;
  included: boolean;
  internal_notes: string;
}

export interface ItineraryDay {
  id: string;
  day_number: number;
  date: string;
  title: string;
  narrative: string;
  items: ItineraryItem[];
  meals: { breakfast: boolean; lunch: boolean; dinner: boolean };
}

export interface Itinerary {
  id: string;
  reservation_id: string;
  version: number;
  status: ItineraryStatus;
  title: string;
  days: ItineraryDay[];
  created_at: string;
  updated_at: string;
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
  itinerary_days?: ItineraryDay[];
  payments?: Payment[];
  travellers?: Traveller[];
  created_at: string;
  updated_at: string;
}

// ─── SUPPLIER ─────────────────────────────────────────────────────────────────

export type SupplierType = 'hotel' | 'transport' | 'activity' | 'guide' | 'restaurant';
export type SupplierStatus = 'active' | 'inactive' | 'on_hold';
export type SupplierPaymentTerms = 'prepaid' | 'net_7' | 'net_15' | 'net_30' | 'net_45';

export interface SupplierRate {
  id: string;
  service: string;
  unit: 'per_person' | 'per_group' | 'per_vehicle' | 'per_room' | 'per_night';
  cost: number;
  currency: Currency;
  season: 'all' | 'peak' | 'off_peak';
  valid_from?: string;
  valid_to?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  status: SupplierStatus;
  contact_person: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  destinations: string[];
  address?: string;
  country: string;
  currency: Currency;
  payment_terms: SupplierPaymentTerms;
  contract_reference?: string;
  contract_start?: string;
  contract_end?: string;
  cancellation_policy?: string;
  rating: number;
  total_bookings: number;
  notes?: string;
  rates: SupplierRate[];
  bank_name?: string;
  bank_account?: string;
  swift_code?: string;
  created_at: string;
}

// ─── SUPPLIER BOOKING ─────────────────────────────────────────────────────────

export type SupplierBookingServiceType = 'room' | 'transfer' | 'activity' | 'meal' | 'guide';
export type SupplierBookingConfStatus  = 'on_request' | 'confirmed' | 'cancelled';
export type SupplierBookingPayStatus   = 'unpaid' | 'deposit_paid' | 'fully_paid';

export interface SupplierBooking {
  id: string;
  reservation_id: string;
  supplier_name: string;
  supplier_id?: string;
  itinerary_item_id?: string;
  service_type: SupplierBookingServiceType;
  service_date: string;
  service_description: string;
  pax_adults: number;
  pax_children: number;
  room_type?: string;
  meal_plan?: MealPlan;
  confirmation_status: SupplierBookingConfStatus;
  confirmation_ref?: string;
  confirmation_received_at?: string;
  supplier_cost: number;
  currency: Currency;
  payment_status: SupplierBookingPayStatus;
  payment_due_date?: string;
  cancellation_deadline?: string;
  notes?: string;
}

// ─── COST LINE ────────────────────────────────────────────────────────────────

export type CostCategory = 'accommodation' | 'transport' | 'guide' | 'activity' | 'meal' | 'visa' | 'insurance' | 'misc';

export interface CostLine {
  id: string;
  reservation_id: string;
  category: CostCategory;
  supplier_name: string;
  supplier_id?: string;
  description: string;
  date?: string;
  pax: number;
  unit_cost: number;
  unit_sell: number;
  quantity: number;
  currency: Currency;
  included_in_package: boolean;
}

// ─── GUIDE ────────────────────────────────────────────────────────────────────

export interface Guide {
  id: string;
  full_name: string;
  languages: string[];
  specializations: string[];
  license_number?: string;
  license_expiry?: string;
  phone: string;
  whatsapp?: string;
  base_location: string;
  daily_rate: number;
  currency: Currency;
  rating: number;
  is_available: boolean;
  notes?: string;
  created_at: string;
}

export interface GuideAssignment {
  id: string;
  guide_id: string;
  reservation_id: string;
  date_from: string;
  date_to: string;
  confirmed: boolean;
  fee_agreed: number;
}

// ─── FLEET ────────────────────────────────────────────────────────────────────

export type FleetVehicleType = 'car' | 'van' | 'minibus' | 'coach' | 'tuk_tuk' | 'boat';

export interface Vehicle {
  id: string;
  type: FleetVehicleType;
  registration: string;
  capacity_adults: number;
  make: string;
  model: string;
  year: number;
  air_conditioned: boolean;
  owner: 'own_fleet' | string;
  insurance_expiry: string;
  last_service_date: string;
  is_available: boolean;
  notes?: string;
}

export interface Driver {
  id: string;
  full_name: string;
  phone: string;
  whatsapp?: string;
  license_number: string;
  license_expiry: string;
  languages: string[];
  vehicle_id?: string;
  rating: number;
  daily_rate: number;
  currency: Currency;
  is_available: boolean;
  notes?: string;
  created_at: string;
}

export interface TransferAssignment {
  id: string;
  reservation_id: string;
  vehicle_id: string;
  driver_id: string;
  date: string;
  pickup_time: string;
  pickup_location: string;
  dropoff_location: string;
  flight_number?: string;
  pax_count: number;
  confirmed: boolean;
  notes?: string;
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
