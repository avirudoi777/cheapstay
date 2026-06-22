'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import VisaBanner from '@/components/VisaBanner';
import type { ItineraryOption, FlightSegment } from '@/app/api/flights/itinerary/route';
import FlightBookingModal from '@/components/FlightBookingModal';

interface FlightOffer {
  origin: string;
  destination: string;
  price: number;
  airline: string;
  flight_number: string;
  departure_at: string;
  return_at?: string;
  transfers: number;
  duration: number;
  link: string;
}

interface Props {
  fromCode: string;
  toCode: string;
  fromName: string;
  toName: string;
  depart: string;
  ret: string;
  onClear: () => void;
  passportCodes: string[];
}

function validDate(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function fmtTime(iso: string | undefined | null): string {
  const d = validDate(iso);
  if (!d) return '—';
  return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtDur(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function buildBookUrl(offer: FlightOffer) {
  if (offer.link) {
    const sep = offer.link.includes('?') ? '&' : '?';
    return `https://www.aviasales.com${offer.link}${sep}marker=537802`;
  }
  const p = new URLSearchParams({ origin: offer.origin, destination: offer.destination, adults: '1', marker: '537802' });
  if (offer.departure_at) p.set('depart_date', offer.departure_at.slice(0, 10));
  return `https://www.aviasales.com/search/?${p}`;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="space-y-2">
          <div className="h-7 w-16 bg-gray-200 rounded-lg" />
          <div className="h-3 w-10 bg-gray-100 rounded" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="h-px bg-gray-200" />
          <div className="h-3 w-20 bg-gray-100 rounded mx-auto" />
        </div>
        <div className="space-y-2">
          <div className="h-7 w-16 bg-gray-200 rounded-lg" />
          <div className="h-3 w-10 bg-gray-100 rounded" />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="space-y-2 text-right">
            <div className="h-7 w-16 bg-gray-200 rounded-lg ml-auto" />
            <div className="h-3 w-24 bg-gray-100 rounded ml-auto" />
          </div>
          <div className="h-10 w-16 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

const AIRLINES: Record<string, string> = {
  TG: 'Thai Airways',    FD: 'AirAsia',          DD: 'Nok Air',
  SL: 'Thai Lion Air',   JL: 'Japan Airlines',    NH: 'ANA',
  SQ: 'Singapore Air',   EK: 'Emirates',          QR: 'Qatar Airways',
  CX: 'Cathay Pacific',  MH: 'Malaysia Airlines', GA: 'Garuda',
  VN: 'Vietnam Airlines',KE: 'Korean Air',         OZ: 'Asiana',
  CI: 'China Airlines',  BR: 'EVA Air',            TK: 'Turkish Airlines',
  BA: 'British Airways', LH: 'Lufthansa',          AF: 'Air France',
  KL: 'KLM',             AA: 'American',           DL: 'Delta',
  UA: 'United',          AY: 'Finnair',            VS: 'Virgin Atlantic',
  ET: 'Ethiopian',       EY: 'Etihad',             WY: 'Oman Air',
  MS: 'EgyptAir',        IB: 'Iberia',             LX: 'Swiss',
  OS: 'Austrian',        SK: 'SAS',                AZ: 'ITA Airways',
  TP: 'TAP Air Portugal',LA: 'LATAM',              G3: 'GOL',
  CM: 'Copa Airlines',   AV: 'Avianca',            AM: 'Aeroméxico',
};

function fmtSegTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtSegDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function layoverMins(arrAt: string, depAt: string): string {
  const diff = new Date(depAt).getTime() - new Date(arrAt).getTime();
  if (diff <= 0) return '';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function SegmentTimeline({ itinerary, bookUrl }: { itinerary: ItineraryOption; bookUrl: string }) {
  return (
    <div className="px-5 pt-4 pb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Full itinerary · {itinerary.totalDuration}
        </p>
        {itinerary.price > 0 && (
          <p className="text-xs text-gray-400">Live price: <span className="font-bold text-gray-700">${itinerary.price}</span></p>
        )}
      </div>

      <div className="space-y-0">
        {itinerary.segments.map((seg: FlightSegment, si: number) => {
          const nextSeg = itinerary.segments[si + 1];
          const layover = nextSeg ? layoverMins(seg.arrAt, nextSeg.depAt) : '';
          const depDate = fmtSegDate(seg.depAt);
          const arrDate = fmtSegDate(seg.arrAt);

          return (
            <div key={si}>
              {/* Leg row */}
              <div className="flex items-stretch gap-0">
                {/* Left timeline dot + line */}
                <div className="flex flex-col items-center mr-3 pt-0.5" style={{ width: 16 }}>
                  <div className="w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: '#1D9E75', background: '#fff' }} />
                  <div className="flex-1 w-px" style={{ background: '#E5E7EB', minHeight: 32 }} />
                  <div className="w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: '#1D9E75', background: '#fff' }} />
                </div>

                {/* Leg content */}
                <div className="flex-1 pb-2">
                  {/* Departure row */}
                  <div className="flex items-baseline gap-2 mb-auto">
                    <span className="text-sm font-extrabold tabular-nums text-gray-900">{fmtSegTime(seg.depAt)}</span>
                    <span className="text-sm font-bold text-gray-800">{seg.depCode}</span>
                    <span className="text-xs text-gray-400 hidden sm:inline">{depDate}</span>
                  </div>

                  {/* Leg info (centered) */}
                  <div className="my-1.5 flex items-center gap-2">
                    <span className="text-xs text-gray-400">{seg.duration}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs font-semibold text-gray-500">{seg.airline}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-400">{seg.flightNumber}</span>
                  </div>

                  {/* Arrival row */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-extrabold tabular-nums text-gray-900">{fmtSegTime(seg.arrAt)}</span>
                    <span className="text-sm font-bold text-gray-800">{seg.arrCode}</span>
                    <span className="text-xs text-gray-400 hidden sm:inline">{arrDate}</span>
                  </div>
                </div>
              </div>

              {/* Layover pill */}
              {layover && (
                <div className="flex items-center gap-2 ml-7 my-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: '#F1F5F9', color: '#64748B' }}>
                    <span>🚶</span>
                    <span>Layover in {nextSeg.depCode} · {layover}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex justify-end">
        <a href={bookUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs font-bold hover:underline" style={{ color: '#1D9E75' }}>
          Book this flight on Aviasales →
        </a>
      </div>
    </div>
  );
}

export default function FlightResults({ fromCode, toCode, fromName, toName, depart, ret, onClear, passportCodes }: Props) {
  const [offers, setOffers] = useState<FlightOffer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scope, setScope] = useState<'exact' | 'month' | 'open' | ''>('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [bookingOffer, setBookingOffer] = useState<{ date: string } | null>(null);
  const [itineraries, setItineraries] = useState<ItineraryOption[] | null>(null);
  const [itinLoading, setItinLoading] = useState(false);
  const [itinError, setItinError] = useState('');

  const loadItinerary = useCallback((depDate: string) => {
    setItineraries(null);
    setItinError('');
    setItinLoading(true);
    const date = depDate?.slice(0, 10) || depart;
    fetch(`/api/flights/itinerary?from=${fromCode}&to=${toCode}&depart=${date}`)
      .then(r => r.json())
      .then(json => {
        if (json.error === 'no_credentials') setItinError('setup');
        else if (json.error) setItinError('failed');
        else setItineraries(json.itineraries ?? []);
      })
      .catch(() => setItinError('failed'))
      .finally(() => setItinLoading(false));
  }, [fromCode, toCode, depart]);

  const fallbackUrl = (() => {
    const p = new URLSearchParams({ origin: fromCode, destination: toCode, depart_date: depart, adults: '1', marker: '537802' });
    if (ret) p.set('return_date', ret);
    return `https://www.aviasales.com/search/?${p}`;
  })();

  const departLabel = new Date(depart + 'T12:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const retLabel = ret
    ? new Date(ret + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : '';

  useEffect(() => {
    setLoading(true);
    setOffers(null);
    setError('');

    const qs = new URLSearchParams({ from: fromCode, to: toCode, depart });
    if (ret) qs.set('return', ret);

    fetch(`/api/flights/search?${qs}`)
      .then(r => r.json())
      .then(json => {
        if (json.data?.length) console.log('[flights] scope:', json.scope, 'sample:', JSON.stringify(json.data[0]));
        if (json.error === 'no_token')       setError('no_token');
        else if (json.error)                 setError('search_failed');
        else if (!json.data?.length)         setError('no_results');
        else { setOffers(json.data); setScope(json.scope ?? ''); }
      })
      .catch(() => setError('search_failed'))
      .finally(() => setLoading(false));
  }, [fromCode, toCode, depart, ret]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 mb-2">
      {/* Header row */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
            <span>{fromName}</span>
            <span className="text-gray-300">→</span>
            <span>{toName}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {departLabel}
            {retLabel && <span> · Return {retLabel}</span>}
            {!ret && <span> · One way</span>}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[10px] text-gray-400 hidden sm:block">Powered by Aviasales</span>
          <button onClick={onClear}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
            ✕ Clear
          </button>
        </div>
      </div>

      {/* Visa requirements — show banner if passport saved, prompt if not */}
      {passportCodes.length > 0 ? (
        <VisaBanner passportCodes={passportCodes} city={toName} />
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <span className="text-xl flex-shrink-0">🛂</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700">Do you need a visa for {toName}?</p>
            <p className="text-xs text-gray-400 mt-0.5">Add your passport to see entry requirements instantly.</p>
          </div>
          <Link href="/account" className="text-xs font-bold whitespace-nowrap hover:underline flex-shrink-0"
            style={{ color: '#1D9E75' }}>
            Add passport →
          </Link>
        </div>
      )}

      {/* Subtle cache notice — only when results aren't for exact date */}
      {!loading && offers && scope !== 'exact' && (
        <p className="text-xs text-gray-400 mb-3 -mt-1">
          Showing cheapest prices found in {new Date(depart + 'T12:00').toLocaleString('en', { month: 'long' })} — dates shown on each card.{' '}
          <a href={fallbackUrl} target="_blank" rel="noopener noreferrer"
            className="font-semibold hover:underline" style={{ color: '#1D9E75' }}>
            Check live prices on Aviasales →
          </a>
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* No API token configured */}
      {!loading && error === 'no_token' && (
        <div className="rounded-2xl border border-blue-200 p-6 text-center" style={{ background: '#EFF6FF' }}>
          <p className="text-sm font-bold text-blue-900 mb-1">Flight search needs setup</p>
          <p className="text-xs text-blue-600 mb-4">
            Add <code className="bg-blue-100 px-1 rounded font-mono">TRAVELPAYOUTS_API_TOKEN</code> from your Travelpayouts dashboard to enable in-page results.
          </p>
          <a href={fallbackUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#1D9E75' }}>
            Search on Aviasales →
          </a>
        </div>
      )}

      {/* No results */}
      {!loading && error === 'no_results' && (
        <div className="rounded-2xl border border-gray-200 p-6 text-center bg-gray-50">
          <p className="text-2xl mb-2">✈️</p>
          <p className="text-sm font-bold text-gray-800 mb-1">This route isn&apos;t in the price cache yet</p>
          <p className="text-xs text-gray-500 mb-4">
            The Travelpayouts cache only covers frequently searched routes.{' '}
            Aviasales has live prices for all routes — click below to search directly.
          </p>
          <a href={fallbackUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
            Search live prices on Aviasales →
          </a>
          <p className="text-xs text-gray-400 mt-3">Opens Aviasales with your route pre-filled · affiliate link</p>
        </div>
      )}

      {/* Error */}
      {!loading && error === 'search_failed' && (
        <div className="rounded-2xl border border-red-100 p-4 text-center bg-red-50">
          <p className="text-sm text-red-600">
            Search failed.{' '}
            <a href={fallbackUrl} target="_blank" rel="noopener noreferrer"
              className="underline font-semibold">
              Try on Aviasales →
            </a>
          </p>
        </div>
      )}

      {/* Flight cards */}
      {!loading && offers && (
        <div className="space-y-3">
          {offers.map((offer, i) => {
            const depTime = fmtTime(offer.departure_at);
            const depD = validDate(offer.departure_at);
            const arrTime = depD && offer.duration
              ? fmtTime(new Date(depD.getTime() + offer.duration * 60000).toISOString())
              : '—';
            const airlineName = AIRLINES[offer.airline] ?? offer.airline;
            const bookUrl = buildBookUrl(offer);
            const showDate = scope !== 'exact';
            const offerD = validDate(offer.departure_at);
            const offerDate = showDate && offerD
              ? offerD.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              : null;

            return (
              <div key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {i === 0 && (
                  <div className="px-5 py-1.5 text-xs font-bold flex items-center gap-1.5"
                    style={{ background: '#F0FBF7', color: '#1D9E75' }}>
                    <span>★</span> Cheapest option
                  </div>
                )}
                <div className="p-5 pb-0">
                  <div className="flex items-center gap-3 sm:gap-5">
                    {/* Departure */}
                    <div className="text-center min-w-[52px]">
                      <p className="text-2xl font-extrabold text-gray-900 leading-none tabular-nums">{depTime}</p>
                      {offerDate && <p className="text-[10px] font-bold mt-0.5" style={{ color: '#F59E0B' }}>{offerDate}</p>}
                      <p className="text-xs font-semibold text-gray-400 mt-0.5">{offer.origin}</p>
                    </div>

                    {/* Flight path indicator */}
                    <div className="flex-1 flex flex-col items-center min-w-0">
                      <p className="text-xs text-gray-400 mb-1">{fmtDur(offer.duration)}</p>
                      <div className="w-full flex items-center gap-1">
                        <div className="h-px flex-1 bg-gray-200" />
                        {offer.transfers > 0
                          ? Array.from({ length: offer.transfers }).map((_, j) => (
                              <div key={j} className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                            ))
                          : <span className="text-gray-300 text-sm flex-shrink-0">✈</span>
                        }
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                      {offer.transfers === 0 ? (
                        <p className="text-xs text-gray-400 mt-1">Direct</p>
                      ) : (
                        <button
                          onClick={() => {
                            if (expanded === i) {
                              setExpanded(null);
                            } else {
                              setExpanded(i);
                              loadItinerary(offer.departure_at);
                            }
                          }}
                          className="text-xs mt-1 font-semibold hover:underline transition-colors"
                          style={{ color: expanded === i ? '#1D9E75' : '#6b7280' }}>
                          {offer.transfers} stop{offer.transfers > 1 ? 's' : ''} {expanded === i ? '▲' : '▼'}
                        </button>
                      )}
                    </div>

                    {/* Arrival */}
                    <div className="text-center min-w-[52px]">
                      <p className="text-2xl font-extrabold text-gray-900 leading-none tabular-nums">{arrTime}</p>
                      <p className="text-xs font-semibold text-gray-400 mt-0.5">{offer.destination}</p>
                    </div>

                    {/* Price + Book */}
                    <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-gray-900 leading-none">${offer.price}</p>
                        <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">
                          {airlineName} · {offer.airline}{offer.flight_number}
                        </p>
                      </div>
                      <button
                        onClick={() => setBookingOffer({ date: offer.departure_at?.slice(0, 10) || depart })}
                        className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
                        Book
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded itinerary */}
                {expanded === i && offer.transfers > 0 && (
                  <div className="border-t border-gray-100">
                    {itinLoading && (
                      <div className="px-5 py-4 space-y-3 animate-pulse">
                        {Array.from({ length: offer.transfers + 1 }).map((_, s) => (
                          <div key={s}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-8 bg-gray-100 rounded" />
                              <div className="flex-1 h-px bg-gray-100" />
                              <div className="w-10 h-8 bg-gray-100 rounded" />
                            </div>
                            {s < offer.transfers && <div className="ml-5 mt-2 w-40 h-5 bg-gray-100 rounded" />}
                          </div>
                        ))}
                      </div>
                    )}

                    {itinError === 'setup' && (
                      <div className="px-5 py-4 text-center">
                        <p className="text-xs font-bold text-gray-700 mb-1">Itinerary details need setup</p>
                        <p className="text-xs text-gray-400 mb-3">
                          Add <code className="bg-gray-100 px-1 rounded">AMADEUS_API_KEY</code> and{' '}
                          <code className="bg-gray-100 px-1 rounded">AMADEUS_API_SECRET</code> to your Vercel environment variables.{' '}
                          Free at <a href="https://developers.amadeus.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#1D9E75' }}>developers.amadeus.com</a>
                        </p>
                        <a href={bookUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-bold hover:underline" style={{ color: '#1D9E75' }}>
                          See full itinerary on Aviasales →
                        </a>
                      </div>
                    )}

                    {itinError === 'failed' && (
                      <div className="px-5 py-3 flex items-center justify-between">
                        <p className="text-xs text-gray-400">Could not load itinerary details.</p>
                        <a href={bookUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-bold hover:underline flex-shrink-0" style={{ color: '#1D9E75' }}>
                          See on Aviasales →
                        </a>
                      </div>
                    )}

                    {!itinLoading && !itinError && itineraries && itineraries.length > 0 && (
                      <SegmentTimeline itinerary={itineraries[0]} bookUrl={bookUrl} />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Footer attribution */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">Prices are estimates. Final price confirmed at booking.</p>
            <a href={fallbackUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold hover:underline"
              style={{ color: '#1D9E75' }}>
              See all flights on Aviasales →
            </a>
          </div>
        </div>
      )}

      <FlightBookingModal
        isOpen={!!bookingOffer}
        onClose={() => setBookingOffer(null)}
        origin={fromCode}
        destination={toCode}
        departureDate={bookingOffer?.date || depart}
        returnDate={ret || undefined}
        fromName={fromName}
        toName={toName}
      />
    </div>
  );
}
