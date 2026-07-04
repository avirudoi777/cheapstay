// Single source of truth for /fly-to/[country] pages.
// To add a new country: add one object here. No other file needs to change.
// Fields marked last_verified: null mean content has NOT been reviewed yet.

export interface FlyToDestination {
  name: string;
  capital: string;
  flag: string;
  airportCode: string;
  airportName: string;
  img: string;
  // Accuracy tracking
  last_verified: string | null;   // ISO date of last human review, null = unverified
  sources: string[];              // URLs used to verify the content
  recheck_note?: string;          // hint for next reviewer (e.g. "recheck monthly")
  entry: {
    visaFreeCountries: string;
    visaOnArrival: string;
    evisa: string;
    passportValidity: string;
    notes: string;
  };
  health: {
    vaccines: string;
    yellowFever: string;
    malaria: string;
    notes: string;
  };
  arrival: {
    currency: string;
    simCard: string;
    transport: string;
    customs: string;
  };
  faqs: { q: string; a: string }[];
}

export const FLY_TO: Record<string, FlyToDestination> = {

  thailand: {
    name: 'Thailand',
    capital: 'Bangkok',
    flag: '🇹🇭',
    airportCode: 'BKK',
    airportName: 'Suvarnabhumi Airport (BKK)',
    img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&h=600&fit=crop&auto=format',
    last_verified: '2026-07-04',
    // Recheck monthly — Cabinet approved a tiered visa rollback on May 19 2026 but
    // it takes effect only 15 days after Royal Gazette publication, which had NOT
    // occurred as of late June 2026. Rules may change with short notice.
    recheck_note: 'Recheck monthly until Royal Gazette publishes new visa rules.',
    sources: [
      'https://thethaiger.com/guides/visa-information/thailand-visa-exemption',
      'https://en.wikipedia.org/wiki/Visa_policy_of_Thailand',
      'https://travelhealthpro.org.uk/country/221/thailand',
    ],
    entry: {
      visaFreeCountries:
        'Visa-free for 93 nationalities (60 days) as of July 2026. ' +
        'Important: Thailand\'s Cabinet approved a rollback on May 19, 2026 to a tiered system — ' +
        '30 days for most nationalities, 15 days for a few, and Visa on Arrival cut from 31 to 4 countries. ' +
        'This takes effect 15 days after Thai Royal Gazette publication, which had not happened as of late June 2026. ' +
        'Confirm current status before booking if your trip is more than a few weeks out.',
      visaOnArrival:
        'Currently available to approximately 19–31 nationalities (including India and China) for 15 days. ' +
        'Pending the Cabinet rollback above, this may be reduced to 4 countries — confirm before travel.',
      evisa:
        'Thailand e-Visa available via the official Thai e-Visa portal (thaievisa.go.th) for select nationalities. ' +
        'Processing typically 3–5 business days.',
      passportValidity:
        'Passport must be valid for at least 30 days beyond your planned departure date from Thailand ' +
        '(some airlines and border officers require 6 months — check your airline\'s policy).',
      notes:
        '⚠️ Thailand\'s visa rules are actively changing as of mid-2026. Always verify at the Royal Thai Embassy ' +
        'or IATA Travel Centre before booking.',
    },
    health: {
      vaccines:
        'No vaccinations are legally required for entry for most travelers. ' +
        'Hepatitis A, Typhoid, and routine vaccines (MMR, tetanus) are commonly recommended by travel clinics.',
      yellowFever:
        'A yellow fever vaccination certificate IS required if you are arriving from — or have transited more than ' +
        '12 hours through — a country with yellow fever transmission risk (parts of Sub-Saharan Africa and tropical ' +
        'South America). Without the certificate you may be denied entry or quarantined.',
      malaria:
        'Low risk in Bangkok and main tourist areas. Higher risk in forested border regions (Myanmar, Laos, Cambodia borders). ' +
        'Check CDC or WHO malaria maps for your specific itinerary.',
      notes:
        '⚠️ Health requirements sourced from NaTHNaC (travelhealthpro.org.uk) and Royal Thai Embassy guidance. ' +
        'Always verify with your doctor or travel clinic before departure.',
    },
    arrival: {
      currency: 'Thai Baht (THB). ATMs widely available. Best rates from Superrich or Vasu exchange booths in Bangkok.',
      simCard: 'AIS, DTAC, and True Move H SIM cards available at the airport arrivals hall (approx. 300–500 THB for 7–15 days unlimited data).',
      transport: 'Suvarnabhumi: Airport Rail Link (45 min to city, 45 THB) or metered taxi (300–500 THB to city, expressway toll extra). Grab available at designated pickup zone.',
      customs: '200 cigarettes or 250g tobacco duty-free. 1 litre alcohol. Declare cash over 450,000 THB.',
    },
    faqs: [
      {
        q: 'Do I need a visa to visit Thailand?',
        a: 'As of July 2026, 93 nationalities can enter Thailand visa-free for 60 days. However, Thailand\'s Cabinet approved a visa rollback in May 2026 that will reduce this to 30 days for most nationalities once published in the Royal Gazette. Confirm current rules at the Royal Thai Embassy before booking.',
      },
      {
        q: 'Is yellow fever vaccination required for Thailand?',
        a: 'Yes — a yellow fever certificate is required if you are arriving from, or have transited more than 12 hours through, a country with yellow fever transmission risk. This includes parts of Sub-Saharan Africa and tropical South America. Without the certificate you may be denied entry.',
      },
      {
        q: 'Do I need any other vaccinations for Thailand?',
        a: 'No vaccines are legally required for entry (beyond yellow fever from at-risk countries). Travel clinics commonly recommend Hepatitis A, Typhoid, and ensuring routine vaccines are up to date. Always consult your doctor before travel.',
      },
      {
        q: 'What is the cheapest way to get from Suvarnabhumi airport to Bangkok?',
        a: 'The Airport Rail Link is the fastest and cheapest — 45 THB to Phaya Thai station, about 30 minutes. Metered taxis cost around 300–500 THB plus expressway tolls.',
      },
      {
        q: 'Can I get a SIM card at Bangkok airport?',
        a: 'Yes — AIS, DTAC, and True Move H all have counters in the arrivals hall at Suvarnabhumi. Tourist SIMs with unlimited data typically cost 300–500 THB.',
      },
    ],
  },

  japan: {
    name: 'Japan',
    capital: 'Tokyo',
    flag: '🇯🇵',
    airportCode: 'NRT',
    airportName: 'Narita International Airport (NRT) / Haneda Airport (HND)',
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=600&fit=crop&auto=format',
    last_verified: null, // Not independently verified yet — leave [VERIFY] banners in place
    sources: [],
    entry: {
      visaFreeCountries: '[VERIFY: approx. 68 nationalities including US, UK, most EU, AU, CA enter visa-free — confirm current list at Japan Ministry of Foreign Affairs]',
      visaOnArrival: '[VERIFY: Japan does not offer visa on arrival — travelers not on the visa-exempt list must apply in advance]',
      evisa: '[VERIFY: Japan e-Visa available for some nationalities — check Japan e-Visa portal for eligibility]',
      passportValidity: '[VERIFY: passport must be valid for the duration of stay — confirm current requirement]',
      notes: '⚠️ Always verify at Japan Ministry of Foreign Affairs or IATA Travel Centre. Rules changed post-COVID and may continue to change.',
    },
    health: {
      vaccines: '[VERIFY: no vaccines legally required — Hepatitis A/B, Japanese Encephalitis (for rural/extended stays) commonly recommended]',
      yellowFever: '[VERIFY: yellow fever vaccination certificate not typically required for Japan — confirm current status]',
      malaria: '[VERIFY: Japan is considered malaria-free — no prophylaxis needed for most travelers]',
      notes: '⚠️ Verify current health entry requirements at Japan Ministry of Health and WHO before travel.',
    },
    arrival: {
      currency: 'Japanese Yen (JPY). Japan is still largely cash-based. ATMs at 7-Eleven and Japan Post accept foreign cards reliably.',
      simCard: 'IIJ, Mobal, and airport SIM vending machines available at Narita and Haneda arrivals. IC Card (Suica/Pasmo) recommended for transit.',
      transport: "Narita: Narita Express (N'EX) to Shinjuku ~90 min (3,070 JPY) or Limousine Bus (~90 min, ~3,200 JPY). Haneda: monorail to Hamamatsucho ~20 min (500 JPY).",
      customs: '200 cigarettes or 50 cigars duty-free. 3 bottles (760ml each) alcohol. Declare cash over 1 million JPY.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Japan?', a: "[VERIFY] Many nationalities — including US, UK, EU — can visit Japan visa-free for up to 90 days. Check Japan's Ministry of Foreign Affairs for your specific passport." },
      { q: 'Do I need any vaccinations for Japan?', a: '[VERIFY] No vaccinations are legally required to enter Japan. Routine vaccines and Hepatitis A are commonly recommended. Japanese Encephalitis vaccine is sometimes recommended for rural or extended stays.' },
      { q: 'Is Japan safe to visit?', a: 'Japan consistently ranks among the safest countries in the world. Crime rates are very low. The main risks for travelers are earthquakes and typhoons (seasonal).' },
      { q: 'Can I use my credit card in Japan?', a: 'Japan is still heavily cash-based, especially outside major cities and tourist areas. Always carry cash. 7-Eleven ATMs and Japan Post ATMs reliably accept foreign Visa/Mastercard.' },
      { q: 'What is the cheapest way from Narita airport to Tokyo?', a: "The Narita Express (N'EX) is the most convenient at around 3,070 JPY. The Keisei Skyliner is slightly cheaper (2,570 JPY). Highway buses (~1,000–1,500 JPY) are cheapest but slower." },
    ],
  },

  indonesia: {
    name: 'Indonesia',
    capital: 'Jakarta',
    flag: '🇮🇩',
    airportCode: 'DPS',
    airportName: 'Ngurah Rai International Airport, Bali (DPS)',
    img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&h=600&fit=crop&auto=format',
    last_verified: '2026-07-04',
    sources: [
      'https://www.travelvax.com.au/holiday-traveller/vaccination-requirements/indonesia',
      'https://www.gov.uk/foreign-travel-advice/indonesia/entry-requirements',
    ],
    entry: {
      visaFreeCountries: '[VERIFY: Indonesia offers visa-free entry to approx. 169 nationalities for 30 days — confirm at Indonesia immigration website]',
      visaOnArrival: '[VERIFY: Visa on Arrival available at major entry points for many nationalities — approx. USD 35 for 30 days, extendable once]',
      evisa: '[VERIFY: Indonesia e-VOA (electronic Visa on Arrival) available at molina.imigrasi.go.id — confirm current eligibility and pricing]',
      passportValidity: '[VERIFY: passport must be valid for at least 6 months beyond arrival — confirm current requirement]',
      notes: '⚠️ Indonesia immigration rules change. Verify at the official Directorate General of Immigration website or IATA Travel Centre.',
    },
    health: {
      vaccines: '[VERIFY: Hepatitis A, Typhoid, Rabies (for extended rural stays) commonly recommended — confirm with travel clinic]',
      yellowFever:
        'A yellow fever vaccination certificate is required only if you are arriving from a country with risk of yellow fever transmission — it is not required for most travelers. Confirm the current at-risk country list with Indonesian authorities or your travel clinic.',
      malaria: '[VERIFY: malaria risk exists in some outer islands (Papua, Maluku) but Bali is generally considered low risk — check CDC/WHO maps]',
      notes: '⚠️ Health requirements sourced from Travelvax and UK Government Indonesia travel advice. Always check with WHO, CDC, and your own doctor before traveling.',
    },
    arrival: {
      currency: 'Indonesian Rupiah (IDR). ATMs widely available in Bali and Jakarta. Avoid money changers on the street — use banks or official changers.',
      simCard: 'Telkomsel (most reliable coverage), XL, and Indosat SIM cards available at airport arrivals. Tourist SIM with 5–15GB data approx. 50,000–100,000 IDR.',
      transport: 'Bali (DPS): Metered taxi (Bluebird recommended) or Grab to Kuta ~150,000 IDR (20 min), Seminyak ~200,000 IDR. Pre-arranged hotel transfers also common.',
      customs: '200 cigarettes or 25 cigars duty-free. 1 litre alcohol (must be declared). Declare cash over USD 100,000.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Bali / Indonesia?', a: '[VERIFY] Many nationalities can get a Visa on Arrival (VOA) at Bali airport for approximately USD 35 for 30 days, extendable once. Some nationalities qualify for visa-free entry. Check Indonesia\'s official immigration site.' },
      { q: 'Is a yellow fever vaccination required for Indonesia?', a: 'A yellow fever certificate is only required if you are arriving from a country with yellow fever transmission risk — not for most travelers. Confirm the current list of at-risk countries with Indonesian authorities or your travel clinic before departure.' },
      { q: 'Do I need other vaccinations for Indonesia / Bali?', a: '[VERIFY] No vaccinations are legally required for most travelers. Hepatitis A, Typhoid, and routine vaccines are commonly recommended. Rabies vaccine is recommended for long-term or rural travel. Always confirm with your doctor.' },
      { q: 'Is Bali safe for tourists?', a: 'Bali is generally very safe for tourists. The main issues are traffic accidents (renting a scooter without experience is risky), petty theft in crowded areas, and the occasional scam around currency exchange.' },
      { q: 'How do I get from Bali airport to Seminyak or Ubud?', a: 'Use Grab (app-based, fixed price) or Bluebird metered taxis — avoid unlicensed drivers outside. Seminyak is about 20 minutes (~200,000 IDR), Ubud about 1.5 hours (~350,000–450,000 IDR).' },
    ],
  },

};
