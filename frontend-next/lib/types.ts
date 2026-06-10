export interface Hotel {
  name: string;
  image_url: string | null;
  rating: string | null;
  review_label: string | null;
  review_count: string | null;
  stars: number | null;
  location: string | null;
  original_price: string | null;
  nights: number;
  amenities: string[];
  review_snippet: string | null;
  deal_badge: 'hot' | 'deal' | null;
  agoda_price: number | null;
  agoda_url: string | null;
  hl_price: number | null;
  hl_url: string | null;
  best_platform: 'agoda' | 'hotellook';
  price: number | null;
  booking_url: string | null;
  total_price: number | null;
}

export interface CitySearchResponse {
  hotels: Hotel[];
  total_agoda: number;
  cached_count: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

export interface Suggestion {
  name: string;
  city: string;
  country: string;
  is_city: boolean;
}

export interface FilterState {
  sort: 'best' | 'price_asc' | 'price_desc' | 'rating';
  stars: Set<number>;
  minRating: number;
  minPrice: number;
  maxPrice: number;
  hotelSearch: string;
}

export const EMPTY_FILTERS: FilterState = {
  sort: 'best',
  stars: new Set(),
  minRating: 0,
  minPrice: 0,
  maxPrice: Infinity,
  hotelSearch: '',
};
