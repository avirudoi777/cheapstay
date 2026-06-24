// Per-app brand metadata, limo services, and visa/entry notices for the booking detail page.

export interface AppMeta {
  bgColor: string;
  borderColor: string;
  tagline: string;
  description: string;
  downloadUrl: string;
}

export const APP_META: Record<string, AppMeta> = {
  'Uber': {
    bgColor: 'rgba(0,0,0,0.85)',
    borderColor: 'rgba(255,255,255,0.10)',
    tagline: 'Most popular worldwide',
    description: 'Works in 70+ countries — reliable, traceable rides with upfront pricing. Easy to use internationally.',
    downloadUrl: 'https://r.uber.com/cheapstay',
  },
  'Lyft': {
    bgColor: 'rgba(236,0,140,0.18)',
    borderColor: 'rgba(236,0,140,0.40)',
    tagline: 'US-only · often 10–20% cheaper',
    description: 'Lyft competes strongly with Uber across the US — frequently 10–20% cheaper on the same route, great loyalty rewards.',
    downloadUrl: 'https://www.lyft.com/invite/cheapstay',
  },
  'Bolt': {
    bgColor: 'rgba(52,211,153,0.14)',
    borderColor: 'rgba(52,211,153,0.38)',
    tagline: 'Usually 20–30% cheaper than Uber in Europe',
    description: 'The best-value ride-hailing app in Europe — lower prices, lower surges, available in 45+ countries.',
    downloadUrl: 'https://bolt.eu/en/download/',
  },
  'Grab': {
    bgColor: 'rgba(0,177,79,0.15)',
    borderColor: 'rgba(0,177,79,0.38)',
    tagline: 'The super-app of Southeast Asia',
    description: 'Rides, food, deliveries, and payments — Grab is essential across SE Asia. Set up your account before landing to avoid airport queues.',
    downloadUrl: 'https://www.grab.com/sg/download/',
  },
  'DiDi': {
    bgColor: 'rgba(255,107,0,0.15)',
    borderColor: 'rgba(255,107,0,0.38)',
    tagline: "China's dominant ride app — download before you land",
    description: 'DiDi is the only reliable ride-hailing option in mainland China. Register your account before arriving — the process is harder inside China.',
    downloadUrl: 'https://web.didiglobal.com/',
  },
  'DiDi Japan': {
    bgColor: 'rgba(255,107,0,0.15)',
    borderColor: 'rgba(255,107,0,0.38)',
    tagline: 'Budget alternative to metered taxis in Japan',
    description: 'DiDi operates in major Japanese cities. Often cheaper than traditional metered taxis, especially for late-night rides when trains stop.',
    downloadUrl: 'https://web.didiglobal.com/jp/',
  },
  'Gojek': {
    bgColor: 'rgba(0,136,10,0.15)',
    borderColor: 'rgba(0,136,10,0.38)',
    tagline: "Indonesia's super-app",
    description: 'Essential in Indonesia — GoCar for 4-wheel rides, GoRide for motorcycles. Also food, delivery, and payments.',
    downloadUrl: 'https://www.gojek.com/',
  },
  'Careem': {
    bgColor: 'rgba(2,115,74,0.18)',
    borderColor: 'rgba(2,115,74,0.40)',
    tagline: 'Gulf & Middle East leader',
    description: 'Careem (owned by Uber) dominates the Gulf region. Careem BLACK offers premium vehicles with fixed pricing — no surprises.',
    downloadUrl: 'https://www.careem.com/',
  },
  '99': {
    bgColor: 'rgba(255,204,0,0.15)',
    borderColor: 'rgba(255,204,0,0.42)',
    tagline: "Brazil's best Uber alternative",
    description: '99 (owned by DiDi) is the main Uber rival in Brazil — competitive pricing, especially in São Paulo and Rio. Good promos for new users.',
    downloadUrl: 'https://99app.com/',
  },
  'InDriver': {
    bgColor: 'rgba(40,40,40,0.55)',
    borderColor: 'rgba(255,255,255,0.10)',
    tagline: 'Name your price — drivers bid for your ride',
    description: 'inDriver is unique: you set the price, drivers bid. Often 20–40% cheaper than fixed-rate apps in Latin America and Central Asia.',
    downloadUrl: 'https://indriver.com/',
  },
  'inDriver': {
    bgColor: 'rgba(40,40,40,0.55)',
    borderColor: 'rgba(255,255,255,0.10)',
    tagline: 'Name your price — drivers bid for your ride',
    description: 'inDriver is unique: you set the price, drivers bid. Often 20–40% cheaper than fixed-rate apps across Latin America and Southeast Asia.',
    downloadUrl: 'https://indriver.com/',
  },
  'Cabify': {
    bgColor: 'rgba(124,58,237,0.15)',
    borderColor: 'rgba(124,58,237,0.38)',
    tagline: 'Premium rides · no surge pricing',
    description: 'Cabify focuses on quality — professional drivers, fixed prices, no surge. Popular in Spain, Mexico, and major South American cities.',
    downloadUrl: 'https://cabify.com/en',
  },
  'Kakao T': {
    bgColor: 'rgba(254,229,0,0.18)',
    borderColor: 'rgba(254,229,0,0.50)',
    tagline: "Korea's #1 taxi app — essential download",
    description: 'Kakao T powers almost all taxis in South Korea. Download before landing — faster to get a cab than waiting at the rank.',
    downloadUrl: 'https://www.kakaomobility.com/',
  },
  'LINE Taxi': {
    bgColor: 'rgba(0,195,0,0.15)',
    borderColor: 'rgba(0,195,0,0.38)',
    tagline: 'Integrated with LINE app in Taiwan & Japan',
    description: 'LINE Taxi is integrated with the LINE messaging app used widely in Taiwan and Japan. Simple if you already use LINE.',
    downloadUrl: 'https://taxi.line.me/',
  },
  'TADA': {
    bgColor: 'rgba(59,130,246,0.15)',
    borderColor: 'rgba(59,130,246,0.38)',
    tagline: 'Zero commission · no surge pricing in Singapore',
    description: 'TADA charges zero commission from drivers, making fares consistently lower than Grab with no surge during peak hours.',
    downloadUrl: 'https://tada.global/',
  },
  'HKTaxi': {
    bgColor: 'rgba(220,38,38,0.14)',
    borderColor: 'rgba(220,38,38,0.32)',
    tagline: 'Book metered Hong Kong taxis',
    description: 'HKTaxi lets you book the official metered taxis via app — no haggling. Red taxis cover urban HK Island and Kowloon.',
    downloadUrl: 'https://www.hktaxi.hk/',
  },
  'Be': {
    bgColor: 'rgba(229,57,53,0.15)',
    borderColor: 'rgba(229,57,53,0.38)',
    tagline: 'Often cheaper than Grab in Vietnam',
    description: 'Be (formerly Gojek Vietnam) frequently undercuts Grab on price. BeCar for 4-wheel rides, BeBike for scooter trips.',
    downloadUrl: 'https://be.com.vn/',
  },
  'AirAsia Ride': {
    bgColor: 'rgba(220,38,38,0.13)',
    borderColor: 'rgba(220,38,38,0.30)',
    tagline: 'Budget airport rides in Malaysia',
    description: 'AirAsia Ride is built into the AirAsia super-app — a budget-friendly option for KL airport rides with competitive flat rates.',
    downloadUrl: 'https://www.airasia.com/ride',
  },
  'BiTaksi': {
    bgColor: 'rgba(255,215,0,0.17)',
    borderColor: 'rgba(255,215,0,0.42)',
    tagline: 'Istanbul\'s official metered taxi app',
    description: "BiTaksi is Istanbul's most reliable taxi app — works with metered official taxis, so pricing is regulated. More consistent than Uber in Turkey.",
    downloadUrl: 'https://www.bitaksi.com/',
  },
  'FreeNow': {
    bgColor: 'rgba(28,28,28,0.50)',
    borderColor: 'rgba(255,255,255,0.12)',
    tagline: 'Licensed taxis · no surge in Germany',
    description: 'FreeNow (formerly mytaxi) dispatches licensed taxis in Germany and western Europe. Regulated fares — no surge pricing on busy nights.',
    downloadUrl: 'https://free-now.com/',
  },
  'Heetch': {
    bgColor: 'rgba(124,58,237,0.13)',
    borderColor: 'rgba(124,58,237,0.32)',
    tagline: 'Paris late-night alternative to Uber',
    description: 'Heetch specialises in affordable Paris night rides — especially good when Uber surges during events or weekend nights.',
    downloadUrl: 'https://www.heetch.com/',
  },
  'PedidosYa': {
    bgColor: 'rgba(252,66,66,0.14)',
    borderColor: 'rgba(252,66,66,0.32)',
    tagline: 'Rides & delivery in Paraguay / Uruguay',
    description: 'PedidosYa is primarily a food delivery app that also offers ride-hailing in Paraguay and Uruguay. Very affordable local pricing.',
    downloadUrl: 'https://www.pedidosya.com/',
  },
};

