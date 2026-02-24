export interface Listing {
  id: string;
  landlord_id: string;
  title: string;
  description: string;
  address: string;
  rent_xlm: number;
  bedrooms: number;
  bathrooms: number;
  furnished?: boolean;
  pet_friendly?: boolean;
  latitude?: number;
  longitude?: number;
  status: "active" | "inactive" | "deleted";
  view_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
}

export type {
  // Database models
  ListingRow,
  ListingInsert,
  ListingUpdate,
  ListingAmenity,
  ListingAmenityRow,
  ListingAmenityInsert,
  ListingWithLandlord,
  ListingWithAmenities,
  ListingDetail,
  ListingStatus,
} from '@/lib/types/database'

export interface ListingSearchParams {
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  radius?: string; // e.g., "5km"
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[]; // comma-separated or array
  search?: string; // full-text search query
  sortBy?:
    | "price"
    | "created_at"
    | "bedrooms"
    | "bathrooms"
    | "views"
    | "favorites"
    | "recommended";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ListingSearchResult {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Rating {
  id: string
  rater_id: string
  ratee_id: string
  listing_id?: string
  interaction_id?: string
  rating: number
  review_text?: string
  is_verified: boolean
  status: 'published' | 'flagged' | 'archived'
  created_at: string
  updated_at: string
  rater?: {
    full_name: string
    avatar_url: string
  }
}
