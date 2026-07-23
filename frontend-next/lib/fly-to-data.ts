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
  // Live weather/clock widget + arrival map — coordinates are for the arrival
  // AIRPORT ITSELF, not the political capital or the wider city (they diverge
  // for Indonesia/Vietnam/UAE especially — see per-country comments below).
  timezone: string;   // IANA tz, e.g. 'Asia/Bangkok'
  lat: number;
  lng: number;
  // Accuracy tracking
  last_verified: string | null;   // ISO date of last human review, null = unverified
  sources: string[];              // URLs used to verify the content
  recheck_note?: string;          // hint for next reviewer (e.g. "recheck monthly")
  localApps?: {
    name: string;
    category: 'ride-share' | 'payment' | 'maps';
    note: string;
    url: string;   // real official site/app link
  }[];
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
    // Coordinates are for Suvarnabhumi Airport itself (BKK), not central Bangkok
    timezone: 'Asia/Bangkok',
    lat: 13.6900,
    lng: 100.7501,
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
    localApps: [
      { name: 'Grab', category: 'ride-share', note: 'Available at Suvarnabhumi’s designated pickup zone — the safest fixed-price option from the airport.', url: 'https://www.grab.com/th/' },
      { name: 'PromptPay', category: 'payment', note: 'Thailand’s national QR payment system — many shops and street vendors display a PromptPay QR code for instant bank transfers.', url: 'https://www.bot.or.th/en/our-roles/payment-systems/promptpay.html' },
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
    // Coordinates are for Narita Airport itself (NRT), not central Tokyo
    timezone: 'Asia/Tokyo',
    lat: 35.7719,
    lng: 140.3929,
    last_verified: '2026-07-04',
    sources: [
      'https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html',
      'https://travelhealthpro.org.uk/country/109/japan',
    ],
    localApps: [
      { name: 'GO', category: 'ride-share', note: 'Japan’s dominant taxi-hailing app — ride-share is limited compared to the West, but GO works with regular metered taxis and is widely used.', url: 'https://go.mo-t.com/en/' },
      { name: 'Suica', category: 'payment', note: 'Rechargeable IC card for trains, buses, and convenience stores — buy at the airport, essential for getting around.', url: 'https://www.jreast.co.jp/e/pass/suica.html' },
    ],
    entry: {
      visaFreeCountries:
        '68+ nationalities can enter visa-free for up to 90 days, including US, UK, all EU countries, Australia, Canada, New Zealand, South Korea, and Singapore. ' +
        'Check the Japan Ministry of Foreign Affairs for your specific passport.',
      visaOnArrival:
        'Japan does not offer visa on arrival. Travelers not on the visa-exempt list must obtain a visa from a Japanese embassy or consulate before departure.',
      evisa:
        'Japan e-Visa available for citizens of some countries — apply via the Japan e-Visa portal. Processing typically 5–7 business days. Check eligibility before applying.',
      passportValidity:
        'Passport must be valid for the duration of your intended stay. Japan does not require 6 months validity beyond arrival for most nationalities — but check with your airline, as some apply stricter rules.',
      notes: '⚠️ Verify current entry requirements at Japan Ministry of Foreign Affairs (mofa.go.jp) or IATA Travel Centre before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required to enter Japan for most travelers. ' +
        'Hepatitis A and routine vaccines (MMR, tetanus, flu) are commonly recommended by travel clinics. ' +
        'Japanese Encephalitis vaccine is sometimes recommended for rural stays or extended trips during transmission season (May–October).',
      yellowFever:
        'Yellow fever vaccination certificate is NOT required for Japan. Japan is not in a yellow-fever risk zone and does not share a border with endemic countries.',
      malaria:
        'Japan is considered malaria-free. No antimalarial medication is needed for travel to Japan.',
      notes:
        '⚠️ Health requirements sourced from NaTHNaC (travelhealthpro.org.uk). Always confirm with your doctor or travel clinic before departure.',
    },
    arrival: {
      currency: 'Japanese Yen (JPY). Japan is still largely cash-based — always carry cash. ATMs at 7-Eleven and Japan Post reliably accept foreign Visa/Mastercard. Airport ATMs also available.',
      simCard: 'SIM vending machines at Narita and Haneda arrivals (IIJ, Mobal, eConnect). IC Card (Suica/Pasmo) essential for trains and convenience stores — purchase at airport.',
      transport: "Narita: Narita Express (N'EX) to Shinjuku ~90 min (3,070 JPY) or Keisei Skyliner to Ueno ~41 min (2,570 JPY). Haneda: Tokyo Monorail to Hamamatsucho ~20 min (500 JPY). Limousine Bus also available from both airports.",
      customs: '200 cigarettes or 50 cigars duty-free. 3 bottles (760ml each) alcohol. Declare cash over 1 million JPY. Strict rules on certain medications — declare anything prescription.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Japan?', a: "68+ nationalities can visit Japan visa-free for up to 90 days, including US, UK, EU, Australia, and Canada. Check Japan's Ministry of Foreign Affairs (mofa.go.jp) for your specific passport." },
      { q: 'Do I need any vaccinations for Japan?', a: 'No vaccines are legally required to enter Japan. Routine vaccines and Hepatitis A are commonly recommended. Japanese Encephalitis is sometimes suggested for rural or extended stays. No yellow fever certificate required.' },
      { q: 'Is Japan safe to visit?', a: 'Japan consistently ranks among the safest countries in the world — very low crime, excellent infrastructure. Main natural hazards are earthquakes (prepare with the NHK World app) and typhoons (August–October).' },
      { q: 'Can I use my credit card in Japan?', a: 'Japan is still heavily cash-based, especially outside major cities. Always carry cash. 7-Eleven ATMs and Japan Post ATMs accept foreign Visa/Mastercard most reliably. Many smaller restaurants and local shops are cash-only.' },
      { q: 'What is the cheapest way from Narita airport to Tokyo?', a: "Highway buses (~1,000–1,500 JPY) are cheapest but slowest. Keisei Skyliner (~2,570 JPY to Ueno, 41 min) is the best value-speed combination. The Narita Express N'EX (~3,070 JPY) is convenient if you're staying near Shinjuku or Shibuya." },
    ],
  },

  indonesia: {
    name: 'Indonesia',
    capital: 'Jakarta',
    flag: '🇮🇩',
    airportCode: 'DPS',
    airportName: 'Ngurah Rai International Airport, Bali (DPS)',
    img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Ngurah Rai Airport itself (DPS), Bali — not Jakarta
    // (different timezone too: WITA, not WIB)
    timezone: 'Asia/Makassar',
    lat: -8.7482,
    lng: 115.1671,
    last_verified: '2026-07-04',
    sources: [
      'https://www.travelvax.com.au/holiday-traveller/vaccination-requirements/indonesia',
      'https://www.gov.uk/foreign-travel-advice/indonesia/entry-requirements',
    ],
    localApps: [
      { name: 'Grab', category: 'ride-share', note: 'Widely used across Bali — compare prices with Gojek before booking.', url: 'https://www.grab.com/id/' },
      { name: 'Gojek', category: 'ride-share', note: 'Indonesia-founded and often has better coverage in Bali than Grab — worth having both apps installed.', url: 'https://www.gojek.com/en-id/' },
      { name: 'GoPay', category: 'payment', note: 'Gojek’s e-wallet, accepted at cafes, parking, and small vendors — top up in-app.', url: 'https://www.gopay.co.id/' },
      { name: 'OVO', category: 'payment', note: 'A second popular local e-wallet, widely accepted alongside GoPay.', url: 'https://www.ovo.id/' },
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

  vietnam: {
    name: 'Vietnam',
    capital: 'Hanoi',
    flag: '🇻🇳',
    airportCode: 'SGN',
    airportName: 'Tan Son Nhat Airport, Ho Chi Minh City (SGN) / Noi Bai Airport, Hanoi (HAN)',
    img: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Tan Son Nhat Airport itself (SGN), Ho Chi Minh City — not Hanoi
    timezone: 'Asia/Ho_Chi_Minh',
    lat: 10.8188,
    lng: 106.6520,
    last_verified: '2026-07-04',
    sources: [
      'https://evisa.xuatnhapcanh.gov.vn',
      'https://travelhealthpro.org.uk/country/238/vietnam',
    ],
    localApps: [
      { name: 'Grab', category: 'ride-share', note: 'The safest fixed-price option in Ho Chi Minh City and Hanoi — avoid unmarked taxis, which are known to overcharge tourists.', url: 'https://www.grab.com/vn/' },
      { name: 'MoMo', category: 'payment', note: 'Vietnam’s leading e-wallet, widely used for cafes and convenience stores — mostly requires a local bank link, less useful for short visits.', url: 'https://momo.vn/' },
    ],
    entry: {
      visaFreeCountries:
        'As of August 2023, Vietnam extended visa-free access to 45 days for many nationalities including Germany, France, Italy, Spain, UK, Japan, South Korea, Denmark, Finland, Norway, Sweden, and Belarus. ' +
        'Other nationalities (including most ASEAN members) have bilateral visa-free arrangements of varying lengths. ' +
        'US citizens are NOT currently visa-free and must obtain an e-visa.',
      visaOnArrival:
        'Vietnam does not offer traditional visa on arrival — e-visa is the standard route for most nationalities not covered by bilateral visa-free arrangements.',
      evisa:
        'Vietnam e-visa available to citizens of ALL countries for up to 90 days (single or multiple entry) via evisa.xuatnhapcanh.gov.vn. Fee ~$25 USD. Processing typically 3 business days. Apply at least a week before travel.',
      passportValidity:
        'Passport must be valid for at least 6 months beyond your entry date.',
      notes: '⚠️ Always verify at Vietnam Immigration Department (xuatnhapcanh.gov.vn) or IATA Travel Centre before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required for entry for most travelers. ' +
        'Hepatitis A, Typhoid, and routine vaccines (MMR, tetanus) are commonly recommended. ' +
        'Japanese Encephalitis vaccine is sometimes recommended for rural or extended stays.',
      yellowFever:
        'A yellow fever vaccination certificate is required if you are arriving from — or have recently transited — a country with risk of yellow fever transmission (parts of Sub-Saharan Africa and tropical South America).',
      malaria:
        'Low risk in major cities (Ho Chi Minh City, Hanoi, Da Nang, Hoi An). Some risk in rural/forested areas, particularly in the Central Highlands and near the Cambodian border. Check CDC or WHO maps for your itinerary.',
      notes:
        '⚠️ Health requirements sourced from NaTHNaC (travelhealthpro.org.uk). Always confirm with your doctor or travel clinic before departure.',
    },
    arrival: {
      currency: 'Vietnamese Dong (VND). ATMs widely available in cities. USD is informally accepted in tourist areas but VND gives better rates. Exchange at banks or licensed gold shops in the city — not at the airport (poor rates).',
      simCard: 'Viettel, Vinaphone, and Vietnamobile SIM cards at airport arrivals and convenience stores. Tourist SIMs with 5–10GB data approx. 100,000–200,000 VND.',
      transport: 'Ho Chi Minh City (SGN): Grab to District 1 ~150,000–200,000 VND, 20–30 min. Metered taxis: Mai Linh (green) and Vinasun (white) are trustworthy — avoid unmarked taxis. Hanoi (HAN): Grab or metered taxi to Old Quarter ~250,000–350,000 VND, 30–45 min.',
      customs: '200 cigarettes or 250g tobacco duty-free. 1.5 litres spirits or 2 litres wine. Declare cash over USD 5,000.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Vietnam?', a: "Many nationalities can visit Vietnam visa-free for 45 days (as of 2023) — check Vietnam Immigration for your passport. US citizens need an e-visa (90 days, ~$25, apply at evisa.xuatnhapcanh.gov.vn). Processing takes ~3 business days." },
      { q: 'Do I need any vaccinations for Vietnam?', a: 'No vaccines are legally required for entry for most travelers. Hepatitis A, Typhoid, and routine vaccines are commonly recommended. Yellow fever certificate required if arriving from endemic countries. Confirm with your travel clinic.' },
      { q: 'Is Grab available in Vietnam?', a: 'Yes — Grab works well in Ho Chi Minh City and Hanoi and is the safest way to get a fixed-price ride from the airport. Always use Grab or reputable metered taxis (Mai Linh, Vinasun) — avoid unmarked taxis which overcharge tourists.' },
      { q: 'What is the currency in Vietnam and can I use USD?', a: 'The official currency is Vietnamese Dong (VND). USD is informally accepted in tourist areas but you will always get a better deal paying in VND. Exchange money at city banks or gold shops — the airport rate is poor.' },
      { q: 'Is Ho Chi Minh City or Hanoi better for a first visit?', a: 'Ho Chi Minh City is faster-paced, warmer year-round, and a better base for the Mekong Delta. Hanoi is the capital, older in character, and the gateway to Ha Long Bay. Both are excellent — depends on your onward itinerary.' },
    ],
  },

  uae: {
    name: 'UAE (Dubai)',
    capital: 'Abu Dhabi',
    flag: '🇦🇪',
    airportCode: 'DXB',
    airportName: 'Dubai International Airport (DXB)',
    img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Dubai International Airport itself (DXB), not Abu Dhabi
    timezone: 'Asia/Dubai',
    lat: 25.2532,
    lng: 55.3657,
    last_verified: '2026-07-04',
    sources: [
      'https://u.ae/en/information-and-services/visa-and-emirates-id/do-you-need-an-entry-permit-to-visit-the-uae',
      'https://www.gov.uk/foreign-travel-advice/united-arab-emirates/entry-requirements',
      'https://travelhealthpro.org.uk/country/233/united-arab-emirates',
    ],
    localApps: [
      { name: 'Careem', category: 'ride-share', note: 'The dominant ride-hailing app in Dubai, alongside Uber — both are reliable and widely used.', url: 'https://www.careem.com/' },
      { name: 'Uber', category: 'ride-share', note: 'Also widely available in Dubai — compare prices with Careem.', url: 'https://www.uber.com/ae/en/' },
    ],
    entry: {
      visaFreeCountries:
        'Citizens of 60+ countries receive a free visa on arrival valid for 30 days (extendable once for another 30 days), including US, UK, all EU countries, Australia, Canada, New Zealand, Japan, South Korea, Singapore, and most GCC nationals. ' +
        'GCC nationals have unrestricted access.',
      visaOnArrival:
        'Free 30-day visa on arrival for eligible nationalities at all UAE entry points including DXB. A 96-hour transit visa is also available for eligible travelers on layovers.',
      evisa:
        'UAE e-visa available for nationalities not covered by visa on arrival — apply via the ICP Smart Services portal (icp.gov.ae) or through Emirates/other UAE airlines. ' +
        'Processing typically 3–5 business days.',
      passportValidity:
        'Passport must be valid for at least 6 months beyond your arrival date.',
      notes: '⚠️ UAE visa rules vary by nationality and can change. Verify at the UAE ICP portal (icp.gov.ae) or IATA Travel Centre before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required for entry for most travelers. Routine vaccines (MMR, tetanus, hepatitis A) are recommended.',
      yellowFever:
        'A yellow fever vaccination certificate is required if you are arriving from — or have recently transited — a country with risk of yellow fever transmission. This applies to parts of Sub-Saharan Africa and tropical South America.',
      malaria:
        'The UAE is considered malaria-free. No antimalarial medication is needed for Dubai or any major UAE city.',
      notes:
        '⚠️ Health requirements sourced from NaTHNaC (travelhealthpro.org.uk) and UK Government UAE travel advice. Always confirm with your doctor before departure.',
    },
    arrival: {
      currency: 'UAE Dirham (AED), pegged to USD at ~3.67 AED/USD. ATMs widely available at DXB. Currency exchange counters in arrivals offer fair rates — better than many other airports.',
      simCard: 'du and Etisalat (e&) SIM counters in DXB arrivals hall. Tourist SIMs with data from ~50 AED. Note: VoIP calls (WhatsApp calls, FaceTime, Skype) are restricted in the UAE on local SIMs — use home roaming or a VPN for calls.',
      transport: 'Dubai Metro Red Line from Terminal 1 & 3 to central Dubai (15–35 min, ~15 AED) — cheapest option. Metered taxis (starting fare ~25 AED) to Downtown ~50–80 AED. Careem ride-hailing available.',
      customs: '200 cigarettes or 50 cigars duty-free. 4 litres alcohol for non-Muslims only (must be declared on arrival). Strict prohibitions on drugs, certain medications, and pork products. Declare cash over AED 100,000.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Dubai / UAE?', a: 'Citizens of 60+ countries — including US, UK, EU, Australia, Canada — receive a free 30-day visa on arrival at Dubai airport. Others require an e-visa applied for in advance via the UAE ICP portal. Check icp.gov.ae for your specific nationality.' },
      { q: 'Do I need any vaccinations for the UAE?', a: 'No vaccines are legally required for entry for most travelers. Yellow fever certificate required only if arriving from an endemic country. Routine vaccines recommended. Confirm with your travel clinic.' },
      { q: 'Can I drink alcohol in Dubai?', a: 'Alcohol is available in licensed hotels, restaurants, and bars in Dubai — widely available in tourist areas. It is illegal to drink in public or appear intoxicated in public. Non-Muslims can buy alcohol at licensed shops (e.g. MMI). Rules are stricter in Sharjah (dry emirate) and Abu Dhabi.' },
      { q: 'Do WhatsApp and Skype calls work in the UAE?', a: 'VoIP calls (WhatsApp calls, FaceTime, Skype voice/video) are blocked on UAE local SIM cards. Regular text messaging on WhatsApp works fine. Use your home country SIM with roaming for calls, or a VPN (though VPN legality is nuanced in the UAE).' },
      { q: 'What is the cheapest way from Dubai airport to the city?', a: 'Dubai Metro Red Line (~15 AED, 20–35 min to Downtown/Dubai Mall area) from Terminal 1 & 3 — cheapest and often fastest in traffic. Metered taxis cost ~50–100 AED to Downtown. Careem is also a good option.' },
    ],
  },

  singapore: {
    name: 'Singapore',
    capital: 'Singapore',
    flag: '🇸🇬',
    airportCode: 'SIN',
    airportName: 'Singapore Changi Airport (SIN)',
    img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Changi Airport itself (SIN), not central Singapore
    timezone: 'Asia/Singapore',
    lat: 1.3644,
    lng: 103.9915,
    last_verified: '2026-07-04',
    sources: [
      'https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa-requirements',
      'https://travelhealthpro.org.uk/country/196/singapore',
    ],
    localApps: [
      { name: 'Grab', category: 'ride-share', note: 'Available at designated pickup zones outside Changi arrivals — the standard fixed-price ride app, also covers GrabPay for cashless payment.', url: 'https://www.grab.com/sg/' },
      { name: 'PayNow', category: 'payment', note: 'Singapore is one of the most cashless cities in Asia — PayNow QR codes are accepted at most hawker stalls and shops alongside credit cards.', url: 'https://www.abs.org.sg/consumer-banking/pay-now' },
    ],
    entry: {
      visaFreeCountries:
        'Citizens of 85+ countries can enter Singapore visa-free for 30–90 days, including US (90 days), UK (90 days), all EU countries (30–90 days), Australia (90 days), Canada (30 days), Japan (30 days), and most ASEAN members. ' +
        'Check the Singapore ICA website for your specific passport and permitted duration.',
      visaOnArrival:
        'Singapore does not offer traditional visa on arrival — travelers not covered by visa-free access must apply for a visa before departure via the Singapore ICA portal.',
      evisa:
        'Singapore does not offer a self-service e-visa. Visitors who require a visa must apply through a local contact (sponsor/employer) or via an authorized travel agent.',
      passportValidity:
        'Passport must be valid for at least 6 months beyond your intended stay in Singapore.',
      notes: '⚠️ Verify current requirements at Singapore ICA (ica.gov.sg) or IATA Travel Centre before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required for entry for most travelers. Routine vaccines (MMR, hepatitis A, typhoid) are commonly recommended.',
      yellowFever:
        'A yellow fever vaccination certificate is required if you are arriving from — or have transited more than 12 hours through — a country with risk of yellow fever transmission. This applies to parts of Sub-Saharan Africa and tropical South America.',
      malaria:
        'Singapore is malaria-free. No antimalarial medication is needed.',
      notes:
        '⚠️ Health requirements sourced from NaTHNaC (travelhealthpro.org.uk). Always confirm with your doctor before departure.',
    },
    arrival: {
      currency: 'Singapore Dollar (SGD). ATMs and currency exchange widely available at Changi. Cashless payments (credit cards, PayNow, GrabPay) accepted almost everywhere — one of the most cashless cities in Asia.',
      simCard: 'Singtel, StarHub, and M1 SIM counters in arrivals hall. Tourist SIMs from ~$15–30 SGD with 3–7 days unlimited data. Changi also has free WiFi throughout the airport.',
      transport: 'MRT East West Line from Changi Airport to City Hall ~30 min (~$2.50 SGD). Taxis from airport to city center ~$20–35 SGD. Grab available at designated pickup zones outside arrivals.',
      customs: '200 cigarettes or 250g tobacco duty-free (no free tobacco allowance if arriving from Malaysia). 1 litre spirits + 1 litre wine + 1 litre beer. Zero tolerance for drugs — mandatory death penalty for trafficking.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Singapore?', a: 'Citizens of 85+ countries can enter Singapore visa-free, including US (90 days), UK (90 days), and most EU/AU/CA. Check the Singapore ICA website (ica.gov.sg) for your passport and exact duration allowed.' },
      { q: 'Do I need any vaccinations for Singapore?', a: 'No vaccines are legally required for most travelers. Yellow fever certificate is required only if arriving from an endemic country. Routine vaccines recommended. Singapore is generally a very low health risk destination.' },
      { q: 'Is Singapore expensive?', a: "Singapore has a reputation for being expensive but it's very manageable if you know where to eat. Hawker centres (government-run food courts) serve excellent local food for $3–6 SGD. Hotels are pricier — use Thai IP pricing on Agoda for the best rates." },
      { q: 'How do I get from Changi airport to the city?', a: 'MRT (subway) is the cheapest option — ~$2.50 SGD to City Hall, about 30 minutes. Taxis from the airport cost ~$20–35 SGD to central Singapore. Grab is also available at designated pickup zones.' },
      { q: 'Can I get a SIM card at Singapore airport?', a: 'Yes — Singtel, StarHub, and M1 all have counters in arrivals at Changi. Tourist SIMs with unlimited data for 3–7 days cost ~$15–30 SGD. Changi also has free airport WiFi while you decide.' },
    ],
  },

  india: {
    name: 'India',
    capital: 'New Delhi',
    flag: '🇮🇳',
    airportCode: 'DEL',
    airportName: 'Indira Gandhi International Airport, Delhi (DEL) / Chhatrapati Shivaji Maharaj Airport, Mumbai (BOM)',
    img: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Indira Gandhi Airport itself (DEL), not central Delhi
    timezone: 'Asia/Kolkata',
    lat: 28.5562,
    lng: 77.1000,
    last_verified: '2026-07-04',
    sources: [
      'https://indianvisaonline.gov.in/evisa/tvoa.html',
      'https://travelhealthpro.org.uk/country/103/india',
      'https://www.gov.uk/foreign-travel-advice/india/entry-requirements',
    ],
    localApps: [
      { name: 'Ola', category: 'ride-share', note: 'Works well in Delhi and Mumbai — use the pre-paid taxi booth in arrivals if you prefer a fixed-rate option instead.', url: 'https://www.olacabs.com/' },
      { name: 'Uber', category: 'ride-share', note: 'Also widely available in major Indian cities.', url: 'https://www.uber.com/in/en/' },
      { name: 'Paytm', category: 'payment', note: 'India’s leading digital wallet and UPI app — most shops display a QR code, though it typically requires an Indian bank account to use.', url: 'https://paytm.com/' },
    ],
    entry: {
      visaFreeCountries:
        'India does not offer visa-free entry to most nationalities. Citizens of Bhutan and Nepal can enter without a visa. ' +
        'All other nationalities require a visa — the e-Tourist Visa (eTV) is the standard option for most travelers.',
      visaOnArrival:
        'India does not offer visa on arrival for most nationalities. The e-Tourist Visa (applied online) must be obtained before departure.',
      evisa:
        'e-Tourist Visa available for citizens of 170+ countries via indianvisaonline.gov.in. ' +
        'Allows stays of 30, 90, or 365 days (single/double/multiple entry depending on nationality). ' +
        'Fee varies by nationality (~$25–80 USD). Processing typically 3–5 business days — apply at least a week before travel.',
      passportValidity:
        'Passport must be valid for at least 6 months beyond your arrival date and have at least 2 blank pages.',
      notes: '⚠️ India visa rules vary by nationality and visa type. Always verify at indianvisaonline.gov.in or IATA Travel Centre before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required for most travelers. Hepatitis A, Typhoid, and routine vaccines are strongly recommended. ' +
        'Hepatitis B, Rabies (for extended stays or animal contact), and Japanese Encephalitis (rural areas) may also be recommended — confirm with your travel clinic.',
      yellowFever:
        'A yellow fever vaccination certificate IS required if you are arriving from — or have transited more than 12 hours through — a country with risk of yellow fever transmission. ' +
        'This is strictly enforced at Indian immigration. Without the certificate, you may be quarantined or denied entry.',
      malaria:
        'Malaria risk exists across much of India, including popular tourist cities. Risk is higher during and after monsoon season (June–September). ' +
        'Antimalarial medication is commonly recommended — consult your travel clinic for the appropriate type.',
      notes:
        '⚠️ India has significant health considerations. Consult your doctor or travel clinic at least 4–6 weeks before departure. Health requirements sourced from NaTHNaC and UK Government India travel advice.',
    },
    arrival: {
      currency: 'Indian Rupee (INR). ATMs widely available at major airports. Currency exchange in arrivals. Note: INR cannot be taken out of India (export restricted) — exchange leftover rupees before departure.',
      simCard: 'Foreign tourists must register at the airport telecom counter to purchase a local SIM — bring your passport and a passport-size photo. Airtel and Jio offer tourist SIMs. Process takes 15–30 min at the airport.',
      transport: 'Delhi (DEL): Delhi Metro Airport Express to New Delhi station ~20 min (~$1.50 USD equivalent). Taxis via pre-paid booth in arrivals. Ola/Uber also available outside. Mumbai (BOM): No direct metro yet — taxi or Ola/Uber to city ~45–90 min depending on traffic.',
      customs: '200 cigarettes or 50 cigars duty-free. Up to 2 litres alcohol. Cash equivalent of USD 5,000 (USD 10,000 in any currency) can be brought in without declaration above that threshold.',
    },
    faqs: [
      { q: 'Do I need a visa to visit India?', a: "Most nationalities require a visa for India. The e-Tourist Visa (eTV) is the easiest option — apply online at indianvisaonline.gov.in at least a week before travel. Available to 170+ nationalities. Bhutan and Nepal citizens are exempt." },
      { q: 'Do I need vaccinations for India?', a: 'No vaccines are legally required for most travelers (yellow fever certificate required if arriving from endemic countries). However, Hepatitis A, Typhoid, and routine vaccines are strongly recommended. Malaria prophylaxis is commonly advised — consult your travel clinic 4–6 weeks before departure.' },
      { q: 'Is yellow fever vaccination required for India?', a: 'Yes — a yellow fever certificate is required if you arrive from, or have transited more than 12 hours through, a country with yellow fever transmission risk. This is strictly enforced. Without it, you may be quarantined or turned back.' },
      { q: 'How do I get a SIM card in India as a tourist?', a: 'Foreign tourists must register at a telecom counter at the airport to get a local SIM — bring your passport and a passport photo. Airtel and Jio offer tourist plans. The process typically takes 15–30 minutes at a dedicated airport counter.' },
      { q: 'What is the best way to get from Delhi airport to the city?', a: 'The Delhi Metro Airport Express is the fastest and cheapest — ~$1.50 USD to New Delhi Railway Station in about 20 minutes. Pre-paid taxi booths in arrivals offer fixed-rate taxis. Ola and Uber are also available from the designated pickup area.' },
    ],
  },

  'south-korea': {
    name: 'South Korea',
    capital: 'Seoul',
    flag: '🇰🇷',
    airportCode: 'ICN',
    airportName: 'Incheon International Airport (ICN)',
    img: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Incheon Airport itself (ICN), not central Seoul
    timezone: 'Asia/Seoul',
    lat: 37.4602,
    lng: 126.4407,
    last_verified: '2026-07-04',
    sources: [
      'https://www.visa.go.kr/openPage.do?MENU_ID=10101',
      'https://travelhealthpro.org.uk/country/110/south-korea',
    ],
    localApps: [
      { name: 'Kakao T', category: 'ride-share', note: 'South Korea’s dominant ride-hailing app — Uber has limited coverage, Kakao T is what locals actually use.', url: 'https://www.kakaomobility.com/en/service/taxi' },
      { name: 'Naver Map', category: 'maps', note: 'Google Maps turn-by-turn directions don’t work well in South Korea due to data-export restrictions — download this instead before you land.', url: 'https://map.naver.com/' },
      { name: 'KakaoMap', category: 'maps', note: 'A second reliable navigation option, widely used alongside Naver Map.', url: 'https://map.kakao.com/' },
    ],
    entry: {
      visaFreeCountries:
        'Citizens of 110+ countries can enter South Korea visa-free for 30–90 days, including US (90 days), UK (90 days), all EU countries (90 days), Australia (90 days), Canada (180 days), and Japan (90 days). ' +
        'Check the Korea e-Government visa portal for your specific nationality.',
      visaOnArrival:
        'South Korea does not offer general visa on arrival. Travelers not covered by visa-free agreements must apply for a visa before departure.',
      evisa:
        'K-ETA (Korea Electronic Travel Authorization) is required for many visa-free nationalities to pre-register before arrival. ' +
        'Apply at k-eta.go.kr at least 72 hours before departure (~$10 USD, valid 2 years/multiple entries). ' +
        'Note: K-ETA was temporarily suspended for some nationalities in 2023–2024 — check current status before travel.',
      passportValidity:
        'Passport must be valid for the duration of your stay. South Korea does not require 6-month validity for most nationalities, but check with your airline.',
      notes: '⚠️ Verify current K-ETA requirements and visa-free eligibility at the Korea Immigration Service (immigration.go.kr) before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required for entry for most travelers. Routine vaccines (MMR, tetanus, hepatitis A) are recommended. ' +
        'Hepatitis B vaccine may be recommended for longer stays.',
      yellowFever:
        'Yellow fever vaccination certificate is NOT required for South Korea. South Korea is not in a yellow-fever risk zone.',
      malaria:
        'Very low risk for most travelers. A small residual malaria risk exists in northern Gyeonggi Province and Gangwon Province near the DMZ — not relevant for typical tourist itineraries in Seoul, Busan, or Jeju.',
      notes:
        '⚠️ Health requirements sourced from NaTHNaC (travelhealthpro.org.uk). Always confirm with your doctor before departure.',
    },
    arrival: {
      currency: 'Korean Won (KRW). ATMs widely available at Incheon. Currency exchange desks in arrivals. Credit cards accepted almost everywhere in Seoul and major cities.',
      simCard: 'SIM vending machines and telecom counters (KT, SK Telecom, LG U+) in Incheon arrivals. Tourist SIMs with unlimited data for 5–30 days from ~₩15,000–50,000 KRW. Pocket WiFi rental also popular at the airport.',
      transport: 'AREX (Airport Railroad Express) to Seoul Station ~43 min (₩9,500 KRW) or directly to Hongik University area. All-stop train ~66 min (₩4,150 KRW). Taxis from Incheon to central Seoul ~70,000–90,000 KRW (60–80 min).',
      customs: '200 cigarettes or 50 cigars duty-free. 1 litre alcohol. Cash over USD 10,000 must be declared.',
    },
    faqs: [
      { q: 'Do I need a visa to visit South Korea?', a: 'Citizens of 110+ countries can visit South Korea visa-free, including US, UK, EU, AU, and CA for up to 90 days. Many visa-free nationalities also need a K-ETA pre-registration (~$10, apply at k-eta.go.kr at least 72 hours before flying). Check current K-ETA requirements before booking.' },
      { q: 'What is K-ETA and do I need it?', a: 'K-ETA is South Korea\'s electronic travel authorization — like ESTA for the US. Many visa-free nationalities must apply online before departure (~$10 USD, valid 2 years). It was temporarily suspended for some countries in 2023–2024, so verify the current requirement for your passport at k-eta.go.kr.' },
      { q: 'Do I need any vaccinations for South Korea?', a: 'No vaccines are legally required for entry for most travelers. No yellow fever requirement. Routine vaccines recommended. South Korea is a very low health-risk destination for most travelers.' },
      { q: 'How do I get from Incheon airport to Seoul?', a: 'AREX express train to Seoul Station takes 43 minutes (₩9,500 KRW) — the best option. All-stop train takes ~66 min but costs only ₩4,150 KRW. Taxis cost ₩70,000–90,000 KRW to central Seoul.' },
      { q: 'Can I get a SIM card at Incheon airport?', a: 'Yes — KT, SK Telecom, and LG U+ all have counters in Incheon arrivals. Tourist SIMs with unlimited data start at around ₩15,000–20,000 KRW for 5 days. SIM vending machines also available 24/7 if counters are closed.' },
    ],
  },

  philippines: {
    name: 'Philippines',
    capital: 'Manila',
    flag: '🇵🇭',
    airportCode: 'MNL',
    airportName: 'Ninoy Aquino International Airport, Manila (MNL)',
    img: 'https://images.unsplash.com/photo-1598258710957-db8614c2881e?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for NAIA itself (MNL), Manila
    timezone: 'Asia/Manila',
    lat: 14.5086,
    lng: 121.0198,
    last_verified: '2026-07-22',
    recheck_note:
      'Philippines visa policy is actively expanding e-Visa/visa-free access for specific nationalities ' +
      '(China got 14-day visa-free from Jan 16, 2026; India got 14-day visa-free from May 2025) — ' +
      'this does not affect US/UK/EU/AU/CA (still 30 days visa-free) but recheck every few months.',
    sources: [
      'https://immigration.gov.ph',
      'https://etravel.gov.ph',
      'https://www.gov.uk/foreign-travel-advice/philippines/entry-requirements',
      'https://travelhealthpro.org.uk/country/178/philippines',
      'https://customs.gov.ph/guidelines-on-arriving-travelers/',
    ],
    localApps: [
      { name: 'Grab', category: 'ride-share', note: 'The dominant ride-hailing app in Metro Manila — book from the designated Grab pickup zone at NAIA rather than accepting offers from touts in the arrivals hall.', url: 'https://www.grab.com/ph/transport/' },
      { name: 'GCash', category: 'payment', note: 'The Philippines’ leading e-wallet. Its GTourist feature lets visitors activate a usable account for up to 30 days once you’re in-country — handy for paying at stores that don’t take foreign cards.', url: 'https://www.gcash.com/' },
    ],
    entry: {
      visaFreeCountries:
        'Citizens of roughly 157 countries — including the US, UK, all EU countries, Australia, and Canada — can enter visa-free for 30 days under Executive Order 408. ' +
        'The stay can be extended multiple times (first to 59 days, then in further increments) at a Bureau of Immigration office, up to a maximum of 36 months. ' +
        'Indian passport holders get 14 days visa-free (30 days if they hold a valid/recent US, Canada, Japan, Schengen, Singapore, or UK visa). ' +
        'Chinese passport holders got a new 14-day visa-free allowance starting January 16, 2026, entering via NAIA or Mactan-Cebu.',
      visaOnArrival:
        'The Philippines does not offer a general visa-on-arrival program. Nationalities not covered by the visa-free list must obtain a visa or e-visa before departure.',
      evisa:
        'A Philippine e-Visa system (evisa.gov.ph) exists mainly for nationalities like India and China, and as an optional pre-clearance route for some visa-free nationalities wanting a stay beyond the standard 30 days. ' +
        'US/UK/EU/AU/CA travelers doing a standard visit do not need it.',
      passportValidity:
        'Passport must be valid for at least 6 months beyond your arrival date. Airlines will generally deny boarding without this.',
      notes:
        '⚠️ You must also complete a free eTravel registration (etravel.gov.ph) within 72 hours before arrival and show the QR code at check-in and immigration — some airlines will not let you board without it. ' +
        'Always verify current rules at the Bureau of Immigration (immigration.gov.ph) or IATA Travel Centre before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required for entry for most travelers. Hepatitis A, Typhoid, and routine vaccines (MMR, tetanus) are commonly recommended. ' +
        'Japanese Encephalitis and Rabies may be recommended for rural, longer, or adventure itineraries — confirm with a travel clinic.',
      yellowFever:
        'A yellow fever vaccination certificate IS required if you are arriving from — or have recently transited — a country with risk of yellow fever transmission. ' +
        'Without the certificate you may be denied entry or quarantined.',
      malaria:
        'No risk in cities or on the islands of Boracay, Bohol, Catanduanes, Cebu, and Leyte. Low risk exists in rural areas below 600m on Luzon, Mindanao, Mindoro, and Palawan (Palawan carries the highest relative risk among these). ' +
        'Bite avoidance is the main precaution recommended for typical tourist itineraries; antimalarials are considered case-by-case for higher-risk travelers. Check CDC/WHO maps for your specific route.',
      notes:
        '⚠️ Health requirements sourced from NaTHNaC (travelhealthpro.org.uk). Always confirm with your doctor or travel clinic before departure.',
    },
    arrival: {
      currency: 'Philippine Peso (PHP). ATMs widely available in Manila. You may carry up to ₱50,000 in or out without prior Bangko Sentral (BSP) authorization — amounts above that must be declared and pre-approved.',
      simCard: 'Globe and Smart both have SIM counters in the NAIA arrivals hall, open 24 hours, accepting cards or cash. Short tourist SIMs with a few GB start around ₱300–500; 30-day unlimited-data tourist SIMs run ₱2,000–3,000.',
      transport: 'NAIA is notoriously congested — Grab (₱300–600 to Makati/BGC from the designated pickup zone) or a fixed-price coupon taxi (₱450–800, no meter/no haggling) are the steadiest options on a first visit. The P2P/UBE Express bus is cheapest (₱150–200) but only boards from Terminal 3 — from T1, T2, or T4 you\'ll need the free NAIA Loop shuttle to T3 first. Avoid unmetered taxis touting outside arrivals.',
      customs: '400 cigarettes (2 reams) or 50 cigars or 250g tobacco duty-free. 2 bottles of liquor (combined value under ₱10,000). Declare foreign currency over USD 10,000 equivalent.',
    },
    faqs: [
      { q: 'Do I need a visa to visit the Philippines?', a: 'Citizens of about 157 countries — including the US, UK, EU, Australia, and Canada — can enter visa-free for 30 days. You\'ll also need to complete the free eTravel registration (etravel.gov.ph) within 72 hours of arrival and show the QR code at the airport.' },
      { q: 'What is eTravel and do I really need it?', a: 'Yes — eTravel is a mandatory, free online arrival registration for every foreign visitor, completed at etravel.gov.ph within 72 hours before you fly. Some airlines check for the QR code at check-in, and immigration scans it on arrival. There is no legitimate fee — ignore any third-party site asking you to pay for it.' },
      { q: 'Do I need a yellow fever certificate or malaria pills for the Philippines?', a: 'A yellow fever certificate is only required if you\'re arriving from a country with yellow fever transmission risk. Malaria risk is essentially zero in cities and on islands like Boracay, Bohol, and Cebu — there is low risk in rural areas of Luzon, Mindanao, Mindoro, and Palawan, where bite avoidance is usually enough for a standard trip.' },
      { q: 'How do I get from Manila airport (NAIA) to the city?', a: 'Grab is the steadiest option, booked from the designated pickup zone (₱300–600 to Makati/BGC). Fixed-price coupon taxis are a safe alternative (₱450–800). The cheapest option, the P2P/UBE Express bus (₱150–200), only departs from Terminal 3 — transfer there first via the free NAIA Loop shuttle if you land elsewhere. Expect heavy traffic regardless of mode.' },
      { q: 'Can I get a SIM card at Manila airport?', a: 'Yes — Globe and Smart both run 24-hour counters in the NAIA arrivals hall. Basic short-term data SIMs start around ₱300–500; 30-day unlimited tourist SIMs cost ₱2,000–3,000. Bring your passport.' },
    ],
  },

  malaysia: {
    name: 'Malaysia',
    capital: 'Kuala Lumpur',
    flag: '🇲🇾',
    airportCode: 'KUL',
    airportName: 'Kuala Lumpur International Airport (KLIA)',
    img: 'https://images.unsplash.com/photo-1569878698898-3d112b16d123?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for KLIA itself (KUL), not central Kuala Lumpur city
    timezone: 'Asia/Kuala_Lumpur',
    lat: 2.7456,
    lng: 101.7099,
    last_verified: '2026-07-22',
    sources: [
      'https://www.imi.gov.my',
      'https://imigresen-online.imi.gov.my/mdac/main',
      'https://www.gov.uk/foreign-travel-advice/malaysia/entry-requirements',
      'https://travelhealthpro.org.uk/country/137/malaysia',
      'https://travelhealthpro.org.uk/country/138/borneo-malaysia',
    ],
    localApps: [
      { name: 'Grab', category: 'ride-share', note: 'The dominant ride-hailing app across Malaysia, including KLIA — far more consistent than hailing a taxi outside arrivals.', url: 'https://www.grab.com/my/transport/' },
      { name: 'Touch \'n Go eWallet', category: 'payment', note: 'Malaysia’s leading e-wallet, used for tolls, transit, and millions of QR merchants. As of 2026 tourist self-registration is open to ASEAN passport holders, with wider nationality access still rolling out — worth checking if it’s open to your passport yet, otherwise use cash or cards.', url: 'https://www.touchngo.com.my' },
    ],
    entry: {
      visaFreeCountries:
        'Most Western nationalities — including the US, UK, all EU countries, Australia, New Zealand, and Canada — get 90 days visa-free for tourism. ' +
        'ASEAN member-state citizens and several other nationalities have their own bilateral visa-free arrangements, often for shorter periods. ' +
        'Since January 1, 2024, ALL foreign visitors (visa-free or not) must also submit the Malaysia Digital Arrival Card (MDAC) — a free online pre-arrival declaration, not a visa — within 3 days before arrival at imigresen-online.imi.gov.my/mdac/main. ' +
        'Exemptions from MDAC apply to Singapore citizens/PR holders, long-term pass holders, diplomats, and border-pass holders.',
      visaOnArrival:
        'Malaysia does not offer general visa on arrival. Nationalities requiring a visa must apply in advance via a Malaysian mission or the eVisa portal.',
      evisa:
        'Malaysia eVisa available online at malaysiavisa.imi.gov.my for many nationalities that need a visa. ' +
        'Separately, Chinese and Indian passport holders currently have a temporary visa-exemption arrangement for tourism (in effect through December 31, 2026) — confirm current status as this is a time-limited measure, not a permanent policy.',
      passportValidity:
        'Passport must be valid for at least 6 months beyond your arrival date, and be undamaged with no missing pages.',
      notes:
        '⚠️ MDAC is mandatory and separate from any visa requirement — do not skip it even if your nationality is visa-free. ' +
        'Verify current rules at the Malaysian Immigration Department (imi.gov.my) or IATA Travel Centre before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required for entry for most travelers. Hepatitis A, Typhoid, and routine vaccines (MMR, tetanus) are commonly recommended. ' +
        'Japanese Encephalitis and Rabies may be recommended for rural or extended stays.',
      yellowFever:
        'A yellow fever vaccination certificate IS required if you are arriving from — or have recently transited — a country with risk of yellow fever transmission. Enforced at Malaysian immigration.',
      malaria:
        'Peninsular Malaysia — including Kuala Lumpur, Penang, and Malacca — carries negligible risk for typical tourist itineraries. ' +
        'Malaysian Borneo is different: low risk in the inland, forested areas of Sabah and Sarawak (bite avoidance recommended), and very low risk even in coastal Sabah/Sarawak. ' +
        'If your trip includes interior Borneo (e.g. jungle trekking, longhouse stays), check current CDC/WHO guidance on antimalarials.',
      notes:
        '⚠️ Health requirements sourced from NaTHNaC (travelhealthpro.org.uk). Always confirm with your doctor or travel clinic before departure.',
    },
    arrival: {
      currency: 'Malaysian Ringgit (MYR/RM). ATMs widely available at KLIA. You may carry up to RM1,000 in cash on arrival/departure without declaring; foreign currency over USD 10,000 equivalent must be declared.',
      simCard: 'Maxis/Hotlink, Celcom, and Digi all have kiosks at KLIA. Tourist SIMs with 12–20GB data for 7 days run roughly RM25–55.',
      transport: 'KLIA Ekspres train to KL Sentral takes 28–33 minutes (~RM55 one-way) — the fastest, most reliable option. The slower all-stop KLIA Transit is cheaper. Grab from the airport to central KL typically runs RM70–100 depending on traffic and time of day (45–60 min). Airport coach buses are the budget option.',
      customs: '1 litre alcohol duty-free per adult (family pooling not allowed). Note: Malaysia removed duty-free status for tobacco products for arriving tourists — bring cigarettes in and expect them to be taxable. General goods up to RM500 value. Declare cash over USD 10,000 equivalent.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Malaysia?', a: 'Most Western nationalities — US, UK, EU, Australia, Canada — get 90 days visa-free for tourism. Regardless of visa status, every visitor must also submit the free Malaysia Digital Arrival Card (MDAC) online within 3 days before arrival — it is not a visa, but it is mandatory.' },
      { q: 'What is the MDAC and do I need it if I\'m visa-free?', a: 'Yes, you still need it. The Malaysia Digital Arrival Card is a separate, free online pre-arrival declaration required of nearly all foreign visitors since January 2024, regardless of visa-free status. Submit it at imigresen-online.imi.gov.my/mdac/main within 3 days of arrival and bring the QR code.' },
      { q: 'Is malaria a risk in Malaysia?', a: 'Not really in Kuala Lumpur, Penang, or Malacca — risk there is negligible. It\'s a different story in Malaysian Borneo (Sabah/Sarawak): low risk in inland, forested interior areas, and very low risk even along the coast. If you\'re trekking inland Borneo, check current antimalarial guidance.' },
      { q: 'How do I get from KLIA to Kuala Lumpur city center?', a: 'The KLIA Ekspres train is fastest — 28–33 minutes to KL Sentral for about RM55. Grab typically costs RM70–100 and takes 45–60 minutes depending on traffic. Airport coach buses are the cheapest option if you\'re not in a hurry.' },
      { q: 'Can I use Touch \'n Go eWallet as a tourist?', a: 'Touch \'n Go is Malaysia\'s dominant e-wallet, but as of 2026 tourist self-registration is open only to ASEAN passport holders, with other nationalities gradually being added. If your passport isn\'t supported yet, cash and international cards work fine almost everywhere.' },
    ],
  },

  taiwan: {
    name: 'Taiwan',
    capital: 'Taipei',
    flag: '🇹🇼',
    airportCode: 'TPE',
    airportName: 'Taiwan Taoyuan International Airport (TPE)',
    img: 'https://images.unsplash.com/photo-1572716402589-c1a2cf470502?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Taoyuan Airport itself (TPE), not central Taipei
    timezone: 'Asia/Taipei',
    lat: 25.0797,
    lng: 121.2342,
    last_verified: '2026-07-22',
    sources: [
      'https://www.boca.gov.tw/cp-149-4486-7785a-2.html',
      'https://twac.immigration.gov.tw',
      'https://www.immigration.gov.tw/5475/5478/141457/142068/398041/',
      'https://www.gov.uk/foreign-travel-advice/taiwan/entry-requirements',
      'https://wwwnc.cdc.gov/travel/yellowbook/2024/preparing/yellow-fever-vaccine-malaria-prevention-by-country/taiwan',
    ],
    localApps: [
      { name: 'Uber', category: 'ride-share', note: 'The main app-based ride option in Taipei — Grab does not currently run ride-hailing in Taiwan (it entered the market in 2026 only via a food-delivery acquisition, migrating by 2027), so Uber and regular metered taxis are what you\'ll actually use.', url: 'https://www.uber.com/tw/en/' },
      { name: 'EasyCard', category: 'payment', note: 'A tap-and-go stored-value card that covers Taipei MRT, buses, YouBike, and convenience stores nationwide. Buy one at any MRT station counter or 7-Eleven on arrival — genuinely the single most useful thing to pick up on day one.', url: 'https://www.easycard.com.tw' },
      { name: 'LINE Pay', category: 'payment', note: 'Widely used by locals for everyday purchases, but full functionality generally needs a Taiwanese bank link — less useful for a short visit than the EasyCard.', url: 'https://pay.line.me/portal/tw/main' },
    ],
    entry: {
      visaFreeCountries:
        'Citizens of 50+ countries — including the US, UK, most of the EU, Canada, Australia, and Japan — can enter visa-free for 90 days. ' +
        'A smaller group of nationalities (including Malaysia and Singapore) get 30 days. ' +
        'Thailand, Brunei, and the Philippines currently have a separate 14-day reciprocal visa-free arrangement in effect until July 31, 2027. ' +
        'Regardless of nationality, all visa-exempt visitors must also submit the Taiwan Arrival Card (TWAC) online.',
      visaOnArrival:
        'Taiwan does not offer a general visa on arrival. Nationalities not covered by a visa-exempt arrangement must apply for a visitor visa in advance through a Taipei Economic and Cultural Office / Taiwan representative office, or check eligibility for Taiwan\'s Travel Authorization Certificate (available to some Southeast/South Asian nationalities meeting specific criteria).',
      evisa:
        'Taiwan does not run a broad e-visa system. Instead, visa-exempt visitors must complete the free Taiwan Arrival Card (TWAC) online at twac.immigration.gov.tw within 3 days before arrival — this replaced the old paper arrival card on October 1, 2025. It is a registration, not a visa, and there is no fee.',
      passportValidity:
        'Passport must be valid for at least 6 months beyond your date of entry. Only formal passports (ordinary, official, diplomatic) qualify for visa-exempt entry — most emergency/temporary passports do not (US citizens and Brunei Certificate of Identity holders are exceptions).',
      notes:
        '⚠️ Don\'t skip the TWAC — without it, entry processing cannot proceed at immigration. Verify current rules at the Bureau of Consular Affairs (boca.gov.tw) or National Immigration Agency (immigration.gov.tw) before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required for entry for most travelers. Routine vaccines (MMR, tetanus) and Hepatitis A are commonly recommended by travel clinics.',
      yellowFever:
        'Yellow fever vaccination certificate is NOT required for Taiwan under normal circumstances. It is only required if you are arriving from a country with risk of yellow fever transmission (parts of Sub-Saharan Africa and tropical South America) — otherwise Taiwan is outside the risk zone entirely.',
      malaria:
        'There is no malaria risk in Taiwan — antimalarial medication is not needed for any typical itinerary. Dengue fever does occur periodically, particularly in southern Taiwan (Kaohsiung/Tainan area) during warmer months, so mosquito bite prevention (repellent, covering up at dusk) is worth packing regardless.',
      notes:
        '⚠️ Health requirements sourced from the CDC Yellow Book and NaTHNaC guidance. Always confirm with your doctor before departure.',
    },
    arrival: {
      currency: 'New Taiwan Dollar (TWD/NTD). ATMs widely available at Taoyuan Airport and across Taipei. Currency exchange desks in arrivals.',
      simCard: 'Chunghwa Telecom, Taiwan Mobile, and FarEasTone all have 24-hour counters at Taoyuan T1 and T2. Tourist SIMs with unlimited data run roughly NT$300–500 for 3–5 days up to about NT$1,000 for 30 days.',
      transport: 'The Taoyuan Airport MRT Express reaches Taipei Main Station in about 35 minutes (NT$160); the all-stop commuter train is slower (~50 min) but a bit cheaper. Taxis and Uber run about NT$1,000–1,200 to central Taipei (45–60 min depending on traffic) — Uber tends to run somewhat cheaper than a metered taxi. Airport buses to major hotel districts are the budget option.',
      customs: '200 cigarettes or 25 cigars or 1 lb tobacco, plus 1.5 litres of alcohol, duty-free (age 20+). A further NT$35,000 personal-goods exemption applies (excluding tobacco/alcohol/controlled items). Declare NTD cash over NT$100,000 or foreign currency over USD 10,000 equivalent.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Taiwan?', a: 'Citizens of 50+ countries — including the US, UK, EU, Canada, Australia, and Japan — can enter visa-free for 90 days. You\'ll also need to complete the free Taiwan Arrival Card (TWAC) online at twac.immigration.gov.tw within 3 days before you fly.' },
      { q: 'What is the TWAC and is it required?', a: 'The Taiwan Arrival Card is a free online pre-arrival registration that replaced the old paper form on October 1, 2025. It applies to visa-exempt visitors and must be submitted within 3 days before arrival at twac.immigration.gov.tw — without it, immigration cannot process your entry.' },
      { q: 'Do I need malaria pills or a yellow fever shot for Taiwan?', a: 'No — Taiwan has no malaria risk at all, so antimalarials aren\'t needed. A yellow fever certificate is only required if you\'re arriving from a country with yellow fever transmission risk; otherwise it doesn\'t apply.' },
      { q: 'How do I get from Taoyuan Airport to Taipei?', a: 'The Airport MRT Express reaches Taipei Main Station in about 35 minutes for NT$160 — the best option for most people. Uber or taxi costs roughly NT$1,000–1,200 and takes 45–60 minutes depending on traffic.' },
      { q: 'Is Grab available in Taiwan?', a: 'Not for ride-hailing, at least not yet — Grab only entered the Taiwan market in 2026 through a food-delivery acquisition, with a fuller platform migration targeted for 2027. For getting around, use Uber or a regular metered taxi instead.' },
    ],
  },

  'usa-new-york': {
    name: 'USA (New York City)',
    capital: 'Washington, D.C.',
    flag: '🇺🇸',
    airportCode: 'JFK',
    airportName: 'John F. Kennedy International Airport (JFK)',
    img: 'https://images.unsplash.com/photo-1764782979306-1e489462d895?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for JFK Airport itself, Queens — not Manhattan or Washington, D.C.
    timezone: 'America/New_York',
    lat: 40.6413,
    lng: -73.7781,
    last_verified: '2026-07-22',
    recheck_note: 'Recheck every few months — ESTA fee and VWP country list have both changed multiple times in the past 18 months.',
    sources: [
      'https://www.cbp.gov/travel/international-visitors/visa-waiver-program',
      'https://esta.cbp.dhs.gov',
      'https://www.dhs.gov/visa-waiver-program',
      'https://www.gov.uk/foreign-travel-advice/usa/entry-requirements',
      'https://en.wikipedia.org/wiki/Visa_Waiver_Program',
      'https://wwwnc.cdc.gov/travel/page/faq',
      'https://www.jfkairport.com/transportation/airtrain',
    ],
    localApps: [
      { name: 'Uber', category: 'ride-share', note: 'Pickup points are terminal-specific at JFK — the app shows you the exact door/curb to wait at.', url: 'https://www.uber.com/us/en/' },
      { name: 'Lyft', category: 'ride-share', note: 'Also widely available at JFK — worth comparing price against Uber before you request.', url: 'https://www.lyft.com/' },
      { name: 'Apple Pay / Google Pay', category: 'payment', note: 'Contactless tap-to-pay is accepted almost everywhere in NYC, including the AirTrain and subway (OMNY) — often faster than fumbling for a card.', url: 'https://www.apple.com/apple-pay/' },
      { name: 'Google Maps', category: 'maps', note: 'Works normally in the US — real-time subway/bus arrivals are built in, no workaround needed.', url: 'https://maps.google.com/' },
    ],
    entry: {
      visaFreeCountries:
        'Around 40 nationalities can enter the US visa-free for up to 90 days under the Visa Waiver Program (VWP) using an approved ESTA instead of a visa. ' +
        'This includes the UK, most EU/EFTA countries, Australia, New Zealand, Japan, South Korea, Singapore, Taiwan, Brunei, Chile, Israel, Qatar, Andorra, Monaco, and San Marino. ' +
        '[VERIFY: Romania was added to the VWP in March 2025, then had its designation rescinded in May 2025 — status has been unstable; confirm the current full country list at cbp.gov/travel/international-visitors/visa-waiver-program before booking.] ' +
        'VWP/ESTA does NOT apply if you have traveled to Cuba on or after January 12, 2021, or to Iran, Iraq, Libya, North Korea, Somalia, Sudan, Syria, or Yemen after March 2011 — those travelers need a full B1/B2 visa even if their nationality otherwise qualifies.',
      visaOnArrival:
        'The US does not offer visa on arrival for any nationality. Non-VWP travelers must obtain a B1 (business) or B2 (tourism) visa from a US embassy or consulate before departure — there is no way to get a US tourist visa at the airport.',
      evisa:
        'The US has no e-visa system. Non-VWP nationals apply for a B1/B2 visa via the DS-160 form plus an in-person consular interview. ' +
        'Processing after the interview is typically 10–21 days, but interview wait times themselves vary hugely by consulate — a few weeks in much of Western Europe, but 3–10+ months at high-demand posts (New Delhi, Mumbai, Dubai) as of mid-2026. Apply at least 12 weeks before travel.',
      passportValidity:
        'Your passport generally only needs to be valid for the length of your intended stay to enter the US — there is no blanket "6 months beyond travel" rule as in many other countries. ' +
        'That said, some airlines apply their own stricter check-in rule, so 6+ months of validity avoids any argument at the gate.',
      notes:
        '⚠️ US entry rules are federal (CBP/DHS) and apply identically no matter which US airport you fly into. Always confirm your nationality\'s current status at esta.cbp.dhs.gov before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required to enter the US for any nationality. The CDC recommends staying current on routine vaccines (MMR, Tdap, flu, COVID-19) for international travel generally, but nothing is a condition of entry.',
      yellowFever:
        'The US does NOT require a yellow fever vaccination certificate for entry, regardless of which country you are arriving from or transiting through — unlike many countries in Asia, Africa, and South America.',
      malaria:
        'Not applicable. The US mainland is not a malaria-risk area and no antimalarial medication is needed for New York City.',
      notes:
        '⚠️ Health guidance sourced from CDC Travelers\' Health (wwwnc.cdc.gov/travel). Always confirm with your own doctor before departure, especially if you have onward travel to a yellow-fever or malaria-risk country.',
    },
    arrival: {
      currency: 'US Dollar (USD). Contactless cards and Apple/Google Pay are accepted almost everywhere in NYC — you rarely need cash. Avoid the airport currency-exchange counters; their rates are poor.',
      simCard:
        'The US doesn\'t have universal airport SIM kiosks the way many Asian airports do. AT&T and T-Mobile/Lycamobile counters (via InMotion) are in some JFK terminals; coverage varies by which one you land in. A tourist SIM runs roughly $30–$60 at the counter. Buying an eSIM online before you fly (Airalo, Holafly, etc.) is usually cheaper and guaranteed to be available.',
      transport:
        'AirTrain JFK ($8.75, tap any contactless card/phone or an OMNY card) connects every terminal to the subway at Jamaica or Howard Beach — add a subway fare (~$2.90 with OMNY) into Manhattan, so about $11.65 total and 50–75 minutes with bags. ' +
        'Yellow taxis have a fixed flat rate of $70 to/from Manhattan, but tolls, surcharges, and tip usually bring the real total to $90–$120, roughly 45–60 minutes depending on traffic. Uber/Lyft cost similarly to the taxi and pick up from a designated zone at each terminal.',
      customs:
        '200 cigarettes or 100 cigars, 1 liter of alcohol (21+) duty-free. Declare cash/monetary instruments over $10,000 — not illegal, just must be declared (a FinCEN Form 105 is filed). Fresh fruit, vegetables, and most meat products are prohibited and must still be declared even if you plan to eat them before landing — an undeclared item risks a $300+ fine.',
    },
    faqs: [
      { q: 'Do I need a visa to visit New York?', a: 'If your country is one of the ~40 Visa Waiver Program nationalities, you can apply for an ESTA online (esta.cbp.dhs.gov, $40.27, apply at least 72 hours ahead) instead of a visa, valid for stays up to 90 days. Everyone else needs a B1/B2 visa with a consular interview — apply well in advance, as wait times vary enormously by country.' },
      { q: 'Is a yellow fever vaccine required to enter the US?', a: 'No. The US does not require a yellow fever certificate for entry from any country, unlike many destinations in Asia, Africa, or South America.' },
      { q: 'What\'s the cheapest way from JFK to Manhattan?', a: 'AirTrain ($8.75) plus subway (~$2.90 with OMNY) gets you into Manhattan for about $11.65 total, in 50–75 minutes. A flat-rate yellow taxi is $70 plus tolls/surcharges/tip (realistically $90–$120) but is faster and easier with luggage.' },
      { q: 'Can I get a SIM card at JFK?', a: 'Some terminals have AT&T or T-Mobile/Lycamobile counters (around $30–$60 for a tourist plan), but not every terminal has one. Buying an eSIM online before you fly is usually cheaper and more reliable.' },
      { q: 'How much cash can I bring into the US?', a: 'There\'s no limit on how much you can bring, but any amount over $10,000 (cash or equivalent monetary instruments) must be declared to CBP on arrival.' },
    ],
  },

  'usa-los-angeles': {
    name: 'USA (Los Angeles)',
    capital: 'Washington, D.C.',
    flag: '🇺🇸',
    airportCode: 'LAX',
    airportName: 'Los Angeles International Airport (LAX)',
    img: 'https://images.unsplash.com/photo-1756679643031-e45437df44e7?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for LAX Airport itself — not downtown LA or Washington, D.C.
    timezone: 'America/Los_Angeles',
    lat: 33.9416,
    lng: -118.4085,
    last_verified: '2026-07-22',
    recheck_note: 'Recheck every few months — ESTA fee and VWP country list have both changed multiple times in the past 18 months; also recheck LAX Automated People Mover status (repeatedly delayed).',
    sources: [
      'https://www.cbp.gov/travel/international-visitors/visa-waiver-program',
      'https://esta.cbp.dhs.gov',
      'https://www.dhs.gov/visa-waiver-program',
      'https://www.gov.uk/foreign-travel-advice/usa/entry-requirements',
      'https://en.wikipedia.org/wiki/Visa_Waiver_Program',
      'https://wwwnc.cdc.gov/travel/page/faq',
      'https://www.flylax.com/lax-traffic-and-ground-transportation',
    ],
    localApps: [
      { name: 'Uber', category: 'ride-share', note: 'LAX does not allow curbside pickup at most terminals — the app routes you to the LAX-it lot via a free shuttle and assigns a color-coded lane.', url: 'https://www.uber.com/us/en/' },
      { name: 'Lyft', category: 'ride-share', note: 'Same LAX-it process as Uber — pink lanes vs Uber\'s green lanes in the pickup lot.', url: 'https://www.lyft.com/' },
      { name: 'Apple Pay / Google Pay', category: 'payment', note: 'Widely accepted, including on LA Metro if you tap a linked contactless card or a TAP card.', url: 'https://www.apple.com/apple-pay/' },
      { name: 'Google Maps', category: 'maps', note: 'Works normally in the US, with real-time Metro/bus arrivals built in.', url: 'https://maps.google.com/' },
    ],
    entry: {
      visaFreeCountries:
        'Around 40 nationalities can enter the US visa-free for up to 90 days under the Visa Waiver Program (VWP) using an approved ESTA instead of a visa. ' +
        'This includes the UK, most EU/EFTA countries, Australia, New Zealand, Japan, South Korea, Singapore, Taiwan, Brunei, Chile, Israel, Qatar, Andorra, Monaco, and San Marino. ' +
        '[VERIFY: Romania was added to the VWP in March 2025, then had its designation rescinded in May 2025 — status has been unstable; confirm the current full country list at cbp.gov/travel/international-visitors/visa-waiver-program before booking.] ' +
        'VWP/ESTA does NOT apply if you have traveled to Cuba on or after January 12, 2021, or to Iran, Iraq, Libya, North Korea, Somalia, Sudan, Syria, or Yemen after March 2011 — those travelers need a full B1/B2 visa even if their nationality otherwise qualifies.',
      visaOnArrival:
        'The US does not offer visa on arrival for any nationality. Non-VWP travelers must obtain a B1 (business) or B2 (tourism) visa from a US embassy or consulate before departure — there is no way to get a US tourist visa at the airport.',
      evisa:
        'The US has no e-visa system. Non-VWP nationals apply for a B1/B2 visa via the DS-160 form plus an in-person consular interview. ' +
        'Processing after the interview is typically 10–21 days, but interview wait times themselves vary hugely by consulate — a few weeks in much of Western Europe, but 3–10+ months at high-demand posts (New Delhi, Mumbai, Dubai) as of mid-2026. Apply at least 12 weeks before travel.',
      passportValidity:
        'Your passport generally only needs to be valid for the length of your intended stay to enter the US — there is no blanket "6 months beyond travel" rule as in many other countries. ' +
        'That said, some airlines apply their own stricter check-in rule, so 6+ months of validity avoids any argument at the gate.',
      notes:
        '⚠️ US entry rules are federal (CBP/DHS) and apply identically no matter which US airport you fly into. Always confirm your nationality\'s current status at esta.cbp.dhs.gov before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required to enter the US for any nationality. The CDC recommends staying current on routine vaccines (MMR, Tdap, flu, COVID-19) for international travel generally, but nothing is a condition of entry.',
      yellowFever:
        'The US does NOT require a yellow fever vaccination certificate for entry, regardless of which country you are arriving from or transiting through — unlike many countries in Asia, Africa, and South America.',
      malaria:
        'Not applicable. The US mainland is not a malaria-risk area and no antimalarial medication is needed for Los Angeles.',
      notes:
        '⚠️ Health guidance sourced from CDC Travelers\' Health (wwwnc.cdc.gov/travel). Always confirm with your own doctor before departure, especially if you have onward travel to a yellow-fever or malaria-risk country.',
    },
    arrival: {
      currency: 'US Dollar (USD). Contactless cards and Apple/Google Pay are accepted almost everywhere — you rarely need cash. Avoid the airport currency-exchange counters; their rates are poor.',
      simCard:
        'SIM/eSIM counters are limited to a few terminals — mainly the Tom Bradley International Terminal (TBIT) and ICE Currency Exchange counters in Terminals 2, 5, 6, and TBIT (roughly 6:15am–9:45pm). ' +
        'Plans run pricey for what you get — around $80–$120 for a data plan — so an eSIM bought online before departure is usually better value.',
      transport:
        'LAX does not allow curbside Uber/Lyft pickup at most terminals — you take a free shuttle bus to the LAX-it lot east of Terminal 1, then match the color-coded lane (green for Uber, pink for Lyft) shown in your app, adding 15–20 minutes versus a normal pickup. ' +
        'The FlyAway bus runs direct to Union Station downtown for $12.75 one-way. The Metro C Line connects via a free shuttle from the LAX/Metro Transit Center — standard fare (~$1.75 with a TAP card) but slower, with transfers needed for most neighborhoods. ' +
        '[VERIFY: LAX\'s Automated People Mover train, meant to connect terminals directly to Metro and parking, has been delayed repeatedly and had no confirmed opening date as of mid-2026 — check flylax.com before planning around it.]',
      customs:
        '200 cigarettes or 100 cigars, 1 liter of alcohol (21+) duty-free. Declare cash/monetary instruments over $10,000 — not illegal, just must be declared. Fresh fruit, vegetables, and most meat products are prohibited and must still be declared even if you plan to eat them before landing — an undeclared item risks a $300+ fine.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Los Angeles?', a: 'If your country is one of the ~40 Visa Waiver Program nationalities, you can apply for an ESTA online (esta.cbp.dhs.gov, $40.27, apply at least 72 hours ahead) instead of a visa, valid for stays up to 90 days. Everyone else needs a B1/B2 visa with a consular interview.' },
      { q: 'Is a yellow fever vaccine required to enter the US?', a: 'No. The US does not require a yellow fever certificate for entry from any country.' },
      { q: 'Can I just get an Uber outside LAX arrivals?', a: 'Not at most terminals. You take a free shuttle to the LAX-it lot, then wait in the color-coded lane your app assigns — plan for an extra 15–20 minutes versus a typical airport pickup.' },
      { q: 'What\'s the cheapest way from LAX to downtown LA?', a: 'The FlyAway bus to Union Station is $12.75 one-way and runs every 15–30 minutes. The Metro C Line (via a free shuttle from the airport) is cheaper (~$1.75) but involves more transfers.' },
      { q: 'Can I get a SIM card at LAX?', a: 'Yes, mainly at the Tom Bradley International Terminal and ICE Currency Exchange counters, but prices are high (~$80–$120). An eSIM bought online before you fly is usually better value.' },
    ],
  },

  'usa-miami': {
    name: 'USA (Miami)',
    capital: 'Washington, D.C.',
    flag: '🇺🇸',
    airportCode: 'MIA',
    airportName: 'Miami International Airport (MIA)',
    img: 'https://images.unsplash.com/photo-1741023705528-2953cb652705?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for MIA Airport itself — not South Beach or Washington, D.C.
    // Miami uses the America/New_York IANA zone (US Eastern Time) — there is no separate America/Miami zone.
    timezone: 'America/New_York',
    lat: 25.7959,
    lng: -80.2870,
    last_verified: '2026-07-22',
    recheck_note: 'Recheck every few months — ESTA fee and VWP country list have both changed multiple times in the past 18 months.',
    sources: [
      'https://www.cbp.gov/travel/international-visitors/visa-waiver-program',
      'https://esta.cbp.dhs.gov',
      'https://www.dhs.gov/visa-waiver-program',
      'https://www.gov.uk/foreign-travel-advice/usa/entry-requirements',
      'https://en.wikipedia.org/wiki/Visa_Waiver_Program',
      'https://wwwnc.cdc.gov/travel/page/faq',
      'https://www.miamiandbeaches.com/plan-your-trip/transportation/how-to-get-to-and-from-miami-international-airport',
    ],
    localApps: [
      { name: 'Uber', category: 'ride-share', note: 'Pickup is on the arrivals level middle inner curb — check the app for your terminal\'s exact door number.', url: 'https://www.uber.com/us/en/' },
      { name: 'Lyft', category: 'ride-share', note: 'Also widely available at MIA — worth comparing price against Uber, especially for the South Beach run.', url: 'https://www.lyft.com/' },
      { name: 'Apple Pay / Google Pay', category: 'payment', note: 'Widely accepted, including on Metrorail/Metrobus if linked to an EASY Card or contactless payment.', url: 'https://www.apple.com/apple-pay/' },
      { name: 'Google Maps', category: 'maps', note: 'Works normally in the US, with real-time Metrorail/Metrobus arrivals built in.', url: 'https://maps.google.com/' },
    ],
    entry: {
      visaFreeCountries:
        'Around 40 nationalities can enter the US visa-free for up to 90 days under the Visa Waiver Program (VWP) using an approved ESTA instead of a visa. ' +
        'This includes the UK, most EU/EFTA countries, Australia, New Zealand, Japan, South Korea, Singapore, Taiwan, Brunei, Chile, Israel, Qatar, Andorra, Monaco, and San Marino. ' +
        '[VERIFY: Romania was added to the VWP in March 2025, then had its designation rescinded in May 2025 — status has been unstable; confirm the current full country list at cbp.gov/travel/international-visitors/visa-waiver-program before booking.] ' +
        'VWP/ESTA does NOT apply if you have traveled to Cuba on or after January 12, 2021, or to Iran, Iraq, Libya, North Korea, Somalia, Sudan, Syria, or Yemen after March 2011 — those travelers need a full B1/B2 visa even if their nationality otherwise qualifies.',
      visaOnArrival:
        'The US does not offer visa on arrival for any nationality. Non-VWP travelers must obtain a B1 (business) or B2 (tourism) visa from a US embassy or consulate before departure — there is no way to get a US tourist visa at the airport.',
      evisa:
        'The US has no e-visa system. Non-VWP nationals apply for a B1/B2 visa via the DS-160 form plus an in-person consular interview. ' +
        'Processing after the interview is typically 10–21 days, but interview wait times themselves vary hugely by consulate — a few weeks in much of Western Europe, but 3–10+ months at high-demand posts (New Delhi, Mumbai, Dubai) as of mid-2026. Apply at least 12 weeks before travel.',
      passportValidity:
        'Your passport generally only needs to be valid for the length of your intended stay to enter the US — there is no blanket "6 months beyond travel" rule as in many other countries. ' +
        'That said, some airlines apply their own stricter check-in rule, so 6+ months of validity avoids any argument at the gate.',
      notes:
        '⚠️ US entry rules are federal (CBP/DHS) and apply identically no matter which US airport you fly into. Always confirm your nationality\'s current status at esta.cbp.dhs.gov before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required to enter the US for any nationality. The CDC recommends staying current on routine vaccines (MMR, Tdap, flu, COVID-19) for international travel generally, but nothing is a condition of entry.',
      yellowFever:
        'The US does NOT require a yellow fever vaccination certificate for entry, regardless of which country you are arriving from or transiting through — unlike many countries in Asia, Africa, and South America.',
      malaria:
        'Not applicable. Miami is not considered a malaria-risk area and no antimalarial medication is needed.',
      notes:
        '⚠️ Health guidance sourced from CDC Travelers\' Health (wwwnc.cdc.gov/travel). Always confirm with your own doctor before departure, especially if you have onward travel to a yellow-fever or malaria-risk country (e.g. onward trips to the Caribbean or South America).',
    },
    arrival: {
      currency: 'US Dollar (USD). Contactless cards and Apple/Google Pay are accepted almost everywhere — you rarely need cash. Avoid the airport currency-exchange counters; their rates are poor.',
      simCard:
        'The arrivals level at MIA does not have a SIM card counter — you\'ll need to go up to the Departures level, where ICE Currency Exchange counters sell prepaid SIMs (from about $37 for a basic data plan up to $70 for a higher-data Lycamobile option). Buying an eSIM before you land avoids the extra walk.',
      transport:
        'The free MIA Mover tram connects the terminals to Miami Central Station, where you can pick up Metrorail\'s Orange Line into Downtown Miami (~$2.25 with an EASY Card, 20–30 minutes). ' +
        'Metrorail does NOT reach Miami Beach — if South Beach is your destination, either transfer to a Metrobus route (~$2.25 but 60–90 minutes total) or take Uber/Lyft direct (roughly $35–$55 depending on traffic and demand, 20–40 minutes). Uber/Lyft pickup is on the arrivals level middle inner curb — check your app for the exact door at your terminal.',
      customs:
        '200 cigarettes or 100 cigars, 1 liter of alcohol (21+) duty-free. Declare cash/monetary instruments over $10,000 — not illegal, just must be declared. Fresh fruit, vegetables, and most meat products are prohibited and must still be declared even if you plan to eat them before landing — an undeclared item risks a $300+ fine.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Miami?', a: 'If your country is one of the ~40 Visa Waiver Program nationalities, you can apply for an ESTA online (esta.cbp.dhs.gov, $40.27, apply at least 72 hours ahead) instead of a visa, valid for stays up to 90 days. Everyone else needs a B1/B2 visa with a consular interview.' },
      { q: 'Is a yellow fever vaccine required to enter the US?', a: 'No. The US does not require a yellow fever certificate for entry from any country — though if you\'re continuing on to the Caribbean or South America, check that destination\'s own rules.' },
      { q: 'Does Metrorail go to South Beach?', a: 'No — Metrorail\'s Orange Line only reaches Downtown Miami. To get to Miami Beach you need a bus transfer (adds 30–60 minutes) or a direct Uber/Lyft, which most travelers with luggage find simpler.' },
      { q: 'Can I get a SIM card at Miami airport?', a: 'Only on the Departures level, not Arrivals — ICE Currency Exchange counters sell prepaid SIMs from about $37. An eSIM bought before you land saves the walk.' },
      { q: 'Where do I get an Uber at MIA?', a: 'Arrivals level, middle inner curb — the app will tell you the exact door number to head to for your terminal.' },
    ],
  },

  'mexico-cancun': {
    name: 'Mexico',
    capital: 'Mexico City',
    flag: '🇲🇽',
    airportCode: 'CUN',
    airportName: 'Cancún International Airport (CUN)',
    img: 'https://images.unsplash.com/photo-1602088113235-229c19758e9f?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Cancún International Airport itself (CUN), not Mexico City
    timezone: 'America/Cancun',
    lat: 21.0365,
    lng: -86.8771,
    last_verified: '2026-07-22',
    sources: [
      'https://consulmex.sre.gob.mx/reinounido/index.php/es/component/content/article?id=92',
      'https://www.touristcardmx.com/entry-requirements',
      'https://www.travelandtourworld.com/news/article/ktg2inl1n9jc/',
      'https://www.cdc.gov/yellow-book/hcp/americas-caribbean/mexico.html',
      'https://customslimit.com/guides/mexico',
    ],
    localApps: [
      { name: 'Uber', category: 'ride-share', note: 'Operates normally in Cancún, including airport pickup — a Mexican federal court ruled in Uber\'s favor on airport access in late 2025 after years of friction with local taxi unions.', url: 'https://www.uber.com/mx/en/' },
      { name: 'DiDi', category: 'ride-share', note: 'China-founded, now one of the biggest ride-hailing apps across Mexico — often cheaper than Uber, worth comparing prices in-app.', url: 'https://www.didiglobal.com/' },
      { name: 'Mercado Pago', category: 'payment', note: 'Latin America\'s dominant digital wallet — useful for QR payments at shops that display the logo, though most tourist spots in the Hotel Zone take foreign cards directly.', url: 'https://www.mercadopago.com.mx/' },
    ],
    entry: {
      visaFreeCountries:
        'Visa-free for 60+ nationalities for stays up to 180 days, including the US, Canada, UK, all EU/Schengen countries, Japan, South Korea, Australia, and New Zealand. ' +
        'All visitors, visa-exempt or not, must complete Mexico\'s FMM (Forma Migratoria Múltiple) tourist entry form.',
      visaOnArrival:
        'Mexico does not run a pay-on-arrival visa counter for visa-required nationalities. Instead, it offers a notable bypass: travelers from many visa-required countries ' +
        '(including India, China, Philippines, Vietnam, and most of South/Southeast Asia and the Middle East) can enter without a Mexican visa if they hold a valid, multiple-entry ' +
        'visa or residence permit from the US, Canada, UK, Schengen area, or Japan, stamped in their passport and still valid through their stay. Electronic travel authorizations (like ESTA) do not count for this — it must be an actual visa or residency stamp.',
      evisa:
        'Mexico does not operate a general tourist e-Visa portal the way some countries do. Visa-required nationalities without a qualifying US/UK/Schengen/Canada/Japan visa must apply ' +
        'at a Mexican consulate in advance.',
      passportValidity:
        '[VERIFY: commonly cited as 6 months beyond your entry date, though Mexico does not appear to strictly enforce this for visa-exempt tourists arriving by air — many airlines apply their own stricter rule. Confirm with your airline and the Instituto Nacional de Migración before booking.]',
      notes:
        '⚠️ Always confirm current rules at the Instituto Nacional de Migración (INM) or your nearest Mexican consulate before booking, especially if you are relying on the US/Schengen/UK visa bypass.',
    },
    health: {
      vaccines:
        'No vaccines are legally required for entry for most travelers. Hepatitis A, Typhoid, and routine vaccines (MMR, tetanus) are commonly recommended by travel clinics.',
      yellowFever:
        'Not required for Cancún or anywhere in Mexico under normal circumstances — Mexico is not a yellow fever risk country. A certificate is only required if you are arriving from a country with yellow fever transmission risk (parts of Sub-Saharan Africa and tropical South America).',
      malaria:
        'Cancún, the Riviera Maya, and the rest of the Yucatán Peninsula are not malaria zones. CDC-flagged risk is limited to a few rural areas far to the south, near the Chiapas/Tabasco borders with Guatemala and Belize — not relevant for a standard Cancún trip.',
      notes:
        '⚠️ Health requirements sourced from the CDC Yellow Book. Always confirm with your doctor or a travel clinic before departure.',
    },
    arrival: {
      currency: 'Mexican Peso (MXN). ATMs widely available in the Hotel Zone and downtown Cancún; airport exchange booths carry poor rates — withdraw from a bank-branded ATM instead.',
      simCard: 'Telcel and AT&T Mexico have kiosks in the CUN arrivals hall, but expect an airport markup (~300–500 MXN). The same SIM is routinely 150–220 MXN at any OXXO convenience store in town — worth waiting if you can get by on hotel Wi-Fi for an hour.',
      transport: 'ADO runs a direct bus from Terminals 2/3/4 to the Hotel Zone (Plaza Fiesta), ~170 MXN, ~40 min, departing roughly every 2 hours 10:25am–6:25pm. Official taxi kiosks inside arrivals charge $60–100 USD-equivalent for a ~20-min ride (agree the price before getting in); city-regulated rates are technically 100–400 MXN but rarely honored at the airport. Uber/DiDi pickup is available but has had friction with the taxi union — check the designated app pickup zone signage.',
      customs: '200 cigarettes, 25 cigars, or 200g tobacco duty-free. 3 litres of spirits or 6 litres of wine. $500 USD of additional goods duty-free by air ($300 by land). Declare cash or monetary instruments (checks, money orders, etc.) totaling $10,000 USD or more.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Cancún?', a: 'US, Canadian, UK, EU, and most Western passport holders can enter visa-free for up to 180 days. Everyone still fills out Mexico\'s FMM tourist entry form. Nationalities that normally need a Mexican visa can often skip it if they hold a valid US, UK, Schengen, Canadian, or Japanese visa or residence permit.' },
      { q: 'Is a yellow fever vaccine required for Mexico?', a: 'No — Mexico is not a yellow fever risk country, and no certificate is required unless you are arriving from a country with yellow fever transmission risk, such as parts of Sub-Saharan Africa or tropical South America.' },
      { q: 'Do I need other vaccines for Cancún?', a: 'No vaccines are legally required. Hepatitis A, Typhoid, and up-to-date routine vaccines are commonly recommended by travel clinics. Malaria is not a concern in Cancún or the Riviera Maya.' },
      { q: 'What\'s the cheapest way from Cancún airport to the Hotel Zone?', a: 'The direct ADO bus (~170 MXN, ~40 minutes) from Terminals 2/3/4 is the best value. Airport taxi kiosks routinely quote $60–100 USD — always confirm the price before getting in, or prebook a transfer online.' },
      { q: 'Can I buy a SIM card at Cancún airport?', a: 'Yes, Telcel and AT&T Mexico have counters in arrivals, but prices run higher than in town. If you can wait, the same SIM is often half the price at an OXXO convenience store once you reach the Hotel Zone or downtown.' },
    ],
  },

  'brazil-rio': {
    name: 'Brazil',
    capital: 'Brasília',
    flag: '🇧🇷',
    airportCode: 'GIG',
    airportName: 'Rio de Janeiro–Galeão International Airport (GIG)',
    img: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Galeão Airport itself (GIG), not central Rio
    timezone: 'America/Sao_Paulo',
    lat: -22.8100,
    lng: -43.2506,
    last_verified: '2026-07-22',
    // This exact requirement has been announced, paused, and delayed multiple times since 2023 before
    // finally taking effect April 10, 2025. Given that history, treat the "currently required" status
    // as perishable — recheck close to any US/Canada/Australia traveler's departure date.
    recheck_note: 'Recheck before every booking for US/Canada/Australia passport holders — Brazil\'s e-Visa requirement has been delayed multiple times before and could change again with little notice.',
    sources: [
      'https://br.usembassy.gov/message-to-u-s-citizens-new-visitor-visa-requirements-for-u-s-citizens-traveling-to-brazil/',
      'https://www.gov.uk/foreign-travel-advice/brazil/entry-requirements',
      'https://www.cdc.gov/yellow-book/hcp/americas-caribbean/brazil.html',
      'https://wwwnc.cdc.gov/travel/notices/level2/yellow-fever-south-america',
      'https://travelhealthpro.org.uk/country/34/brazil',
    ],
    localApps: [
      { name: '99', category: 'ride-share', note: 'Brazil\'s own ride-hailing app (now owned by DiDi) — often has better coverage and lower prices than Uber outside the main tourist zones.', url: 'https://99app.com/' },
      { name: 'Uber', category: 'ride-share', note: 'Operates normally throughout Rio, including from Galeão airport — widely used alongside 99.', url: 'https://www.uber.com/br/en/' },
      { name: 'Mercado Pago', category: 'payment', note: 'Widely used digital wallet across Brazil — useful if you set up an account in advance; otherwise foreign cards work at most established businesses.', url: 'https://www.mercadopago.com.br/' },
    ],
    entry: {
      visaFreeCountries:
        'Most nationalities — including the UK, all EU/Schengen countries, Japan, and most of Latin America — can enter Brazil visa-free for tourism for up to 90 days (extendable once for another 90 days at the Federal Police). ' +
        'IMPORTANT: this does NOT currently apply to the US, Canada, or Australia — see evisa below.',
      visaOnArrival: 'Brazil does not offer visa on arrival.',
      evisa:
        'As of April 10, 2025, citizens of the United States, Canada, and Australia must obtain a Brazil e-Visa before travel — for tourism, business, or airport transit — introduced by Brazil on a reciprocity basis. ' +
        'Apply at the official VFS e-Visa portal (brazil.vfsevisa.com); cost is approximately $80.90 USD; apply at least 10 business days ahead as airlines will not issue a boarding pass without a validated e-Visa code. ' +
        'Once issued it\'s valid for up to 10 years with multiple entries, permitting stays of up to 90 days per visit (extendable once for another 90 days). This requirement has been announced and delayed multiple times since 2023 — confirm current status close to your travel date.',
      passportValidity: 'Passport must have an expiry date at least 6 months after your date of arrival in Brazil.',
      notes:
        '⚠️ US, Canadian, and Australian travelers: do not book flights before confirming your e-Visa is approved — this requirement has flip-flopped before and airlines enforce it strictly at check-in. Verify at br.usembassy.gov or the official VFS e-Visa portal.',
    },
    health: {
      vaccines:
        'No vaccines are legally required for entry from most countries (see yellow fever below, which is Brazil\'s own domestic risk, not an "arriving from elsewhere" rule). Hepatitis A, Typhoid, and routine vaccines are commonly recommended.',
      yellowFever:
        'Unlike many destinations, Brazil has its OWN domestic yellow fever risk zones — this is not just an "arriving from Africa" rule. The CDC recommends yellow fever vaccination for travelers to most of Brazil, including Rio de Janeiro state, the city of Rio itself, and its coastal islands, at least 10 days before travel. ' +
        'Vaccination is generally NOT recommended only for a handful of northeastern coastal states/cities (Fortaleza, Recife, and the states of Ceará, Rio Grande do Norte, Paraíba, Pernambuco, Alagoas, and Sergipe). Since late 2025, confirmed cases have appeared in areas previously considered lower-risk (including São Paulo state), so risk maps are actively expanding — check the current CDC/WHO map for your specific itinerary, not just Rio city center.',
      malaria: 'Malaria risk is concentrated in the Amazon basin. Rio de Janeiro and the wider southeastern coast (São Paulo, Rio state) are not malaria-risk areas.',
      notes:
        '⚠️ Health requirements sourced from the CDC Yellow Book and NaTHNaC (travelhealthpro.org.uk). Given the active 2025–2026 case expansion, confirm with your doctor or a travel clinic before departure, even for a standard Rio city trip.',
    },
    arrival: {
      currency: 'Brazilian Real (BRL). ATMs widely available; Pix (instant bank transfer) is the dominant local payment method, though foreign cards work at most hotels, restaurants, and established shops.',
      simCard: 'Vivo, Claro, and TIM all have counters at Galeão arrivals. TIM offers a tourist-specific SIM requiring only a passport (~BRL 25 for 1.5GB/7 days); Claro and Vivo prepaid SIMs run roughly BRL 10–20. Airport prices run higher than in the city.',
      transport: 'Official metered taxi ~20 min to Copacabana, roughly $30–40 USD — ignore anyone soliciting rides inside the terminal, as unlicensed "pirate" taxis routinely overcharge. The Frescão air-conditioned bus (line to Leblon via Copacabana) takes about an hour, ~BRL 25. Cheapest is BRT + Metrô Rio: free airport shuttle/BRT to Vicente de Carvalho, then Metro Line 1 toward Copacabana, ~49 min total, metro fare ~R$4.60.',
      customs: '400 cigarettes (or 10 packs of 20) / 25 cigars / 250g tobacco duty-free. Additional duty-free allowance of up to $500 USD in goods from the airport duty-free shop. Declare cash or monetary instruments over R$10,000 (or foreign-currency equivalent) using the e-DBV form — be ready to show proof of lawful origin for large sums.',
    },
    faqs: [
      { q: 'Do US, Canadian, or Australian citizens need a visa for Brazil?', a: 'Yes — as of April 2025, US, Canadian, and Australian passport holders need an e-Visa before flying, applied for online at brazil.vfsevisa.com (~$80.90, apply 10+ business days ahead). This rule has been delayed multiple times in the past, so reconfirm close to your travel date.' },
      { q: 'Do UK and EU citizens need a visa for Brazil?', a: 'No — UK, EU/Schengen, and most other nationalities can visit visa-free for up to 90 days, extendable once for another 90 days at the Federal Police.' },
      { q: 'Is yellow fever vaccination required for Rio de Janeiro?', a: 'Not legally required for entry, but the CDC recommends it — Brazil has its own domestic risk zones covering most of the country, including Rio de Janeiro state and city, not just an "arriving from Africa" rule. Vaccinate at least 10 days before travel and check the current risk map, since cases have expanded into new areas since late 2025.' },
      { q: 'Is Rio safe for tourists?', a: 'Rio is generally fine in tourist areas (Copacabana, Ipanema, Leblon) with normal precautions, but petty theft and occasional muggings do happen — avoid flashing valuables, use official taxis/rideshare at night, and stick to well-lit, populated streets.' },
      { q: 'What\'s the cheapest way from Galeão airport to Copacabana?', a: 'The BRT-plus-Metrô combination is cheapest (~R$4.60 metro fare) but involves a transfer. The direct Frescão bus (~BRL 25, ~1 hour) is more convenient with luggage. Official taxis cost $30–40 USD and take about 20 minutes — avoid unlicensed drivers touting rides inside the terminal.' },
    ],
  },

  'argentina-buenos-aires': {
    name: 'Argentina',
    capital: 'Buenos Aires',
    flag: '🇦🇷',
    airportCode: 'EZE',
    airportName: 'Ministro Pistarini International Airport (Ezeiza, EZE)',
    img: 'https://images.unsplash.com/photo-1679417302631-7a8998864de6?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Ezeiza Airport itself (EZE), ~32-40km SW of central Buenos Aires
    timezone: 'America/Argentina/Buenos_Aires',
    lat: -34.8222,
    lng: -58.5358,
    last_verified: '2026-07-22',
    sources: [
      'https://www.gov.uk/foreign-travel-advice/argentina/entry-requirements',
      'https://www.globalcitizensolutions.com/argentina-passport-visa-free-countries/',
      'https://www.traveldoctor.network/country/argentina/risk/yellow-fever/',
      'https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/Argentina.html',
    ],
    localApps: [
      { name: 'Uber', category: 'ride-share', note: 'Operates in Buenos Aires as "Uber Taxi" style service — works well, though drivers have occasionally faced friction with traditional taxi unions at the airport pickup zones.', url: 'https://www.uber.com/ar/es/' },
      { name: 'Cabify', category: 'ride-share', note: 'Spain-founded but very strong across Argentina — a solid alternative to Uber, sometimes with better airport coverage.', url: 'https://cabify.com/en/argentina' },
      { name: 'Mercado Pago', category: 'payment', note: 'Argentina is one of Mercado Pago\'s founding markets — QR-code payment is extremely common even at small kiosks and taxis.', url: 'https://www.mercadopago.com.ar/' },
    ],
    entry: {
      visaFreeCountries:
        'US, Canada, UK, all EU countries, Australia, New Zealand, Brazil, and most of Latin America can enter visa-free for tourism for up to 90 days. ' +
        'Extendable once for another 90 days at the Dirección Nacional de Migraciones before the initial stay expires.',
      visaOnArrival: 'Argentina does not run a visa-on-arrival counter for visa-exempt nationalities — you simply receive a 90-day entry stamp. Nationalities that require a visa must apply in advance at an Argentine consulate.',
      evisa: '[VERIFY: Argentina has previously offered an AVE (Autorización de Viaje Electrónica) electronic authorization for a small number of nationalities, e.g. Chinese citizens holding a valid US visa — confirm current eligibility and process at the Dirección Nacional de Migraciones before relying on this.]',
      passportValidity:
        'Officially, your passport must be valid for the proposed duration of your stay (per UK government guidance), though 6 months\' validity beyond your travel dates is commonly recommended and safer for connecting flights/insurance purposes.',
      notes: '⚠️ Confirm current entry rules at the Dirección Nacional de Migraciones or the Argentine consulate nearest you before booking.',
    },
    health: {
      vaccines: 'No vaccines are legally required for most travelers arriving from the US, Canada, UK, or EU. Hepatitis A, Typhoid, and routine vaccines are commonly recommended by travel clinics.',
      yellowFever:
        'Not required or recommended for Buenos Aires city or EZE itself. However, Argentina does have its own limited domestic risk zone: yellow fever vaccination is recommended for travelers to the northern/northeastern forested provinces of Misiones and Corrientes, including Iguazú Falls, and areas bordering Brazil and Paraguay. ' +
        'Argentina does not require proof of vaccination at entry, but if your itinerary includes Iguazú Falls, get vaccinated at least 10 days beforehand.',
      malaria: 'No malaria risk in Buenos Aires. Minimal risk exists in some rural areas near the far northern borders with Bolivia and Paraguay — not relevant for a standard Buenos Aires trip.',
      notes: '⚠️ Health requirements sourced from CDC/travel-medicine networks. Always confirm with your doctor or a travel clinic before departure, especially if your itinerary extends to Iguazú Falls.',
    },
    arrival: {
      currency:
        'Argentine Peso (ARS). Argentina lifted its long-standing currency controls ("cepo cambiario") in April 2025, and by mid-2026 the official, MEP, and informal ("blue dollar") exchange rates have converged to within a few percent of each other — the extreme arbitrage gap from 2023 is gone. Still worth checking a live rate before your trip, as peso prices in guides go stale fast due to ongoing inflation. ATMs and card payments are now straightforward compared to the pre-2025 situation.',
      simCard: 'Personal, Movistar, and Claro all have counters at Ezeiza (Personal is the only one physically inside the airport, opposite check-in desk 40, and only accepts card payment). SIMs run roughly 300–500 ARS at the airport; Claro\'s tourist plan (~25GB/7 days) has been priced around $7 USD. Buying in the city center is usually cheaper.',
      transport: 'Note: EZE is about 32–40km southwest of the city center, further out than many capital-city airports — budget 40–60+ minutes. Options: official remise/taxi (~40 min, pre-book at the arrivals counter to avoid overcharging); Tienda León shuttle bus to Madero (near the Hilton), ~50 min; public Urban Bus Line 8, cheapest but 2+ hours. Uber/Cabify pickup is available outside arrivals.',
      customs: '$500 USD of goods duty-free for adults arriving by air ($250 for minors); amounts above that are taxed at 50% of the excess value. Declare cash or monetary instruments of $10,000 USD or more (Form OM 2087) — undeclared amounts above this can be confiscated with fines.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Buenos Aires?', a: 'US, Canadian, UK, EU, Australian, and most Latin American passport holders can enter visa-free for up to 90 days, extendable once for another 90 days at the Dirección Nacional de Migraciones.' },
      { q: 'Is yellow fever vaccination required for Argentina?', a: 'Not required for Buenos Aires or EZE. It\'s recommended only if your trip includes the northern forested provinces of Misiones and Corrientes — including Iguazú Falls — due to Argentina\'s own limited risk zone bordering Brazil and Paraguay.' },
      { q: 'Is Ezeiza airport far from the city?', a: 'Yes — EZE is roughly 32–40km southwest of central Buenos Aires, noticeably further out than many capital-city airports. Budget at least 40–60 minutes for the trip depending on traffic and your transport choice.' },
      { q: 'What happened to the Argentine "blue dollar"?', a: 'Argentina lifted currency controls in April 2025, and by 2026 the official, MEP, and informal "blue dollar" rates have converged to within a few percent of each other — the huge arbitrage gap from 2023 is gone. Bring a card and check a live exchange rate before your trip rather than relying on older guides.' },
      { q: 'What\'s the cheapest way from Ezeiza to downtown Buenos Aires?', a: 'Public Urban Bus Line 8 is cheapest but takes 2+ hours. The Tienda León shuttle (~50 min to Madero) is the best value-for-time option. Pre-booked remise or a rideshare app is faster (~40 min) if you\'d rather pay more for door-to-door service.' },
    ],
  },

  'colombia-bogota': {
    name: 'Colombia',
    capital: 'Bogotá',
    flag: '🇨🇴',
    airportCode: 'BOG',
    airportName: 'El Dorado International Airport (BOG)',
    img: 'https://images.unsplash.com/photo-1700526032300-e4005d8874d8?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for El Dorado Airport itself (BOG), Bogotá
    timezone: 'America/Bogota',
    lat: 4.7016,
    lng: -74.1469,
    last_verified: '2026-07-22',
    sources: [
      'https://www.gov.uk/foreign-travel-advice/colombia/entry-requirements',
      'https://www.visaverge.com/travel/colombian-visa-your-complete-guide/',
      'https://wwwnc.cdc.gov/travel/yellowbook/2024/preparing/yellow-fever-vaccine-malaria-prevention-by-country/colombia',
      'https://www.decconsultores.com/en/cash-traveler/',
      'https://apps.migracioncolombia.gov.co/check-mig',
    ],
    localApps: [
      { name: 'Uber', category: 'ride-share', note: 'Legally operates in Bogotá as a "car rental with driver" service (a workaround Uber adopted in 2020 after a brief ban) — works fine day to day, though the legal framework is still debated locally.', url: 'https://www.uber.com/co/es/' },
      { name: 'inDrive', category: 'ride-share', note: 'A fast-growing local favorite where you negotiate the fare with the driver — widely used across Colombia alongside Uber and DiDi.', url: 'https://indrive.com/en/' },
      { name: 'Nequi', category: 'payment', note: 'Colombia\'s own hugely popular digital wallet (backed by Bancolombia) — mostly for domestic transfers/QR pay, and only useful to you if you set up a local account; otherwise pay by card or cash.', url: 'https://www.nequi.com.co/' },
    ],
    entry: {
      visaFreeCountries:
        'Colombia gives visa-free entry to around 100+ nationalities, including the US, Canada, UK, EU, Australia, and most of Latin America. On arrival you\'ll typically get a 90-day stamp, extendable once for another 90 days at a Migración Colombia office — up to 180 days total per calendar year.',
      visaOnArrival: 'Colombia does not run a separate paid visa-on-arrival system for its visa-exempt list — eligible nationalities simply receive the 90-day entry stamp.',
      evisa:
        'Colombia does not have a general tourist e-Visa for most Western nationalities. A notable 2026 waiver: travelers from Cambodia, China, India, Macau, Myanmar, Thailand, and Vietnam can get 90-day visa-free entry if they hold a valid US or Schengen visa (or equivalent residency) valid for at least 180 days from arrival — confirm current eligibility at Migración Colombia.',
      passportValidity: 'Colombian authorities recommend passport validity of at least 6 months beyond your planned departure date.',
      notes:
        '⚠️ All travelers, regardless of nationality, must complete the free Check-Mig registration (apps.migracioncolombia.gov.co/check-mig) between 72 hours and 1 hour before each flight into or out of Colombia — airlines increasingly require proof of submission before boarding.',
    },
    health: {
      vaccines: 'No vaccines are legally required for most travelers arriving directly from the US, Canada, UK, or EU. Hepatitis A, Typhoid, and routine vaccines are commonly recommended.',
      yellowFever:
        'Colombia has its own domestic yellow fever risk zones — this is not just an "arriving from elsewhere" rule. A certificate IS required if arriving from Angola, Brazil, DR Congo, or Uganda (including transits over 12 hours). ' +
        'For Bogotá specifically: vaccination is NOT recommended for travel limited to the city, since Bogotá sits above 2,300m elevation, too high for the mosquito that transmits yellow fever, and it is explicitly excluded from CDC risk maps. It\'s also not recommended for Barranquilla, Cali, Cartagena, or Medellín. ' +
        'It IS recommended if your itinerary extends to lower-altitude jungle, Amazon, or rural risk areas — and CDC/WHO have flagged newly affected border areas in Colombia, Bolivia, and Peru since 2025, so check current maps for anywhere outside the main cities.',
      malaria: 'No malaria risk in Bogotá itself — the altitude (~2,640m) is too high for transmission. Risk exists in lower-elevation rural, jungle, Amazon, and Pacific coast regions below roughly 1,700m — check CDC/WHO maps if your trip extends beyond Bogotá.',
      notes: '⚠️ Health requirements sourced from the CDC Yellow Book. Always confirm with your doctor or a travel clinic before departure, especially if traveling beyond Bogotá to lower-altitude regions.',
    },
    arrival: {
      currency: 'Colombian Peso (COP). ATMs widely available in Bogotá; card payments are broadly accepted in the capital, less so in smaller towns.',
      simCard: 'Claro, Movistar, and Tigo counters are inside El Dorado, past security. Tourist SIMs from any of the three run roughly 30,000–50,000 COP ($7–$12 USD) with 500MB–2GB of initial data — city-center shops are typically cheaper than the airport.',
      transport: 'El Dorado is about 15km from central Bogotá. TransMilenio (bus rapid transit) has a station inside the airport — the direct K86 line runs to Calle 26/Centro Internacional (~7,000 COP for the reusable Tullave card plus ~3,200 COP per ride), or take the free airport feeder to Portal El Dorado and connect to K86. Journey is roughly 45 minutes. Taxis from the arrivals queue to La Candelaria run 60,000–80,000 COP, 30–45 minutes — white taxis are prepaid/booked at a counter, yellow taxis are metered. Uber/inDrive pickup is also available, typically 40,000–100,000 COP depending on demand.',
      customs: '[VERIFY: general personal-goods duty-free allowance figures for Colombia vary by source — confirm current limits with DIAN before travel.] Cash: amounts up to $10,000 USD (or equivalent) require no declaration; anything above that must be declared on DIAN Form 530. Failing to declare cash over the threshold can result in a 30% fine on the excess and confiscation of the undeclared portion.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Bogotá?', a: 'US, Canadian, UK, EU, Australian, and most Latin American passport holders can enter visa-free for a 90-day stamp, extendable once for another 90 days — up to 180 days total per calendar year.' },
      { q: 'What is the Check-Mig form and do I really need it?', a: 'Yes — every traveler, regardless of nationality, must submit the free Check-Mig form online between 72 hours and 1 hour before each flight into or out of Colombia. Airlines increasingly check for it before boarding, so don\'t skip it even though enforcement has historically been inconsistent.' },
      { q: 'Is yellow fever vaccination required for Bogotá?', a: 'No — Bogotá sits above 2,300m elevation, too high for the mosquito that carries yellow fever, and is explicitly excluded from risk maps. It\'s only relevant if your trip extends to lower-altitude jungle, Amazon, or rural areas, or if you\'re arriving from a handful of at-risk countries (Angola, Brazil, DR Congo, Uganda).' },
      { q: 'Is altitude sickness a concern in Bogotá?', a: 'Bogotá sits at roughly 2,640m (8,660ft) — some visitors feel mild effects (headache, breathlessness) for the first day or two. Take it easy on arrival, stay hydrated, and go light on alcohol the first night.' },
      { q: 'What\'s the cheapest way from El Dorado airport to La Candelaria?', a: 'TransMilenio\'s K86 line, accessible from inside the airport (or via the free feeder to Portal El Dorado), is cheapest at a few thousand pesos and takes about 45 minutes. A metered taxi is faster and costs 60,000–80,000 COP for a 30–45 minute ride.' },
    ],
  },

  'italy-rome': {
    name: 'Italy',
    capital: 'Rome',
    flag: '🇮🇹',
    airportCode: 'FCO',
    airportName: 'Leonardo da Vinci–Fiumicino Airport (FCO)',
    img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Fiumicino Airport itself (FCO), southwest of central Rome
    timezone: 'Europe/Rome',
    lat: 41.8003,
    lng: 12.2389,
    last_verified: '2026-07-22',
    recheck_note: 'ETIAS status is actively changing — the EU dropped its 2026 target in July 2026 and a 2027 launch is likely. Recheck before booking if your trip is more than a few months out.',
    sources: [
      'https://www.esteri.it/en/servizi-opportunita/ingressosoggiornoinitalia/visto_ingresso/paesi_esenti_visto/',
      'https://europa.eu/youreurope/citizens/travel/carry/alcohol-tobacco-cash/index_en.htm',
      'https://travelhealthpro.org.uk/country/111/italy',
      'https://home-affairs.ec.europa.eu/news/entryexit-system-ees-fully-operational-2026-04-10_en',
      'https://etias.com/articles/etias-drops-2026-date-as-launch-slips-out-of-view',
    ],
    localApps: [
      { name: 'Uber', category: 'ride-share', note: 'Operates in Rome, but only through licensed NCC (chauffeur-hire) drivers or affiliated licensed taxis — there\'s no low-cost UberX here, so expect taxi-comparable pricing.', url: 'https://www.uber.com/it/en/' },
      { name: 'FREENOW', category: 'ride-share', note: 'Books regular licensed white taxis in Rome (and Milan, Florence, Naples) with upfront regulated fares — a solid Uber alternative given Italy\'s taxi-only rules.', url: 'https://www.free-now.com/it-en/' },
      { name: 'Satispay', category: 'payment', note: 'Italy\'s dominant homegrown mobile wallet, accepted via QR code at a huge number of cafés and shops — not essential for tourists (cards work everywhere) but you\'ll see the logo constantly.', url: 'https://www.satispay.com/en-it/personal/' },
    ],
    entry: {
      visaFreeCountries:
        'About 60 non-EU nationalities — including the US, UK, Canada, Australia, New Zealand, Japan, and South Korea — can enter Italy (and the wider Schengen Area) visa-free ' +
        'for up to 90 days in any rolling 180-day period, for tourism or business. The official list is maintained by Italy\'s Ministry of Foreign Affairs (esteri.it).',
      visaOnArrival:
        'Not available. Nationalities not on the visa-exempt list must obtain a Schengen short-stay visa from an Italian consulate before travel.',
      evisa:
        'Italy does not currently have a standalone e-visa for short tourist stays — visa-exempt nationals need nothing beyond a valid passport (see ETIAS note below). ' +
        'Others apply for a Schengen visa in advance.',
      passportValidity:
        'Standard Schengen rule: your passport must have been issued within the last 10 years AND remain valid for at least 3 months beyond your planned departure date from the Schengen Area. ' +
        'These are two independent checks.',
      notes:
        '⚠️ ETIAS has NOT launched as of July 2026 — the EU dropped its previous 2026 target date and a 2027 launch now looks likely. Nothing needs to be applied for today. ' +
        'Separately, the EU\'s Entry/Exit System (EES) — biometric fingerprint/facial-image registration replacing passport stamps — became fully operational on 10 April 2026, ' +
        'so expect a somewhat different (and occasionally slower) process at Fiumicino passport control. Always verify at esteri.it before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required to enter Italy. Routine vaccines (MMR, tetanus, diphtheria-polio) being up to date is the standard NaTHNaC recommendation.',
      yellowFever:
        'Not required. Italy is not a yellow-fever risk country and does not require a certificate from travelers arriving from at-risk countries.',
      malaria:
        'Italy (including Rome) is malaria-free. No antimalarial medication needed for this itinerary.',
      notes:
        '⚠️ Health guidance sourced from NaTHNaC (travelhealthpro.org.uk). Always confirm with your doctor or travel clinic before departure.',
    },
    arrival: {
      currency: 'Euro (EUR). ATMs (Bancomat) widely available. Contactless/Apple Pay accepted almost everywhere, plus Satispay at many small shops.',
      simCard: 'TIM and Vodafone both have stores in Terminal 3 arrivals at Fiumicino; WindTre has a kiosk near Gate B5. Tourist SIMs with ~30GB run about €25–€35 for 30 days. Bring your passport — Italy requires ID to register a SIM.',
      transport:
        'The Leonardo Express runs nonstop from FCO to Roma Termini in 32 minutes, every 15–30 min, for €14 at the station (€17.90 booked online). ' +
        'The regional FL1 train is a cheaper, slower alternative (~€8) stopping at Trastevere and Ostiense. ' +
        'Official fixed-rate taxis cost €55 to anywhere inside the Aurelian Walls (city center) — confirm the driver is a \'Comune di Roma\' white taxi, since \'Comune di Fiumicino\' taxis charge €60.',
      customs:
        '200 cigarettes (or equivalent) duty-free. 4 litres still wine + 16 litres beer, plus either 1 litre spirits or 2 litres fortified/sparkling wine. ' +
        '€430 of other goods (€150 for under-15s) before import duty applies. Declare cash of €10,000 or more.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Rome?', a: 'About 60 nationalities, including the US, UK, Canada, and Australia, can visit Italy visa-free for up to 90 days in any 180-day period. Check esteri.it (Italy\'s Ministry of Foreign Affairs) for your specific passport.' },
      { q: 'Is Uber available in Rome?', a: 'Yes, but differently than you\'re used to — Italian law restricts paid rides to licensed taxis or licensed NCC (chauffeur-hire) drivers, so Uber in Rome books one of those rather than a cheap UberX. FREENOW is a solid alternative that books standard licensed taxis with upfront fares.' },
      { q: 'Is ETIAS required to enter Italy yet?', a: 'No — as of July 2026, ETIAS has not launched. The EU removed its 2026 target and a 2027 launch looks more likely. There\'s nothing to apply for right now if you\'re a visa-exempt visitor.' },
      { q: 'Do I need any vaccinations for Italy?', a: 'No vaccines are legally required, and there\'s no yellow fever or malaria risk in Italy. Just keep routine vaccines (MMR, tetanus) up to date, per NaTHNaC.' },
      { q: 'What is the cheapest way from Fiumicino into Rome?', a: 'The regional FL1 train (~€8) is cheapest but makes more stops. The Leonardo Express (€14, 32 min nonstop to Termini) is the standard tourist choice. Fixed-rate taxis are €55 to anywhere inside the historic center — just confirm it\'s a \'Comune di Roma\' white taxi.' },
    ],
  },

  'netherlands-amsterdam': {
    name: 'Netherlands',
    capital: 'Amsterdam',
    flag: '🇳🇱',
    airportCode: 'AMS',
    airportName: 'Amsterdam Airport Schiphol (AMS)',
    img: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Schiphol Airport itself (AMS), southwest of central Amsterdam
    timezone: 'Europe/Amsterdam',
    lat: 52.3105,
    lng: 4.7683,
    last_verified: '2026-07-22',
    recheck_note: 'ETIAS status is actively changing — the EU dropped its 2026 target in July 2026 and a 2027 launch is likely. Recheck before booking if your trip is more than a few months out.',
    sources: [
      'https://ind.nl/en',
      'https://www.netherlandsworldwide.nl/visa-the-netherlands/types-of-visa',
      'https://europa.eu/youreurope/citizens/travel/carry/alcohol-tobacco-cash/index_en.htm',
      'https://travelhealthpro.org.uk/country/160/netherlands',
      'https://home-affairs.ec.europa.eu/news/entryexit-system-ees-fully-operational-2026-04-10_en',
      'https://etias.com/articles/etias-drops-2026-date-as-launch-slips-out-of-view',
    ],
    localApps: [
      { name: 'Uber', category: 'ride-share', note: 'Operates in Amsterdam, but drivers must hold an official Dutch taxi license — so it books a regulated licensed taxi rather than a private-car UberX.', url: 'https://www.uber.com/nl/en/' },
      { name: 'Bolt', category: 'ride-share', note: 'Widely used in Amsterdam alongside Uber — often a bit cheaper, worth comparing both.', url: 'https://bolt.eu/en/cities/amsterdam/' },
      { name: '9292', category: 'maps', note: 'The official Dutch public transport journey planner — combines every train, tram, bus, metro, and ferry operator into one app, including routes from Schiphol.', url: 'https://9292.nl/en' },
    ],
    entry: {
      visaFreeCountries:
        'About 60 non-EU nationalities — including the US, UK, Canada, Australia, New Zealand, Japan, and South Korea — can enter the Netherlands (and the wider Schengen Area) visa-free ' +
        'for up to 90 days in any rolling 180-day period, for tourism or business. Check current eligibility via the Dutch Immigration and Naturalisation Service (IND).',
      visaOnArrival:
        'Not available. Nationalities not on the visa-exempt list must obtain a Schengen short-stay visa from a Dutch consulate before travel (around €80 for adults).',
      evisa:
        'The Netherlands does not currently have a standalone e-visa for short tourist stays — visa-exempt nationals need nothing beyond a valid passport (see ETIAS note below). ' +
        'Others apply for a Schengen visa in advance through IND or a Dutch consulate.',
      passportValidity:
        'Standard Schengen rule: your passport must have been issued within the last 10 years AND remain valid for at least 3 months beyond your planned departure date from the Schengen Area. ' +
        'These are two independent checks.',
      notes:
        '⚠️ ETIAS has NOT launched as of July 2026 — the EU dropped its previous 2026 target date and a 2027 launch now looks likely. Nothing needs to be applied for today. ' +
        'Separately, the EU\'s Entry/Exit System (EES) — biometric fingerprint/facial-image registration replacing passport stamps — became fully operational on 10 April 2026, ' +
        'so expect a somewhat different (and occasionally slower) process at Schiphol passport control. Always verify with IND before booking.',
    },
    health: {
      vaccines:
        'No vaccines are legally required to enter the Netherlands. Routine vaccines (MMR, tetanus, diphtheria-polio) being up to date is the standard NaTHNaC recommendation.',
      yellowFever:
        'Not required. The Netherlands is not a yellow-fever risk country and does not require a certificate from travelers arriving from at-risk countries.',
      malaria:
        'The Netherlands is malaria-free. No antimalarial medication needed for this itinerary.',
      notes:
        '⚠️ Health guidance sourced from NaTHNaC (travelhealthpro.org.uk). Always confirm with your doctor or travel clinic before departure.',
    },
    arrival: {
      currency: 'Euro (EUR). ATMs widely available. Contactless/Apple Pay accepted almost everywhere — some smaller shops are card/phone-only and don\'t take cash at all.',
      simCard: 'KPN, Vodafone, and Odido all have counters in Schiphol Plaza arrivals. Tourist SIMs run roughly €10–€35 depending on data — prices are noticeably cheaper if you wait and buy in central Amsterdam instead.',
      transport:
        'Direct NS trains run from Schiphol to Amsterdam Centraal every few minutes, taking about 17 minutes for a €6.20–€7.10 second-class single (buy at machines or tap in/out with contactless — no paper ticket needed). ' +
        'Metered taxis are also available outside arrivals for those with heavy luggage or arriving very late.',
      customs:
        '200 cigarettes (or equivalent) duty-free. 4 litres still wine + 16 litres beer, plus either 1 litre spirits or 2 litres fortified/sparkling wine. ' +
        '€430 of other goods (€150 for under-15s) before import duty applies. Declare cash of €10,000 or more.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Amsterdam?', a: 'About 60 nationalities, including the US, UK, Canada, and Australia, can visit the Netherlands visa-free for up to 90 days in any 180-day period. Check with the Dutch Immigration and Naturalisation Service (IND) for your specific passport.' },
      { q: 'Is ETIAS required to enter the Netherlands yet?', a: 'No — as of July 2026, ETIAS has not launched. The EU dropped its 2026 target date and a 2027 launch looks more likely. There\'s nothing to apply for right now if you\'re a visa-exempt visitor.' },
      { q: 'Do I need any vaccinations for the Netherlands?', a: 'No vaccines are legally required, and there\'s no yellow fever or malaria risk in the Netherlands. Just keep routine vaccines (MMR, tetanus) up to date, per NaTHNaC.' },
      { q: 'What is iDEAL and do I need it as a tourist?', a: 'iDEAL is the Dutch bank-transfer payment system locals use for the majority of online and in-store purchases — but it requires a Dutch bank account, so it\'s not available to visitors. Contactless bank cards and Apple Pay/Google Pay work everywhere iDEAL does, so you won\'t be missing out.' },
      { q: 'What is the cheapest way from Schiphol into Amsterdam?', a: 'The direct NS train to Amsterdam Centraal is both the cheapest and fastest option — about 17 minutes for roughly €6–€7, with trains departing every few minutes. There\'s rarely a reason to take a taxi unless you have heavy luggage or land very late at night.' },
    ],
  },

  uk: {
    name: 'United Kingdom',
    capital: 'London',
    flag: '🇬🇧',
    airportCode: 'LHR',
    airportName: 'Heathrow Airport (LHR)',
    img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Heathrow Airport itself (LHR), not central London
    timezone: 'Europe/London',
    lat: 51.4700,
    lng: -0.4543,
    last_verified: '2026-07-23',
    // ETA fee/rules have moved twice in the last 18 months (launch tiers through
    // 2024-2025, fee hike + carrier enforcement in Feb/Apr 2026) — recheck the
    // fee and any new nationality tiers every few months.
    recheck_note: 'Recheck ETA fee and enforcement rules periodically — moved twice in 2026 already.',
    sources: [
      'https://www.gov.uk/guidance/apply-for-an-electronic-travel-authorisation-eta',
      'https://homeofficemedia.blog.gov.uk/electronic-travel-authorisation-eta-factsheet-april-2026/',
      'https://wwwnc.cdc.gov/travel/yellowbook/2024/preparing/yellow-fever-vaccine-malaria-prevention-by-country/united-kingdom',
      'https://www.heathrowexpress.com/the-route/heathrow-express-vs-the-elizabeth-line',
      'https://www.gov.uk/duty-free-goods',
    ],
    localApps: [
      { name: 'Uber', category: 'ride-share', note: 'Fully legal and TfL-licensed in London — the most widely used app, with UberX/Comfort/Black tiers. Pick-up from Heathrow’s designated ride-share zone (a short walk/shuttle from most terminals).', url: 'https://www.uber.com/gb/en/' },
      { name: 'Bolt', category: 'ride-share', note: 'Estonian-founded rival to Uber, also TfL-licensed — usually cheaper base fares and fewer surge spikes, grown fast in London since 2023.', url: 'https://bolt.eu/en-gb/cities/london/' },
      { name: 'Citymapper', category: 'maps', note: 'Built around London’s Tube/bus/rail network specifically — better real-time disruption info than Google Maps for the Underground.', url: 'https://citymapper.com/london' },
    ],
    entry: {
      visaFreeCountries:
        'The UK doesn’t run a classic "visa-free" list the way many countries do — instead, most nationalities that never needed a visitor visa (US, Canada, Australia, EU/EEA, and dozens more) can visit visa-free for up to 6 months, but as of 2026 they must hold a UK Electronic Travel Authorisation (ETA) before travel. ' +
        'This isn’t optional paperwork: since 25 February 2026, airlines and other carriers must refuse boarding to anyone without a valid ETA, so you need it before you check in, not before you land. ' +
        'British and Irish citizens (including dual citizens) never need an ETA.',
      visaOnArrival:
        'No visa-on-arrival scheme exists for the UK. If you’re from a nationality that isn’t visa-exempt (e.g. India, China, most of Africa and the Middle East), you need a full visit visa applied for and approved in advance — there is no at-the-border option.',
      evisa:
        'The "UK ETA" (gov.uk or the official UK ETA app) is the electronic authorisation for visa-exempt nationalities — £20 fee per person (including infants), most applications auto-approved within minutes, though gov.uk recommends applying at least 3 working days ahead. Valid for multiple trips of up to 6 months each, for 2 years or until your passport expires, whichever comes first.',
      passportValidity:
        'No fixed "6 months beyond your stay" rule like many countries — gov.uk states your passport must simply be valid for your entire stay in the UK. In practice, carriers and border staff still sometimes expect a buffer, so don’t cut it close to expiry.',
      notes:
        '⚠️ The ETA requirement is still relatively new and has changed twice in 2026 (fee raised from £16 to £20 on 8 April 2026; carrier boarding checks went live 25 Feb 2026). Apply at gov.uk or the official "UK ETA" app — never a third-party site, which will charge more for the same thing.',
    },
    health: {
      vaccines:
        'No vaccinations are required by law to enter the UK. Routine vaccines (MMR, tetanus/diphtheria, flu) being up to date is the standard general travel-health advice, not a UK-specific requirement.',
      yellowFever:
        'The UK does not require a yellow fever certificate for entry from any country — it has no risk of yellow fever transmission itself and does not impose the "arriving from an endemic country" transit rule that some destinations (e.g. Thailand, UAE) do.',
      malaria:
        'The UK has no malaria risk. No antimalarial medication is needed for any UK trip.',
      notes:
        '⚠️ Sourced from the CDC Yellow Book country page for the United Kingdom and general NHS travel-health guidance. Always confirm with your doctor before departure, especially if you’re connecting through a country with its own entry requirements.',
    },
    arrival: {
      currency: 'Pound Sterling (GBP). Contactless/Apple Pay/Google Pay is the dominant way to pay almost everywhere, including the Tube and buses — you often don’t need cash at all for a short trip. ATMs are widely available at Heathrow and across London.',
      simCard: 'EE, Vodafone, O2, and Three all have counters or vending machines in Heathrow arrivals; expect £10–£20 for a 30-day 15–30GB bundle. Three’s prepaid SIMs include free EU roaming, useful if you’re continuing on to the continent. An eSIM bought before you land is usually cheaper and skips the queue.',
      transport: 'Heathrow Express: 15 min nonstop to Paddington, £25 walk-up (£10 if booked 45+ days ahead for a fixed train). Elizabeth line: ~27 min with intermediate stops, flat £15.50 with contactless/Oyster, no peak surcharge — the better value option for most travelers. Black cabs and Uber/Bolt also available from the designated ranks/pickup zones.',
      customs: '200 cigarettes (or equivalent) and standard alcohol allowances (42L beer, 18L still wine, or a mix of 4L spirits + 9L of drinks up to 22% ABV) duty-free for arrivals from anywhere in the world — the same limits apply from the EU as from anywhere else since Brexit. Declare cash of £10,000 or more (or equivalent).',
    },
    faqs: [
      { q: 'Do I need a visa to visit London?', a: 'Most nationalities (US, Canada, Australia, EU, and dozens more) don’t need a visitor visa for stays up to 6 months, but as of 2026 they DO need a UK Electronic Travel Authorisation (ETA) before travel — it’s a £20, usually-instant online approval, not a visa. Airlines are required to refuse boarding without one since 25 February 2026, so get it before you book your flight, not after.' },
      { q: 'What is the UK ETA and how much does it cost?', a: 'The ETA is an online pre-travel authorisation for visa-exempt visitors, applied for via gov.uk or the official "UK ETA" app. It costs £20 per person (raised from £16 in April 2026), including children and infants. Most applications are auto-approved within minutes, though gov.uk recommends applying at least 3 working days before you travel. It’s valid for multiple visits over 2 years or until your passport expires.' },
      { q: 'Do I need any vaccinations to enter the UK?', a: 'No. The UK has no vaccine entry requirements and no yellow fever or malaria risk. Being up to date on routine vaccines (MMR, tetanus) is standard general advice, not a UK-specific rule.' },
      { q: 'What is the cheapest way from Heathrow to central London?', a: 'The Elizabeth line is the best value: a flat £15.50 with contactless or Oyster, about 27 minutes to central London, no peak-time surcharge. Heathrow Express is faster (15 min nonstop to Paddington) but costs £25 on the day, or £10 if booked 45+ days ahead for a fixed departure.' },
      { q: 'Can I get a SIM card at Heathrow?', a: 'Yes — EE, Vodafone, O2, and Three all have arrivals-hall counters or vending machines. A 30-day tourist bundle typically runs £10–£20. Buying an eSIM online before you land is usually cheaper and skips any queue.' },
    ],
  },

  france: {
    name: 'France',
    capital: 'Paris',
    flag: '🇫🇷',
    airportCode: 'CDG',
    airportName: 'Charles de Gaulle Airport (CDG)',
    img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=600&fit=crop&auto=format',
    // Coordinates are for Charles de Gaulle Airport itself (CDG), not central Paris
    timezone: 'Europe/Paris',
    lat: 49.0097,
    lng: 2.5479,
    last_verified: '2026-07-23',
    // ETIAS keeps slipping — last official signal (July 2026) removed even the
    // "late 2026" target. Recheck before publishing anything with a firm ETIAS date.
    recheck_note: 'Recheck ETIAS launch-date status — EU removed its 2026 target in July 2026, next official update expected after eu-LISA meets in September 2026.',
    sources: [
      'https://www.gov.uk/foreign-travel-advice/france/entry-requirements',
      'https://home-affairs.ec.europa.eu/news/entryexit-system-ees-fully-operational-2026-04-10_en',
      'https://etias.com/articles/etias-drops-2026-date-as-launch-slips-out-of-view',
      'https://wwwnc.cdc.gov/travel/yellowbook/2024/preparing/yellow-fever-vaccine-malaria-prevention-by-country/france',
      'https://www.bonjour-ratp.fr/en/titres-tarifs/billets-orlybus-roissybus/',
      'https://europa.eu/youreurope/citizens/travel/carry/alcohol-tobacco-cash/index_en.htm',
      'https://www.douane.gouv.fr/en/fiche/cash-reporting-obligation',
    ],
    localApps: [
      { name: 'Uber', category: 'ride-share', note: 'Fully legal in Paris, operating as licensed VTC (private-hire) — widely used for airport runs to/from CDG, including an electric/hybrid "Uber Green" fleet.', url: 'https://www.uber.com/fr/en/' },
      { name: 'Bolt', category: 'ride-share', note: 'Popular alternative to Uber for shorter hops within Paris — often cheaper, also operates as licensed VTC.', url: 'https://bolt.eu/en-fr/cities/paris/' },
      { name: 'Bonjour RATP', category: 'maps', note: 'The official Paris transit app (metro, RER, bus) — also where you buy the Navigo Easy pass and RER B airport tickets digitally.', url: 'https://www.bonjour-ratp.fr/en/' },
    ],
    entry: {
      visaFreeCountries:
        'France is in the Schengen Area, so the same rule applies as for any Schengen country: citizens of the US, UK, Canada, Australia, and roughly 60 other visa-exempt nationalities can enter for up to 90 days in any rolling 180-day period without a visa, for tourism, business, or family visits. ' +
        'That 90 days is shared across the ENTIRE Schengen Area, not per-country — time spent in Italy or Germany in the last 180 days counts against your French allowance too. Overstaying risks a Schengen-wide ban of up to 3 years.',
      visaOnArrival:
        'No visa-on-arrival scheme exists for France or the wider Schengen Area. If your nationality isn’t on the 90/180 visa-exempt list, you need a Schengen visa approved in advance from a French consulate (or the consulate of your main destination country).',
      evisa:
        'No e-visa system currently exists for short Schengen visits — visa-required nationalities apply for a physical/sticker Schengen visa in advance. The EU’s upcoming ETIAS is NOT a visa and does not change this: it will be a pre-travel screening/authorisation layered on top of the existing visa-free allowance for visa-exempt travelers, similar in spirit to the UK’s ETA. ' +
        'As of July 2026, ETIAS has still not launched — the EU quietly dropped its "late 2026" target and a 2027 start is now considered more likely, pending an eu-LISA management board decision expected September 2026.',
      passportValidity:
        'Your passport must (1) have been issued within the last 10 years as of your arrival date, and (2) be valid for at least 3 months beyond your planned departure date from the Schengen Area (not just from France). Older passports renewed before Oct 2018 with an issue date beyond 10 years can be refused even if not technically expired.',
      notes:
        '⚠️ Since 10 April 2026 the EU’s Entry/Exit System (EES) is fully operational Schengen-wide, including at CDG: non-EU visitors now register fingerprints and a facial photo at the border on first entry instead of getting a passport stamp, and that digital record is reused for 3 years. Expect this to add time at CDG immigration on your first Schengen entry — there were reports of kiosk crashes and long manual-processing queues at CDG/Orly in the days right after the April 2026 rollout. Build in extra buffer, especially on first entry.',
    },
    health: {
      vaccines:
        'No vaccinations are legally required to enter France. Being up to date on routine vaccines (MMR, tetanus/diphtheria) is standard general travel advice, not a France-specific requirement.',
      yellowFever:
        'France does not require a yellow fever certificate for entry from any country for mainland/European France. (Note: French overseas territories like French Guiana have their own yellow fever rules — not relevant for a CDG/Paris trip.)',
      malaria:
        'Mainland France has no malaria risk. No antimalarial medication is needed for a Paris trip.',
      notes:
        '⚠️ Sourced from the CDC Yellow Book country page for France. Always confirm with your doctor or a travel clinic before departure, especially if you’re connecting through a country with its own entry/health requirements.',
    },
    arrival: {
      currency: 'Euro (EUR). Contactless card and Apple Pay/Google Pay are widely accepted, including on the RER and metro — cash is still useful for small cafés/markets but not essential. ATMs widely available at CDG.',
      simCard: 'Orange, SFR, and Bouygues Telecom all sell tourist prepaid SIMs at CDG (mainly via Relay convenience-store counters in Terminals 1, 2E, and 2F), roughly €25–€30 for a data bundle. Airport prices run higher than buying in central Paris — an eSIM bought before you land is usually cheaper and skips the queue. Passport required for SIM registration (standard EU rule).',
      transport: 'RER B is the only direct rail link into central Paris: flat €14 fare (Paris Region ↔ Airports ticket), trains roughly every 10–15 min, about 5:00–23:30, ~35–50 min to central stations like Châtelet–Les Halles or Gare du Nord. Note: the old Roissybus direct-to-Opéra bus permanently stopped running on 1 March 2026 and has not been replaced — RER B or a taxi/Uber/Bolt are now the only practical options. Taxis to central Paris run a flat rate ([VERIFY: current flat-rate figure before publishing, periodically revised — commonly cited as roughly €53–€58 right bank, €64 left bank]).',
      customs: 'Non-EU arrivals: 200 cigarettes (or equivalent) duty-free; alcohol allowance of 4 litres still wine + 16 litres beer, plus either 1 litre of spirits over 22% ABV or 2 litres under 22% ABV. Cash of €10,000 or more (or equivalent, including checks/securities) must be declared at customs; amounts over €50,000 require documented proof of origin.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Paris?', a: 'If you hold a passport from the US, UK, Canada, Australia, or one of roughly 60 other visa-exempt nationalities, you can visit France (and the rest of the Schengen Area) visa-free for up to 90 days in any rolling 180-day period. That 90 days is shared across all Schengen countries combined, not reset per country.' },
      { q: 'What is ETIAS and do I need it now?', a: 'ETIAS is an upcoming EU pre-travel screening system for visa-exempt visitors, similar to the UK’s ETA — but as of mid-2026 it still hasn’t launched. The EU dropped its "late 2026" target in July 2026, and a 2027 start now looks more likely. You do not need ETIAS to visit France right now; check back closer to your trip since the timeline keeps shifting.' },
      { q: 'What is the Entry/Exit System (EES) and how does it affect me at CDG?', a: 'EES is the EU’s new biometric border system — since it became fully operational on 10 April 2026, non-EU visitors get fingerprints and a facial photo registered at the border on first entry (replacing the old passport stamp), reused for 3 years. It can add time at CDG immigration, especially on a first entry — there were reports of long queues and kiosk issues right after the April 2026 rollout, so build in extra buffer.' },
      { q: 'How do I get from CDG airport to central Paris now that Roissybus is gone?', a: 'Roissybus (the direct bus to Opéra) permanently stopped running on 1 March 2026. RER B is now the main option — a flat €14 fare, roughly every 10–15 minutes, about 35–50 minutes to central stations like Gare du Nord or Châtelet–Les Halles. Taxis and Uber/Bolt are the other realistic options, especially with luggage or late at night.' },
      { q: 'Can I get a SIM card at Charles de Gaulle airport?', a: 'Yes — Orange, SFR, and Bouygues Telecom all have counters (mostly inside Relay convenience stores) in Terminals 1, 2E, and 2F, roughly €25–€30 for a tourist data bundle. It’s cheaper to buy an eSIM online before you land, or wait and buy in central Paris if you don’t need data immediately on arrival.' },
    ],
  },

};
