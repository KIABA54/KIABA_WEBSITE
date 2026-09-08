export type Gender = "Homme" | "Femme" | "Transgenre";
export type FormulaId = "STANDARD" | "PRO" | "PRO_PLUS" | "VIP";
export type AdStatus = "PENDING_PAYMENT" | "ONLINE" | "OFFLINE" | "DELETED";
export type ContactChannel = "WHATSAPP" | "CALL" | "BOTH";
export type AcceptedClient = "HOMME" | "FEMME" | "TRANSGENRE" | "TOUS";

export interface User {
  id: string;
  username: string;
  email: string;
  birth_date: string;
  gender: Gender;
  profile_photo_url: string;
  is_verified?: boolean;
  free_ad_eligible: boolean;
  created_at: string;
}

export interface AdPhoto {
  id: string;
  ad_id: string;
  photo_url: string;
  display_order: number;
}

export interface Ad {
  id: string;
  user_id: string;
  user?: {
    username: string;
    profile_photo_url: string;
    gender: Gender;
  };
  title: string;
  description: string;
  city: string;
  address: string;
  phone_number: string;
  contact_channels: ContactChannel;
  accepted_clients: AcceptedClient;
  category: string;
  subcategories: string[];
  formula: FormulaId;
  status: AdStatus;
  is_boosted: boolean;
  boosted_at?: string | null;
  expires_at: string;
  highlight_expires_at?: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
}

export interface Session {
  userId: string;
  email: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  ad_id?: string;
  geniuspay_reference?: string;
  type: "NEW_AD" | "BOOST" | "EDIT" | "RENEWAL";
  amount_fcfa: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  payment_method?: string;
  customer_phone?: string;
  metadata?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}
