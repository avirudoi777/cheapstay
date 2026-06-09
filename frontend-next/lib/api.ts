import type { CitySearchResponse, Suggestion } from './types';

function getBase(): string {
  if (typeof window === 'undefined') {
    // Server-side: use env var or localhost
    return process.env.BACKEND_URL ?? 'http://localhost:8000';
  }
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : '/api';
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

export async function getSuggestions(q: string): Promise<Suggestion[]> {
  try {
    const res = await fetch(`${getBase()}/suggest?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return res.json();
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
