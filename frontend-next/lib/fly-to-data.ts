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

};