export function getAppMeta(appName: string): AppMeta {
  return APP_META[appName] ?? {
    bgColor: 'rgba(30,30,30,0.5)',
    borderColor: 'rgba(255,255,255,0.10)',
    tagline: 'Ride-hailing app',
    description: 'Download and set up your account before landing for the fastest pickup at the airport.',
    downloadUrl: `https://www.google.com/search?q=${encodeURIComponent(appName + ' app download')}`,
  };
}

// ── Limo / VIP services ────────────────────────────────────────────────────────

export interface LimoService {
  name: string;
  tagline: string;
  description: string;
  estimatedCost: string;
  url: string;
}

export const LIMO_SERVICES: Record<string, LimoService[]> = {
  JFK: [
    {
      name: 'Blacklane',
      tagline: 'Fixed price, no surge — Mercedes E-Class & S-Class',
      description: 'Meet & greet at baggage claim, free 60-min wait included. Professional chauffeurs, child seats available. Price locked at booking.',
      estimatedCost: 'From $85 to Midtown Manhattan',
      url: 'https://www.blacklane.com/en/',
    },
  ],
  LAX: [
    {
      name: 'Blacklane',
      tagline: 'Fixed price, no surge — professional chauffeurs',
      description: 'Curbside or meet & greet pickup. Free 60-min wait after landing. No surge pricing ever — price is locked when you book.',
      estimatedCost: 'From $75 to Hollywood · From $95 to Downtown',
      url: 'https://www.blacklane.com/en/',
    },
  ],
  LHR: [
    {
      name: 'Addison Lee',
      tagline: "London's top corporate car service",
      description: 'Addison Lee is the gold standard for London airport transfers — reliable, tracked, professional. No surge pricing, fixed quotes.',
      estimatedCost: 'From £60 to Central London',
      url: 'https://www.addisonlee.com/',
    },
    {
      name: 'Blacklane',
      tagline: 'Premium chauffeur · works worldwide',
      description: 'If you want a consistent, premium car service you can book anywhere in the world, Blacklane is reliable at LHR.',
      estimatedCost: 'From £75 to Central London',
      url: 'https://www.blacklane.com/en/',
    },
  ],
  DXB: [
    {
      name: 'Blacklane',
      tagline: 'Luxury chauffeur in Dubai',
      description: 'Professional chauffeurs, meet & greet inside arrivals, fixed price with no surge. Mercedes S-Class and SUVs available.',
      estimatedCost: 'From AED 250 ($68) to Downtown Dubai',
      url: 'https://www.blacklane.com/en/',
    },
    {
      name: 'Careem BLACK',
      tagline: 'Careem\'s premium tier — guaranteed premium vehicles',
      description: 'Select Careem BLACK in the Careem app for premium vehicles with professional drivers. Fixed pricing, no surge.',
      estimatedCost: 'From AED 120 to Downtown Dubai',
      url: 'https://www.careem.com/',
    },
  ],
  SIN: [
    {
      name: 'Blacklane',
      tagline: 'Fixed-price luxury transfers at Changi',
      description: 'Blacklane operates from Changi with meet & greet inside the terminal and a free 60-min wait. Perfect for business travel.',
      estimatedCost: 'From SGD 65 to central Singapore',
      url: 'https://www.blacklane.com/en/',
    },
    {
      name: 'Grab Premier / Executive',
      tagline: 'Premium Grab tier — larger vehicles',
      description: 'In the Grab app, select GrabCar Premium or Executive for a higher-tier vehicle. Better for groups or when you want extra comfort.',
      estimatedCost: 'SGD 35–55 to city centre',
      url: 'https://www.grab.com/sg/download/',
    },
  ],
  CDG: [
    {
      name: 'Blacklane',
      tagline: 'Fixed-price transfers — no Paris surge',
      description: 'Blacklane meets you at CDG arrivals, helps with luggage, and drives to your Paris address at a fixed price with no Uber-style surge.',
      estimatedCost: 'From €80 to Central Paris',
      url: 'https://www.blacklane.com/en/',
    },
  ],
  AMS: [
    {
      name: 'Blacklane',
      tagline: 'Professional chauffeur from Schiphol',
      description: 'Meet & greet at Schiphol arrivals, fixed pricing to any Amsterdam address. Great for late arrivals when trains have stopped.',
      estimatedCost: 'From €65 to Amsterdam city centre',
      url: 'https://www.blacklane.com/en/',
    },
  ],
  NRT: [
    {
      name: 'Blacklane',
      tagline: 'Fixed-price luxury from Narita — much better than a taxi',
      description: 'Taxis from NRT to central Tokyo cost ¥20,000+. Blacklane offers a premium alternative at a known fixed price with English-speaking drivers.',
      estimatedCost: 'From ¥22,000 to central Tokyo',
      url: 'https://www.blacklane.com/en/',
    },
  ],
  DOH: [
    {
      name: 'Blacklane',
      tagline: 'Premium chauffeur at Hamad International',
      description: 'Blacklane operates from Hamad Airport — meet & greet, fixed pricing, luxury vehicles. Popular with business travellers to Qatar.',
      estimatedCost: 'From QAR 180 to West Bay / Downtown',
      url: 'https://www.blacklane.com/en/',
    },
  ],
};

