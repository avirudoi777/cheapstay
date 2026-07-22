// GA4 event tracking — calls window.gtag if GA_ID is configured.
// Add NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX to Vercel env vars to activate.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

type Params = Record<string, string | number | boolean | null | undefined>;

function track(event: string, params?: Params) {
  if (typeof window === 'undefined' || !window.gtag || !process.env.NEXT_PUBLIC_GA_ID) return;
  window.gtag('event', event, params);
}

export const analytics = {
  search(destination: string, checkin: string, checkout: string, nights: number, adults: number) {
    track('search', { destination, checkin, checkout, nights, adults });
  },

  hotelBook(hotelName: string, platform: string, price: number | null, destination: string | null) {
    track('hotel_book_click', {
      hotel_name: hotelName,
      platform,
      price: price ?? 0,
      destination: destination ?? '',
    });
  },

  hotelSecondaryClick(hotelName: string, platform: string) {
    track('hotel_secondary_click', { hotel_name: hotelName, platform });
  },

  creditCardClick(cardName: string, cardBank: string) {
    track('credit_card_click', { card_name: cardName, card_bank: cardBank });
  },

  travelToolClick(toolName: string) {
    track('travel_tool_click', { tool_name: toolName });
  },

  travelGearClick(productName: string, badge: string) {
    track('travel_gear_click', { product_name: productName, badge });
  },

  destinationClick(city: string) {
    track('popular_destination_click', { city });
  },

  filterApplied(filterType: string, value: string) {
    track('filter_applied', { filter_type: filterType, value });
  },

  consultBookClick(location: 'hero' | 'cta_bottom') {
    track('consult_book_click', { location });
  },

  vpnAffiliateClick(affiliate: string, pageLocation: string) {
    track('vpn_affiliate_click', { affiliate, location: pageLocation });
  },

  signUp(method: 'google' | 'email') {
    track('sign_up', { method });
  },

  login(method: 'google' | 'email') {
    track('login', { method });
  },

  onboardingComplete(styles: string, budget: string, trips: number, hasPassport: boolean) {
    track('onboarding_complete', { travel_styles: styles, budget, trips_per_year: trips, has_passport: hasPassport });
  },

  onboardingSkipped(atStep: number) {
    track('onboarding_skipped', { step: atStep });
  },

  blogScroll(depth: '50' | '100', title: string, slug: string) {
    track(`blog_read_${depth}`, { article_title: title, slug });
  },
};
