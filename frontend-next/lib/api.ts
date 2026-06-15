import type { CitySearchResponse, Suggestion } from './types';

function getBase(): string {
  if (typeof window === 'undefined') {
    // Server-side (SSR/RSC): use private env var
    return process.env.BACKEND_URL ?? 'http://localhost:8000';
  }
  // Client-side: call Railway directly to avoid Vercel's proxy timeout (25s > Vercel limit)
  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  // NEXT_PUBLIC_BACKEND_URL is injected at build time by Vercel
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? '/api';
}

export interface CitySearchParams {
  location: string;
  checkin: string;
  checkout: string;
  adults: number;
  offset?: number;
  limit?: number;
  force_refresh?: boolean;
  hotel_name?: string;
}

export async function searchCity(params: CitySearchParams): Promise<CitySearchResponse> {
  const res = await fetch(`${getBase()}/search-city`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ limit: 20, offset: 0, ...params }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await res.json().then((d) => d.detail).catch(() => res.statusText);
    throw new Error(detail ?? 'Search failed');
  }
  return res.json();
}

const _CITY_TYPES  = new Set(['city','town','village','district','county','state']);
const _HOTEL_TYPES = new Set(['hotel','house','tourism','hostel','motel','guest_house']);

async function _photon(q: string, osmTag?: string, limit = 8): Promise<Suggestion[]> {
  const params = new URLSearchParams({ q, limit: String(limit), lang: 'en' });
  if (osmTag) params.set('osm_tag', osmTag);
  const res = await fetch(`https://photon.komoot.io/api/?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.features ?? []) as Suggestion[];
}

export async function getSuggestions(q: string): Promise<Suggestion[]> {
  try {
    const [cityRaw, hotelRaw] = await Promise.all([
      _photon(q, undefined, 8),
      _photon(q, 'tourism:hotel', 10),
    ]);

    const seen = new Set<string>();
    const results: Suggestion[] = [];

    for (const f of cityRaw as any[]) {
      const p = f.properties ?? {};
      const osmVal = p.osm_value ?? p.type ?? '';
      const name = (p.name ?? '').trim();
      if (name && !seen.has(name) && _CITY_TYPES.has(osmVal)) {
        seen.add(name);
        results.push({ name, city: name, country: p.country ?? '', is_city: true });
      }
    }

    for (const f of hotelRaw as any[]) {
      const p = f.properties ?? {};
      const osmVal = p.osm_value ?? p.type ?? '';
      const name = (p.name ?? '').trim();
      const city = p.city ?? p.state ?? '';
      if (name && !seen.has(name) && _HOTEL_TYPES.has(osmVal)) {
        seen.add(name);
        results.push({ name, city, country: p.country ?? '', is_city: false });
      }
    }

    return results.slice(0, 10);
  } catch {
    return [];
  }
}

export interface Config {
  credit_card_rate: number;
  agoda_affiliate_id: string;
  travelpayouts_token: string;
  travelpayouts_marker: string;
  sites: Record<string, { rate: number }>;
}

export async function getConfig(): Promise<Config | null> {
  try {
    const res = await fetch(`${getBase()}/config`);
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function saveConfig(payload: Partial<Config>): Promise<boolean> {
  try {
    const res = await fetch(`${getBase()}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