// ── Visa / Entry requirement notices ──────────────────────────────────────────

export interface VisaNotice {
  title: string;
  requirement: string;
  description: string;
  applyUrl: string;
  urgency: 'required' | 'check';
  deadline?: string;
}

const USA_ESTA: VisaNotice = {
  title: '🇺🇸 USA Entry — ESTA Required',
  requirement: 'ESTA (Electronic System for Travel Authorization) — $21 · takes 5 min',
  description: 'Citizens of 42 Visa Waiver Program countries (UK, EU, Australia, Japan, S. Korea, etc.) need an approved ESTA before boarding a US-bound flight. Your airline may deny boarding without it. Apply well in advance.',
  applyUrl: 'https://esta.cbp.dhs.gov/',
  urgency: 'required',
  deadline: 'Apply at least 72 hours before departure — sooner is better, as some applications require additional review',
};

const AUSTRALIA_ETA: VisaNotice = {
  title: '🇦🇺 Australia Entry — ETA or eVisitor',
  requirement: 'ETA (app: AUS$20) or eVisitor (free, EU/UK only) — online application',
  description: 'UK, EU, US, Canadian, Japanese, and many other passport holders need an ETA or eVisitor before travelling to Australia. Apply via the official AUS ETA app or immi.homeaffairs.gov.au.',
  applyUrl: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601',
  urgency: 'required',
  deadline: 'Apply before booking your flights — ETA is usually instant but allow 24 hours',
};

