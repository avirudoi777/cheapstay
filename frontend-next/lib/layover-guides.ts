export interface LayoverGuide {
  airport: string;
  city: string;
  flag: string;
  tips: { icon: string; title: string; desc: string }[];
  lounges?: string;
  transitVisa?: string;
  cityImage?: string; // Unsplash photo ID
}

const GUIDES: Record<string, LayoverGuide> = {
  MIA: {
    airport: 'Miami International Airport',
    city: 'Miami',
    flag: '🇺🇸',
    lounges: 'The Club at MIA (pay ~$45, T2/D); American Airlines Admirals Club (AA members/first class)',
    tips: [
      { icon: '🌊', title: 'Wynwood or beach?', desc: 'Wynwood street art murals are 20 min by Uber. South Beach is 30 min.' },
      { icon: '🍖', title: 'Cuban food airside', desc: 'Versailles Cuban Café in T2 (post-security) — ropa vieja and cortadito worth the stop.' },
      { icon: '🚌', title: 'To downtown quick', desc: 'MIA Mover train (free) to Rental Car Center, then Miami-Dade transit bus.' },
    ],
  },
  DFW: {
    airport: 'Dallas/Fort Worth International Airport',
    city: 'Dallas',
    flag: '🇺🇸',
    lounges: 'American Airlines Admirals Club (AA members/first class); The Club at DFW T2 (pay ~$45)',
    tips: [
      { icon: '🤠', title: 'World\'s 2nd busiest', desc: 'DFW is massive — allow 30+ min between gates in different terminals. Skylink train is fast.' },
      { icon: '🥩', title: 'Texas BBQ', desc: 'Cousin\'s Bar-B-Q in T3 and T4. Get the brisket. It\'s legitimately good airport food.' },
      { icon: '🚶', title: 'Skylink is free', desc: 'The automated train runs 24h between all terminals. Fast and reliable.' },
    ],
  },
  JFK: {
    airport: 'John F. Kennedy International Airport',
    city: 'New York',
    flag: '🇺🇸',
    cityImage: 'photo-1496442226666-8d4d0e62e6e9',
    lounges: 'The Centurion Lounge T4 (Amex Platinum/pay ~$50); Delta Sky Club T4 (Delta card/SkyMiles); TWA Hotel rooftop (non-lounge, pay)',
    tips: [
      { icon: '🗽', title: 'NYC in 60 min', desc: 'AirTrain to Jamaica, then LIRR or subway to Manhattan — ~$12 total. Uber is $60–90.' },
      { icon: '🕐', title: 'Terminal gaps are real', desc: 'Different terminals require going through security again. Budget extra time.' },
      { icon: '🍕', title: 'NYC pizza pre-flight', desc: 'T4 has Shake Shack and Whitmans — solid compared to most airports.' },
    ],
  },
  LAX: {
    airport: 'Los Angeles International Airport',
    city: 'Los Angeles',
    flag: '🇺🇸',
    lounges: 'The Centurion Lounge T4 (Amex Platinum/pay); Star Alliance Business Lounge T2 (Star Alliance Business+)',
    tips: [
      { icon: '🚗', title: 'Traffic is brutal', desc: 'Add 30–60 min buffer to any airport transfer. Fly by app (FlyAway) is the most reliable.' },
      { icon: '🌴', title: 'Tom Bradley is nicest', desc: 'TBIT (international terminal) is the most modern and has the best food options.' },
      { icon: '🍣', title: 'Sugarfish airside', desc: 'Sugarfish in TBIT — legit sushi before a long-haul.' },
    ],
  },
  GIG: {
    airport: 'Rio de Janeiro–Galeão International Airport',
    city: 'Rio de Janeiro',
    flag: '🇧🇷',
    cityImage: 'photo-1483729558449-99ef09a8c325',
    lounges: 'Gol Smiles Lounge T1 (Gol members/pay ~$30); VIP Lounge T2 (pay ~$30, includes buffet)',
    tips: [
      { icon: '🏖️', title: 'Copacabana is 45 min', desc: 'Taxi or app (99/Uber) to Zona Sul is R$80–120. BRT bus from airport is cheap but slow.' },
      { icon: '🔒', title: 'Safety first', desc: 'Use ride-apps, not unmarked taxis. Don\'t display phones or cameras on arrival plaza.' },
      { icon: '🥤', title: 'Coconut water airside', desc: 'Fresh coconut at the kiosks in T2 is genuinely good and cheaper than coffee.' },
    ],
  },
  GRU: {
    airport: 'São Paulo/Guarulhos International Airport',
    city: 'São Paulo',
    flag: '🇧🇷',
    lounges: 'LATAM VIP Lounge T2 (LATAM Business+); GRU Airport VIP Lounge (pay ~$40); Smiles Lounge (pay)',
    tips: [
      { icon: '🏙️', title: 'São Paulo is 1h away', desc: 'CON shuttle or Uber (~R$100–140) to Paulista. Allow 1.5h in rush hour.' },
      { icon: '☕', title: 'Best coffee in South America', desc: 'Brazil is the world\'s largest coffee producer — the espresso in T3 kiosks is exceptional.' },
    ],
  },
  BOG: {
    airport: 'El Dorado International Airport',
    city: 'Bogotá',
    flag: '🇨🇴',
    lounges: 'Copa Airlines Business Lounge (Copa First/Business); El Dorado VIP Lounge (pay ~$35); Avianca VIP Lounge (Avianca LifeMiles Elite)',
    tips: [
      { icon: '☕', title: 'World\'s best coffee here', desc: 'Colombia is the home of single-origin specialty coffee. Get a tinto before your flight — it\'s exceptional.' },
      { icon: '🌆', title: 'Bogotá at 2,600m altitude', desc: 'The city sits at high altitude — drink water, skip alcohol your first day.' },
      { icon: '🚕', title: 'InDriver or Cabify', desc: 'Use ride apps. Official taxis from the booth are safe, avoid unmarked vehicles.' },
    ],
  },
  MEX: {
    airport: 'Mexico City International Airport',
    city: 'Mexico City',
    flag: '🇲🇽',
    lounges: 'Aeromexico Salon Premier (Aeromexico Platinum/Business); TACA VIP Lounge (pay ~$30)',
    tips: [
      { icon: '🌮', title: 'Best tacos of your life', desc: 'Tacos de canasta in the departure hall. Sound questionable, taste unreal.' },
      { icon: '🚇', title: 'Metro is $0.25', desc: 'Terminal 1 has a metro station — cheapest ride into the city (35 min to Zócalo).' },
    ],
  },
  LIM: {
    airport: 'Jorge Chávez International Airport',
    city: 'Lima',
    flag: '🇵🇪',
    lounges: 'LATAM VIP Lounge (LATAM Business); VIP Lounge LIM (pay ~$35, airside)',
    tips: [
      { icon: '🍽️', title: 'Astrid y Gastón nearby', desc: 'Lima is the fine-dining capital of Latin America. Even airport food options are surprisingly good.' },
      { icon: '🌫️', title: 'Lima is grey', desc: 'The city is covered in fog (garúa) June–November. Don\'t judge by the sky — it\'s one of South America\'s best cities.' },
    ],
  },
  SCL: {
    airport: 'Arturo Merino Benítez International Airport',
    city: 'Santiago',
    flag: '🇨🇱',
    lounges: 'Sala VIP Sky (Sky Airline members); LATAM Lounge (LATAM Business/Elite); Sala VIP Lan Chile (pay ~$35)',
    tips: [
      { icon: '🏔️', title: 'Andes views from the plane', desc: 'Window seat on right side landing from north — Aconcagua (7000m) is stunning on clear days.' },
      { icon: '🍷', title: 'Chilean wine in the lounge', desc: 'SCL lounges stock decent Carménère and Malbec — take advantage before a long haul.' },
    ],
  },
  BKK: {
    airport: 'Suvarnabhumi Airport',
    city: 'Bangkok',
    flag: '🇹🇭',
    cityImage: 'photo-1528360983277-13d401cdc186',
    lounges: 'Coral Executive Lounge (airside, pay at door ~$35)',
    transitVisa: 'Transit visa-free up to 24h for most passports',
    tips: [
      { icon: '🍜', title: 'Food hall (Level 3–4)', desc: 'Huge food court with full Thai meals from $3. Open 24h. Try the boat noodles or pad see ew.' },
      { icon: '💆', title: 'Massage (Level 4)', desc: 'Thai massage shops airside — foot massage from $15/hr. Perfect for a long wait.' },
      { icon: '🏙️', title: 'Slip into Bangkok (4h+)', desc: 'BTS/taxi 30 min to city. Grab a quick street food meal on Sukhumvit. Come back well before boarding.' },
      { icon: '🛍️', title: 'King Power duty-free', desc: 'Large duty-free complex. Thai snacks, cosmetics, watches. Open 24h.' },
      { icon: '🛏️', title: 'Sleep pods (Novotel)', desc: 'Novotel is connected airside. Day-use rooms available by the hour for naps.' },
    ],
  },
  DMK: {
    airport: 'Don Mueang Airport',
    city: 'Bangkok',
    flag: '🇹🇭',
    lounges: 'Miracle Lounge (pay ~$28)',
    tips: [
      { icon: '🍜', title: 'Thai food court', desc: 'Cheap and excellent Thai food in the main terminal. Pad thai from $2.' },
      { icon: '🏪', title: '7-Eleven & shops', desc: 'Convenience stores everywhere for snacks, drinks, and travel essentials.' },
      { icon: '🏙️', title: 'Quick Bangkok trip (4h+)', desc: 'Grab a taxi (~$8) or van to Chatuchak market. Only 20 min away.' },
    ],
  },
  DXB: {
    airport: 'Dubai International',
    city: 'Dubai',
    flag: '🇦🇪',
    cityImage: 'photo-1512453979798-5ea266f8880c',
    lounges: 'Marhaba Lounge (pay ~$50); free if flying Emirates Business+',
    transitVisa: 'Free 48h transit visa for most nationalities if connecting via Emirates',
    tips: [
      { icon: '🛍️', title: 'Duty-free mall', desc: 'One of the largest in the world. Perfume, electronics, gold jewellery, alcohol. Open 24h.' },
      { icon: '🍽️', title: 'Eating options', desc: 'Huge food court with global options. Budget: Shake Shack or local wraps ($10–15). Nice: options throughout all terminals.' },
      { icon: '🛏️', title: 'Sleep & shower (G Hotel)', desc: 'G hotel connected airside for naps by the hour. Showers also available.' },
      { icon: '🏙️', title: 'See Dubai (6h+)', desc: 'Uber to Dubai Mall (~30 min, ~$20). Burj Khalifa views, indoor ski slope, aquarium. Worth it for long stops.' },
      { icon: '💱', title: 'Currency exchange', desc: 'Best rates at exchange booths in the terminal — better than airport ATMs.' },
    ],
  },
  SIN: {
    airport: 'Changi Airport',
    city: 'Singapore',
    flag: '🇸🇬',
    cityImage: 'photo-1525625293386-3f8f99389edd',
    lounges: 'Ambassador Transit Lounge (24h, pay ~$35, includes food and shower)',
    transitVisa: 'Most passports get free 96h transit without a visa',
    tips: [
      { icon: '🌿', title: 'Jewel Changi (free)', desc: "World's tallest indoor waterfall. Free to enter. Connect via walkway from T1/T2/T3. Grab coffee and watch the waterfall." },
      { icon: '🎬', title: 'Free cinema & entertainment', desc: 'Free 24h movie theater (T3), rooftop pool (T1, fee), butterfly garden (T3). Ranked #1 airport for a reason.' },
      { icon: '🍜', title: 'Food court', desc: 'All terminals have hawker-style food courts with local food from $5. Try chicken rice or laksa.' },
      { icon: '😴', title: 'Free nap zones', desc: 'Dedicated rest areas with reclining chairs in all terminals. Dark, quiet, and free.' },
      { icon: '🏙️', title: 'See Singapore (6h+)', desc: 'MRT from airport is $2. Gardens by the Bay, Marina Bay Sands supertrees, free light show at 8pm.' },
    ],
  },
  DOH: {
    airport: 'Hamad International Airport',
    city: 'Doha',
    flag: '🇶🇦',
    lounges: 'Al Mourjan Business Lounge (pay ~$60); one of the best in the world',
    transitVisa: 'Free transit visa for most nationalities connecting via Qatar Airways',
    tips: [
      { icon: '🐻', title: 'Lamp Bear sculpture', desc: "18-foot Urs Fischer bear in the terminal. Great photo spot — it's become the airport's icon." },
      { icon: '🍽️', title: 'ORYX rotunda', desc: 'Central dining area with global options. All price ranges, open 24h. Qatar cuisine is worth trying.' },
      { icon: '🏊', title: 'Shower & sleep (Oryx Airport Hotel)', desc: 'Airside 5-star hotel — day rooms available. Access to pool for a fee (~$40/3h).' },
      { icon: '🛍️', title: 'Duty-free shopping', desc: 'Luxury brands and local souvenirs. Good prices on perfume, dates, and Arabic sweets.' },
      { icon: '🏙️', title: 'Doha day trip (6h+)', desc: 'Taxi ~20 min to Souq Waqif, the old market. Shisha, food, culture. Returns easy.' },
    ],
  },
  AMS: {
    airport: 'Amsterdam Schiphol',
    city: 'Amsterdam',
    flag: '🇳🇱',
    lounges: 'KLM Crown Lounge (KLM Business/Elite only); Schiphol Airport VIP Lounge (pay)',
    transitVisa: 'Schengen — most nationalities need no visa for short connections',
    tips: [
      { icon: '🎨', title: 'Rijksmuseum annex (free)', desc: 'A small but real Rijksmuseum branch is airside between piers E and F. Free entry, original Dutch masters.' },
      { icon: '🌷', title: 'Flower market', desc: 'Buy tulip bulbs and Dutch flowers to take home — airside, past security.' },
      { icon: '🍺', title: 'Heineken bar (airside)', desc: 'Proper Dutch brown café atmosphere. Try the local beer or jenever (Dutch gin).' },
      { icon: '🏙️', title: 'Amsterdam day trip (4h+)', desc: 'Direct train from Schiphol to Amsterdam Centraal — 17 minutes, $5. Canal walks, Anne Frank House, pancakes.' },
      { icon: '🚲', title: 'Bike rental (4h+)', desc: 'Rent a bike at Centraal station ($15/day) and cycle the canals. Quintessential Amsterdam.' },
    ],
  },
  LHR: {
    airport: 'London Heathrow',
    city: 'London',
    flag: '🇬🇧',
    cityImage: 'photo-1513635269975-59663e0ac1ad',
    lounges: 'No1 Lounge T2/T3 (pay ~$60); Plaza Premium (T2/T3/T4, pay)',
    transitVisa: 'UK Transit Visa required for some nationalities — check before you fly',
    tips: [
      { icon: '🍺', title: 'Gordon Ramsay Plane Food (T5)', desc: 'Celebrity chef restaurant airside at T5. Not cheap but a memorable meal.' },
      { icon: '🛍️', title: 'Harrods departure shop', desc: 'Airside Harrods store for iconic British gifts — shortbread, tea, scarves.' },
      { icon: '🏙️', title: 'London day trip (5h+)', desc: 'Piccadilly line train — 50 min to central London (~$7). Hyde Park, British Museum (free), Covent Garden.' },
      { icon: '🛏️', title: 'Sleep options', desc: 'Yotel is airside at T4 — small pods by the hour for naps. Affordable and clean.' },
      { icon: '💷', title: 'Currency note', desc: 'UK uses GBP, not Euros. Tap-to-pay works everywhere including the tube.' },
    ],
  },
  IST: {
    airport: 'Istanbul Airport',
    city: 'Istanbul',
    flag: '🇹🇷',
    lounges: 'IGA Lounge (pay ~$45, includes unlimited food and drinks)',
    transitVisa: 'Most nationalities can transit visa-free up to 24h',
    tips: [
      { icon: '☕', title: 'Turkish coffee & baklava', desc: 'Excellent Turkish coffee shops throughout. Get a Turkish tea (çay) from $1 and baklava from the dessert shops.' },
      { icon: '🛍️', title: 'Duty-free is massive', desc: 'One of Europe\'s largest duty-free malls. Electronics, clothes, food — prices are genuinely good.' },
      { icon: '🏙️', title: 'Istanbul day trip (5h+)', desc: 'Airport bus to city (~$5, 45 min). Hagia Sophia, Grand Bazaar, Bosphorus views — iconic 2h circuit.' },
      { icon: '💆', title: 'Turkish hammam (airside)', desc: 'Some terminals have actual hammam spa experience. Unique to Istanbul airport.' },
      { icon: '🌙', title: 'Open 24h — night stops fine', desc: 'Full food, shops, and lounges available around the clock. Good airport for red-eye connections.' },
    ],
  },
  FRA: {
    airport: 'Frankfurt Airport',
    city: 'Frankfurt',
    flag: '🇩🇪',
    lounges: 'Lufthansa Business Lounge (pay if non-Lufthansa); several pay lounges',
    tips: [
      { icon: '🍺', title: 'German beer (airside)', desc: 'Proper German beer halls in the terminal. Weizen and pretzels from morning. Very German.' },
      { icon: '🚂', title: 'ICE trains from airport', desc: 'Frankfurt Fernbahnhof is connected — ICE trains to Cologne, Munich, Stuttgart. Great for longer stops.' },
      { icon: '🏙️', title: 'Frankfurt in 3h', desc: 'S-Bahn 10 min to city centre. Römerberg old town, apple wine bars. Clean, easy city to navigate.' },
      { icon: '🛍️', title: 'Passenger Terminal 1 mall', desc: 'Full shopping mall airside — clothes, books, electronics, pharmacies.' },
    ],
  },
  CDG: {
    airport: 'Paris Charles de Gaulle',
    city: 'Paris',
    flag: '🇫🇷',
    cityImage: 'photo-1502602898657-3e91760cbb34',
    lounges: 'Air France Salon (pay for non-AF pax); Club CDG (pay)',
    tips: [
      { icon: '🥐', title: 'Croissant & espresso', desc: 'Multiple proper French café/bakeries airside. Get a proper café crème and croissant. Non-negotiable.' },
      { icon: '🍷', title: 'French wine bar', desc: 'Several wine bars with excellent French regional wines by the glass. $8–12/glass but worth it.' },
      { icon: '🏙️', title: 'Paris (4h+)', desc: 'RER B train — 30 min to city (~$15). Montmartre or Marais neighbourhood are walkable, iconic, and close.' },
      { icon: '😤', title: 'Allow extra time', desc: 'CDG is enormous with confusing terminal layout. T2 connections can take 45+ min. Don\'t cut it tight.' },
    ],
  },
  NRT: {
    airport: 'Tokyo Narita',
    city: 'Tokyo',
    flag: '🇯🇵',
    cityImage: 'photo-1540959733332-eab4deabeeaf',
    lounges: 'IASS Executive Lounge (pay ~$30 with shower)',
    transitVisa: 'Most nationalities can transit without visa for 24–72h',
    tips: [
      { icon: '🍱', title: 'Japanese food court', desc: 'Excellent ramen, sushi, tonkatsu from $8–15. Quality is high even in the airport. Try the tonkotsu ramen.' },
      { icon: '🛁', title: 'Capsule hotel & onsen', desc: '9h Hotel Narita is a 5-min shuttle — capsule rooms with access to proper Japanese hot spring bath.' },
      { icon: '🚅', title: 'Tokyo in 60 min', desc: 'Narita Express to Shinjuku (~$28, 60 min) or cheaper Skyliner. Worth it for 6h+ stops.' },
      { icon: '🛍️', title: 'Japanese convenience store', desc: 'FamilyMart and 7-Eleven in the terminal — onigiri, hot food, drinks at Japanese prices. Amazing value.' },
      { icon: '🎎', title: 'Cultural zone (T2)', desc: 'T2 has a small Japanese garden and art installations. Peaceful area to decompress.' },
    ],
  },
  HKG: {
    airport: 'Hong Kong International',
    city: 'Hong Kong',
    flag: '🇭🇰',
    lounges: 'Plaza Premium Lounge (pay ~$40 with shower and buffet)',
    transitVisa: 'Visa-free transit for most nationalities',
    tips: [
      { icon: '🍜', title: 'Dim sum airside', desc: 'Crystal Jade and other proper HK dim sum restaurants airside. Get the har gow and char siu bao.' },
      { icon: '🏙️', title: 'Hong Kong in 30 min', desc: 'Airport Express to Kowloon — 19 min ($14). Nathan Road, Temple Street night market if arriving evening.' },
      { icon: '🛍️', title: 'SkyPlaza mall', desc: 'Connected mall with 35+ shops. Electronics are sometimes cheaper than downtown.' },
      { icon: '🛁', title: 'Shower facilities', desc: 'Shower facilities available at Plaza Premium — $25 including towel and amenities.' },
    ],
  },
  PTY: {
    airport: 'Tocumen International Airport',
    city: 'Panama City',
    flag: '🇵🇦',
    lounges: 'Copa Airlines VIP Lounge (Copa Gold/Business or pay ~$45); Miraflores Lounge (pay ~$35, walk-in, food included)',
    tips: [
      { icon: '🛋️', title: 'Copa hub — great lounges', desc: 'PTY is Copa\'s main hub. The Copa VIP Lounge (near gate 17) is one of the best value lounges in Latin America — pay access is worth it for long layovers.' },
      { icon: '🌊', title: 'Panama Canal (4h+)', desc: 'Miraflores Locks visitor centre is 30 min by taxi (~$25). Watch ships transit the canal — genuinely stunning engineering.' },
      { icon: '🏙️', title: 'Casco Viejo (4h+)', desc: 'Panama City\'s UNESCO old town is 40 min by taxi (~$30). Colourful colonial buildings, rooftop bars, and incredible Pacific views.' },
      { icon: '💵', title: 'USD everywhere', desc: 'Panama uses the US dollar — no currency exchange needed.' },
    ],
  },
  ASU: {
    airport: 'Silvio Pettirossi International Airport',
    city: 'Asunción',
    flag: '🇵🇾',
    lounges: 'VIP Lounge ASU (pay ~$25, walk-in, includes snacks); GOL Lounge (GOL members)',
    tips: [
      { icon: '💰', title: 'One of South America\'s cheapest cities', desc: 'Asunción is extremely affordable. Everything from food to taxis costs half what you\'d pay in Brazil or Argentina.' },
      { icon: '🏛️', title: 'Centro Histórico (3h+)', desc: 'Taxi ~20 min to the old town (~$10). Palacio de los López and the waterfront Costanera are worth the quick visit.' },
      { icon: '🥩', title: 'Paraguayan beef', desc: 'Paraguay has some of the best beef in South America. A proper churrasco in the airport food hall is cheap and excellent.' },
    ],
  },
  EZE: {
    airport: 'Ministro Pistarini International Airport (Ezeiza)',
    city: 'Buenos Aires',
    flag: '🇦🇷',
    lounges: 'Aerolíneas Argentinas Cóndor Lounge (AR Business/Gold or pay ~$35); VIP Lounge EZE Terminal A (pay ~$30, walk-in, food & drinks included)',
    tips: [
      { icon: '🛋️', title: 'Walk-in lounge — worth every peso', desc: 'The VIP Lounge in Terminal A costs ~$30 walk-in and includes hot food, wine, and showers. Far better than the terminal food courts for a 7h layover.' },
      { icon: '🥩', title: 'Buenos Aires steak (4h+)', desc: 'Palermo or San Telmo are 45 min by taxi (~$20). A proper Argentine asado lunch runs $15–25. One of the best meals you\'ll have at any layover destination.' },
      { icon: '🏙️', title: 'Puerto Madero (3h+)', desc: 'The revamped waterfront is 30 min from EZE. Upscale restaurants, a walking boardwalk, and easy taxi return — the most time-efficient city visit from the airport.' },
      { icon: '💃', title: 'San Telmo tango & market', desc: 'San Telmo market has street tango performances on weekends and great leather shops. Free to watch — an authentic Buenos Aires snapshot in under 2 hours on the ground.' },
      { icon: '💵', title: 'Use your foreign card at the ATM', desc: 'Argentina\'s "blue rate" gives foreign cards significantly better exchange than official rate. Withdraw ARS from the EZE airport ATM for the best legal rate before heading into the city.' },
    ],
  },
};

// Minimum layover minutes to show airport guide
export const LAYOVER_GUIDE_THRESHOLD_MIN = 120; // 2 hours

export function getLayoverGuide(airportCode: string): LayoverGuide | null {
  return GUIDES[airportCode.toUpperCase()] ?? null;
}

export function parseLayoverMinutes(layoverStr: string): number {
  // layoverStr format: "2h 30m" or "5h" or "45m"
  const hMatch = layoverStr.match(/(\d+)h/);
  const mMatch = layoverStr.match(/(\d+)m/);
  const h = hMatch ? parseInt(hMatch[1]) : 0;
  const m = mMatch ? parseInt(mMatch[1]) : 0;
  return h * 60 + m;
}
