// Maps a /fly-to/[country] slug to the matching /hotels/[city] slug, for
// cross-linking between the two page types. Only include a pair here once
// both pages actually exist — this file is intentionally not exhaustive.
export const FLY_TO_HOTEL_MAP: Record<string, { citySlug: string; cityName: string }> = {
  thailand:     { citySlug: 'bangkok',           cityName: 'Bangkok' },
  indonesia:    { citySlug: 'bali',              cityName: 'Bali' },
  japan:        { citySlug: 'tokyo',             cityName: 'Tokyo' },
  vietnam:      { citySlug: 'ho-chi-minh-city',  cityName: 'Ho Chi Minh City' },
  singapore:    { citySlug: 'singapore',         cityName: 'Singapore' },
  uae:          { citySlug: 'dubai',             cityName: 'Dubai' },
  india:        { citySlug: 'delhi',             cityName: 'Delhi' },
  'south-korea': { citySlug: 'seoul',            cityName: 'Seoul' },
};