const CANADA_ETA: VisaNotice = {
  title: '🇨🇦 Canada Entry — eTA Required',
  requirement: 'eTA (Electronic Travel Authorization) — CAD$7 · usually instant',
  description: 'Citizens of 50+ countries (UK, EU, Australia, Japan etc.) need an approved eTA to fly to Canada. US citizens are exempt. Apply on the official IRCC website.',
  applyUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html',
  urgency: 'required',
  deadline: 'Apply before booking your flight — usually approved within minutes, but can take several days',
};

const INDIA_EVISA: VisaNotice = {
  title: '🇮🇳 India Entry — e-Visa Available',
  requirement: 'Indian e-Visa — $25–80 depending on type · apply online',
  description: 'Citizens of 166 countries can apply for an Indian e-Visa online (tourist, business, or medical). e-Visa holders arrive at designated e-Visa airports including DEL, BOM, MAA, BLR, CCU.',
  applyUrl: 'https://indianvisaonline.gov.in/',
  urgency: 'required',
  deadline: 'Apply at least 4 days before travel — approval can take 72 hours. Apply 2+ weeks in advance to be safe',
};

const KENYA_EVISA: VisaNotice = {
  title: '🇰🇪 Kenya Entry — eVisa Required',
  requirement: 'Kenya eTA / eVisa — $32 tourist · apply online',
  description: 'All visitors to Kenya now require a pre-approved eTA (Electronic Travel Authorization) obtained online. The old visa-on-arrival has been replaced by the eTA system.',
  applyUrl: 'https://etakenya.go.ke/',
  urgency: 'required',
  deadline: 'Apply before you travel — approval takes 1–3 business days',
};

