// Per-app brand metadata, limo services, and visa/entry notices for the booking detail page.

export interface AppMeta {
  bgColor: string;
  borderColor: string;
  accentColor: string;   // tagline text + CTA button color
  tagline: string;
  description: string;
  downloadUrl: string;
  logoUrl: string;       // Clearbit logo CDN — falls back to letter initial on error
}

export const APP_META: Record<string, AppMeta> = {
  'Uber': {
    bgColor: '#0A0A0A',
    borderColor: 'rgba(255,255,255,0.12)',
    accentColor: '#E5E5E5',
    tagline: 'Most popular worldwide',
    description: 'Works in 70+ countries — reliable, traceable rides with upfront pricing. Easy to use internationally.',
    downloadUrl: 'https://r.uber.com/cheapstay',
    logoUrl: 'https://logo.clearbit.com/uber.com',
  },
  'Lyft': {
    bgColor: '#1A0011',
    borderColor: 'rgba(236,0,140,0.50)',
    accentColor: '#F472B6',
    tagline: 'US-only · often 10–20% cheaper',
    description: 'Lyft competes strongly with Uber across the US — frequently 10–20% cheaper on the same route, great loyalty rewards.',
    downloadUrl: 'https://www.lyft.com/invite/cheapstay',
    logoUrl: 'https://logo.clearbit.com/lyft.com',
  },
  'Bolt': {
    bgColor: '#001A08',
    borderColor: 'rgba(52,211,153,0.50)',
    accentColor: '#34D399',
    tagline: '20–30% cheaper than Uber in Europe',
    description: 'The best-value ride-hailing app in Europe — lower prices, lower surges, available in 45+ countries.',
    downloadUrl: 'https://bolt.eu/en/download/',
    logoUrl: 'https://logo.clearbit.com/bolt.eu',
  },
  'Grab': {
    bgColor: '#001508',
    borderColor: 'rgba(0,177,79,0.55)',
    accentColor: '#4ADE80',
    tagline: 'The super-app of Southeast Asia',
    description: 'Rides, food, deliveries, and payments — Grab is essential across SE Asia. Set up your account before landing to avoid queues.',
    downloadUrl: 'https://www.grab.com/sg/download/',
    logoUrl: 'https://logo.clearbit.com/grab.com',
  },
  'DiDi': {
    bgColor: '#180800',
    borderColor: 'rgba(255,107,0,0.55)',
    accentColor: '#FB923C',
    tagline: "China's dominant ride app — download first",
    description: 'DiDi is the only reliable ride-hailing option in mainland China. Register your account before arriving — harder to set up inside China.',
    downloadUrl: 'https://web.didiglobal.com/',
    logoUrl: 'https://logo.clearbit.com/didiglobal.com',
  },
  'DiDi Japan': {
    bgColor: '#180800',
    borderColor: 'rgba(255,107,0,0.55)',
    accentColor: '#FB923C',
    tagline: 'Budget alternative to taxis in Japan',
    description: 'DiDi operates in major Japanese cities. Often cheaper than traditional metered taxis, especially for late-night rides when trains stop.',
    downloadUrl: 'https://web.didiglobal.com/jp/',
    logoUrl: 'https://logo.clearbit.com/didiglobal.com',
  },
  'Gojek': {
    bgColor: '#001500',
    borderColor: 'rgba(0,136,10,0.55)',
    accentColor: '#4ADE80',
    tagline: "Indonesia's super-app",
    description: 'Essential in Indonesia — GoCar for 4-wheel rides, GoRide for motorcycles. Also food, delivery, and payments.',
    downloadUrl: 'https://www.gojek.com/',
    logoUrl: 'https://logo.clearbit.com/gojek.com',
  },
  'Careem': {
    bgColor: '#001209',
    borderColor: 'rgba(2,115,74,0.55)',
    accentColor: '#34D399',
    tagline: 'Gulf & Middle East leader',
    description: 'Careem (owned by Uber) dominates the Gulf region. Careem BLACK offers premium vehicles with fixed pricing — no surprises.',
    downloadUrl: 'https://www.careem.com/',
    logoUrl: 'https://logo.clearbit.com/careem.com',
  },
  '99': {
    bgColor: '#1A1500',
    borderColor: 'rgba(255,204,0,0.55)',
    accentColor: '#FBBF24',
    tagline: "Brazil's best Uber alternative",
    description: '99 (owned by DiDi) is the main Uber rival in Brazil — competitive pricing, especially in São Paulo and Rio.',
    downloadUrl: 'https://99app.com/',
    logoUrl: 'https://logo.clearbit.com/99app.com',
  },
  'InDriver': {
    bgColor: '#0F0F0F',
    borderColor: 'rgba(255,255,255,0.14)',
    accentColor: '#D1D5DB',
    tagline: 'Name your price — drivers bid for your ride',
    description: 'inDriver is unique: you set the price, drivers bid. Often 20–40% cheaper than fixed-rate apps in Latin America and Central Asia.',
    downloadUrl: 'https://indriver.com/',
    logoUrl: 'https://logo.clearbit.com/indriver.com',
  },
  'inDriver': {
    bgColor: '#0F0F0F',
    borderColor: 'rgba(255,255,255,0.14)',
    accentColor: '#D1D5DB',
    tagline: 'Name your price — drivers bid for your ride',
    description: 'inDriver is unique: you set the price, drivers bid. Often 20–40% cheaper than fixed-rate apps across Latin America and Southeast Asia.',
    downloadUrl: 'https://indriver.com/',
    logoUrl: 'https://logo.clearbit.com/indriver.com',
  },
  'Cabify': {
    bgColor: '#0D0619',
    borderColor: 'rgba(124,58,237,0.55)',
    accentColor: '#A78BFA',
    tagline: 'Premium rides · no surge pricing',
    description: 'Cabify focuses on quality — professional drivers, fixed prices, no surge. Popular in Spain, Mexico, and major South American cities.',
    downloadUrl: 'https://cabify.com/en',
    logoUrl: 'https://logo.clearbit.com/cabify.com',
  },
  'Kakao T': {
    bgColor: '#1A1500',
    borderColor: 'rgba(254,229,0,0.60)',
    accentColor: '#FDE047',
    tagline: "Korea's #1 taxi app — essential download",
    description: 'Kakao T powers almost all taxis in South Korea. Download before landing — faster to get a cab than waiting at the rank.',
    downloadUrl: 'https://www.kakaomobility.com/',
    logoUrl: 'https://logo.clearbit.com/kakaomobility.com',
  },
  'LINE Taxi': {
    bgColor: '#001500',
    borderColor: 'rgba(0,195,0,0.55)',
    accentColor: '#4ADE80',
    tagline: 'Integrated with LINE app in Taiwan & Japan',
    description: 'LINE Taxi is integrated with the LINE messaging app used widely in Taiwan and Japan. Simple if you already use LINE.',
    downloadUrl: 'https://taxi.line.me/',
    logoUrl: 'https://logo.clearbit.com/line.me',
  },
  'TADA': {
    bgColor: '#05101F',
    borderColor: 'rgba(59,130,246,0.55)',
    accentColor: '#60A5FA',
    tagline: 'Zero commission · no surge in Singapore',
    description: 'TADA charges zero commission from drivers, making fares consistently lower than Grab with no surge during peak hours.',
    downloadUrl: 'https://tada.global/',
    logoUrl: 'https://logo.clearbit.com/tada.global',
  },
  'HKTaxi': {
    bgColor: '#1A0505',
    borderColor: 'rgba(220,38,38,0.50)',
    accentColor: '#F87171',
    tagline: 'Book metered Hong Kong taxis',
    description: 'HKTaxi lets you book the official metered taxis via app — no haggling. Red taxis cover urban HK Island and Kowloon.',
    downloadUrl: 'https://www.hktaxi.hk/',
    logoUrl: 'https://logo.clearbit.com/hktaxi.hk',
  },
  'Be': {
    bgColor: '#1A0505',
    borderColor: 'rgba(229,57,53,0.55)',
    accentColor: '#F87171',
    tagline: 'Often cheaper than Grab in Vietnam',
    description: 'Be (formerly Gojek Vietnam) frequently undercuts Grab on price. BeCar for 4-wheel rides, BeBike for scooter trips.',
    downloadUrl: 'https://be.com.vn/',
    logoUrl: 'https://logo.clearbit.com/be.com.vn',
  },
  'AirAsia Ride': {
    bgColor: '#1A0000',
    borderColor: 'rgba(220,38,38,0.50)',
    accentColor: '#F87171',
    tagline: 'Budget airport rides in Malaysia',
    description: 'AirAsia Ride is built into the AirAsia super-app — a budget-friendly option for KL airport rides with competitive flat rates.',
    downloadUrl: 'https://www.airasia.com/ride',
    logoUrl: 'https://logo.clearbit.com/airasia.com',
  },
  'BiTaksi': {
    bgColor: '#1A1300',
    borderColor: 'rgba(255,215,0,0.55)',
    accentColor: '#FDE047',
    tagline: "Istanbul's official metered taxi app",
    description: "BiTaksi is Istanbul's most reliable taxi app — works with metered official taxis, so pricing is regulated. More consistent than Uber in Turkey.",
    downloadUrl: 'https://www.bitaksi.com/',
    logoUrl: 'https://logo.clearbit.com/bitaksi.com',
  },
  'FreeNow': {
    bgColor: '#0A0A0A',
    borderColor: 'rgba(255,255,255,0.16)',
    accentColor: '#D1D5DB',
    tagline: 'Licensed taxis · no surge in Germany',
    description: 'FreeNow (formerly mytaxi) dispatches licensed taxis in Germany and western Europe. Regulated fares — no surge pricing on busy nights.',
    downloadUrl: 'https://free-now.com/',
    logoUrl: 'https://logo.clearbit.com/free-now.com',
  },
  'Heetch': {
    bgColor: '#0D0619',
    borderColor: 'rgba(124,58,237,0.55)',
    accentColor: '#A78BFA',
    tagline: 'Paris late-night alternative to Uber',
    description: 'Heetch specialises in affordable Paris night rides — especially good when Uber surges during events or weekend nights.',
    downloadUrl: 'https://www.heetch.com/',
    logoUrl: 'https://logo.clearbit.com/heetch.com',
  },
  'PedidosYa': {
    bgColor: '#1A0000',
    borderColor: 'rgba(252,66,66,0.50)',
    accentColor: '#F87171',
    tagline: 'Rides & delivery in Paraguay / Uruguay',
    description: 'PedidosYa is primarily a food delivery app that also offers ride-hailing in Paraguay and Uruguay. Very affordable local pricing.',
    downloadUrl: 'https://www.pedidosya.com/',
    logoUrl: 'https://logo.clearbit.com/pedidosya.com',
  },
};

export function getAppMeta(appName: string): AppMeta {
  return APP_META[appName] ?? {
    bgColor: '#0F0F0F',
    borderColor: 'rgba(255,255,255,0.14)',
    accentColor: '#D1D5DB',
    tagline: 'Ride-hailing app',
    description: 'Download and set up your account before landing for the fastest pickup at the airport.',
    downloadUrl: `https://www.google.com/search?q=${encodeURIComponent(appName + ' app download')}`,
    logoUrl: '',
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