const CHINA_VISA: VisaNotice = {
  title: '🇨🇳 China Entry — Visa Usually Required',
  requirement: 'Chinese Tourist Visa (L-Visa) or transit visa — apply via embassy',
  description: 'Most nationalities require a valid Chinese visa to enter mainland China. A few countries have visa-free or visa-on-arrival access. Check the Chinese embassy in your country for the latest rules and apply 4–6 weeks before travel.',
  applyUrl: 'https://www.visaforchina.cn/',
  urgency: 'check',
  deadline: 'Visa processing takes 4–7 business days (express available). Apply at least 3 weeks before departure',
};

const SRI_LANKA_ETA: VisaNotice = {
  title: '🇱🇰 Sri Lanka — ETA Required',
  requirement: 'Sri Lanka ETA — $35 tourist single entry · instant approval',
  description: 'Visitors to Sri Lanka need an Electronic Travel Authorization (ETA) before arrival. Apply online — approval is usually instant.',
  applyUrl: 'https://www.eta.gov.lk/',
  urgency: 'required',
  deadline: 'Apply before you fly — takes 5 minutes online',
};

// US airports covered by ESTA notice (most travelers will need it)
const US_AIRPORTS = new Set([
  'LAX','JFK','MIA','DFW','ORD','ATL','DEN','CLT','SFO','SEA','BOS',
  'IAH','PHX','LAS','MCO','EWR','SAN','PDX','DTW','MSP','PHL','BWI',
  'DCA','IAD','RDU','TPA','STL','BNA','MCI','SMF','OAK','SJC','HNL',
]);

// Australia airports
const AU_AIRPORTS = new Set(['SYD','MEL','BNE','PER','ADL','CNS','OOL','CBR','HBA','DRW']);

// Canada airports
const CA_AIRPORTS = new Set(['YYZ','YVR','YUL','YYC','YEG','YOW','YHZ','YWG']);

// India airports
const IN_AIRPORTS = new Set(['DEL','BOM','MAA','BLR','CCU','HYD','COK','AMD','PNQ','GOI','JAI','IXC','VNS']);

export function getVisaNotice(airportCode: string): VisaNotice | null {
  const code = airportCode.toUpperCase();
  if (US_AIRPORTS.has(code)) return USA_ESTA;
  if (AU_AIRPORTS.has(code)) return AUSTRALIA_ETA;
  if (CA_AIRPORTS.has(code)) return CANADA_ETA;
  if (IN_AIRPORTS.has(code)) return INDIA_EVISA;
  const special: Record<string, VisaNotice> = {
    NBO: KENYA_EVISA, MBA: KENYA_EVISA,
    PEK: CHINA_VISA, PVG: CHINA_VISA, SHA: CHINA_VISA, CAN: CHINA_VISA,
    SZX: CHINA_VISA, CTU: CHINA_VISA, XIY: CHINA_VISA,
    CMB: SRI_LANKA_ETA,
  };
  return special[code] ?? null;
}
