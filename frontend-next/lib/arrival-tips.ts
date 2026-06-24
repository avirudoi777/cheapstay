export interface ArrivalTips {
  rideShare: {
    apps: string[];   // e.g. ['Uber', 'Grab']
    pickupNote: string;
    estimatedCost: string;
  };
  transit?: {
    name: string;
    cost: string;
    time: string;
    note?: string;
  };
  cityIntro: string;
  watchOut?: string;
  sim?: string;
}

const TIPS: Record<string, ArrivalTips> = {
  // ── United States ──────────────────────────────────────────────────────────
  LAX: {
    rideShare: {
      apps: ['Uber', 'Lyft'],
      pickupNote: 'Pickups moved to the LAX-it lot — take the free shuttle from your terminal, then request the ride.',
      estimatedCost: '$25–40 to Hollywood · $35–55 to Downtown · $45–65 to Santa Monica',
    },
    transit: {
      name: 'Metro C Line (Green)',
      cost: '$1.75',
      time: '45 min to Downtown',
      note: 'Take the free LAX shuttle to Aviation/LAX station, then board the Metro.',
    },
    cityIntro: 'LA sprawls across 500 sq miles — plan your neighbourhoods in advance. Hollywood, Venice Beach, and Santa Monica are must-visits. Traffic is brutal 7–10am and 4–8pm.',
    watchOut: 'Avoid black-car touts in arrivals — use the app.',
    sim: 'T-Mobile/AT&T stores in the arrivals hall, or grab a prepaid at any CVS.',
  },
  JFK: {
    rideShare: {
      apps: ['Uber', 'Lyft'],
      pickupNote: 'Rideshare pickups are on the departures level — follow signs to ride-app pickup zone.',
      estimatedCost: '$60–90 to Midtown Manhattan',
    },
    transit: {
      name: 'AirTrain + LIRR/Subway',
      cost: '$12–15 total',
      time: '55–75 min to Midtown',
      note: 'AirTrain to Jamaica station, then LIRR or A/E subway into the city. Much cheaper than Uber.',
    },
    cityIntro: 'New York is one of the world\'s greatest cities — every neighbourhood is a world of its own. Manhattan, Brooklyn, Queens — each worth exploring. The city never actually sleeps.',
    watchOut: 'Different JFK terminals are separate buildings requiring new security. Add 30+ min for terminal connections.',
    sim: 'T-Mobile kiosk in T4 arrivals, or any Duane Reade nearby.',
  },
  MIA: {
    rideShare: {
      apps: ['Uber', 'Lyft'],
      pickupNote: 'Rideshare pickup on Level 2 (arrivals) near Door 4/5.',
      estimatedCost: '$20–30 to South Beach · $15–20 to Brickell',
    },
    transit: {
      name: 'MIA Mover + Metrorail',
      cost: '$2.25',
      time: '35–50 min to downtown',
      note: 'Free MIA Mover to Rental Car Center, then Metrorail into the city.',
    },
    cityIntro: 'Miami is sun, art deco, Latin culture, and nightlife. South Beach is 25 min away; Wynwood\'s street-art murals are 20 min. The weather is warm and the food is excellent.',
    watchOut: 'Humidity hits hard — dress accordingly.',
    sim: 'T-Mobile/AT&T in the arrivals hall.',
  },
  DFW: {
    rideShare: {
      apps: ['Uber', 'Lyft'],
      pickupNote: 'Rideshare pick-up in the Terminal Link area on the lower level.',
      estimatedCost: '$35–55 to Downtown Dallas · $45–65 to Fort Worth',
    },
    transit: {
      name: 'DART Orange Line',
      cost: '$2.50',
      time: '50 min to Downtown Dallas',
      note: 'Catch the TRE train from DFW to Dallas Union Station or Fort Worth.',
    },
    cityIntro: 'Dallas has a great food scene, world-class museums (free on the first Tuesday of the month), and the famous Sixth Floor Museum. Fort Worth has a more relaxed cowboy vibe.',
    sim: 'AT&T has a major presence here — their retail stores are throughout the Dallas metro.',
  },
  ORD: {
    rideShare: {
      apps: ['Uber', 'Lyft'],
      pickupNote: 'Rideshare at the Multi-Modal Facility (MFF) — take the Airport Transit System (free) from your terminal.',
      estimatedCost: '$35–55 to Downtown Chicago (Loop)',
    },
    transit: {
      name: "Blue Line ('L' Train)",
      cost: '$5',
      time: '45 min to Downtown (Loop)',
      note: 'Fastest during rush hour. Runs 24h. Look for the "L" signs in O\'Hare.',
    },
    cityIntro: 'Chicago has the best architecture in America, world-class deep-dish pizza, and the beautiful Riverwalk along the Chicago River. Millennium Park and the Bean are free.',
    sim: 'T-Mobile and AT&T in the arrivals hall.',
  },
  ATL: {
    rideShare: {
      apps: ['Uber', 'Lyft'],
      pickupNote: 'Rideshare pickup at the Ground Transportation plaza on the lower level.',
      estimatedCost: '$25–40 to Downtown Atlanta',
    },
    transit: {
      name: 'MARTA Train (Red/Gold Line)',
      cost: '$2.50',
      time: '20 min to Downtown',
      note: 'Fastest, cheapest option — stops at Peachtree Center near major hotels.',
    },
    cityIntro: 'Atlanta is the home of Coca-Cola, CNN, and the civil rights movement. The World of Coca-Cola, Georgia Aquarium, and the Martin Luther King Jr. National Historic Site are all within walking distance of each other.',
  },
  DEN: {
    rideShare: {
      apps: ['Uber', 'Lyft'],
      pickupNote: 'Rideshare pickup at the East Island — follow signs from the baggage claim.',
      estimatedCost: '$40–60 to Downtown Denver',
    },
    transit: {
      name: 'University of Colorado A Line',
      cost: '$10.50',
      time: '37 min to Downtown (Union Station)',
      note: 'Comfortable commuter rail — runs every 15 min. Best option for downtown.',
    },
    cityIntro: 'Denver sits at exactly 1 mile elevation. Great craft beer scene, proximity to skiing and Rocky Mountain National Park. In summer, the 16th Street Mall pedestrian zone is lively.',
    watchOut: 'Altitude affects you fast — drink water, go easy on alcohol your first night.',
  },
  CLT: {
    rideShare: {
      apps: ['Uber', 'Lyft'],
      pickupNote: 'Rideshare pickup at the Cell Phone Lot, near the terminal entrances.',
      estimatedCost: '$20–30 to Uptown Charlotte',
    },
    cityIntro: 'Charlotte is an underrated US city with great craft beer, the NASCAR Hall of Fame, and a vibrant Uptown district. The SouthEnd neighbourhood along the light rail is lively.',
  },

  // ── Brazil ────────────────────────────────────────────────────────────────
  GIG: {
    rideShare: {
      apps: ['Uber', '99'],
      pickupNote: 'Request Uber or 99 (by Didi) before leaving the terminal — avoid unmarked taxis.',
      estimatedCost: 'R$80–120 to Copacabana/Ipanema · R$60–90 to Centro',
    },
    transit: {
      name: 'BRT Transcarioca',
      cost: 'R$4',
      time: '60–80 min to Barra da Tijuca or connections',
      note: 'Cheap but slow and not recommended for late arrivals. Good for budget daytime travel.',
    },
    cityIntro: 'Rio is one of the world\'s most beautiful cities — Sugarloaf, Corcovado, and the beaches are iconic. Stay aware in touristy areas and stick to well-lit streets at night.',
    watchOut: 'Don\'t display expensive jewellery, cameras, or phones on the street. Keep your phone in your pocket in public areas.',
    sim: 'Claro and Vivo SIM cards available in the arrivals hall — R$30–50 for a good data package.',
  },
  GRU: {
    rideShare: {
      apps: ['Uber', '99'],
      pickupNote: 'Follow Uber/99 signs to the rideshare zone in the arrivals area. Clear signage.',
      estimatedCost: 'R$100–160 to Paulista Ave · R$120–180 to Vila Olímpia',
    },
    transit: {
      name: 'Expresso Aeroporto Bus',
      cost: 'R$15',
      time: '60–90 min to Congonhas/Paulista',
      note: 'Comfortable air-conditioned bus. Better than the metro for luggage.',
    },
    cityIntro: 'São Paulo is Brazil\'s economic powerhouse — excellent food (best sushi outside Japan, incredible Brazilian BBQ), art museums, and nightlife. The Vila Madalena neighbourhood is the most traveller-friendly.',
    watchOut: 'Traffic is brutal — add 60+ min buffer in rush hour (7–9am, 5–8pm).',
    sim: 'Vivo and Claro in GRU arrivals. Tourist SIM ~R$40 for 15GB.',
  },

  // ── Latin America ──────────────────────────────────────────────────────────
  BOG: {
    rideShare: {
      apps: ['Uber', 'InDriver', 'Cabify'],
      pickupNote: 'Use the apps — official taxis from the booth at arrivals are also safe, just negotiate or insist on a meter.',
      estimatedCost: '$8–15 USD to Zona Rosa/Chapinero · $10–20 to Candelaria',
    },
    transit: {
      name: 'TransMilenio (Bus Rapid Transit)',
      cost: 'COP 3,200 (~$0.80)',
      time: '45–60 min to centre',
      note: 'The airport is connected to the TransMilenio network. Cheap but crowded — watch your belongings.',
    },
    cityIntro: 'Bogotá has transformed dramatically over the last decade. Excellent museums (Gold Museum, Botero Museum — both free), La Candelaria colonial architecture, and some of the best coffee in the world.',
    watchOut: 'Altitude is 2,600m — take it slow your first day. Avoid Bogotá\'s south side as a tourist.',
    sim: 'Claro and Movistar in arrivals. Tourist SIM ~COP 30,000 for good data.',
  },
  MEX: {
    rideShare: {
      apps: ['Uber', 'DiDi', 'Cabify'],
      pickupNote: 'Uber/DiDi pickup from the arrivals area. Avoid unofficial taxis — use only apps or the official taxi booth inside the terminal.',
      estimatedCost: '$10–20 USD to Roma Norte/Condesa · $12–25 to Centro Histórico',
    },
    transit: {
      name: 'Metro (Line 5)',
      cost: 'MXN 5 (~$0.25)',
      time: '35–45 min to Centro',
      note: 'Cheapest option but not great with luggage. Good for light travel.',
    },
    cityIntro: 'Mexico City is one of the world\'s great capitals — extraordinary food (the real tacos are life-changing), incredible museums, colonial architecture, and Aztec ruins in the middle of the city.',
    watchOut: 'Altitude (2,240m) and pollution can affect you. Drink bottled water. Stick to recommended neighbourhoods: Condesa, Roma, Polanco, Coyoacán.',
    sim: 'Telcel is the best coverage. SIM in Terminal 1 arrivals (~MXN 200 for 5GB).',
  },
  LIM: {
    rideShare: {
      apps: ['Uber', 'Cabify', 'InDriver'],
      pickupNote: 'Request rideshare inside the terminal before exiting. Unofficial taxis outside are not recommended.',
      estimatedCost: '$15–25 USD to Miraflores · $20–30 to Barranco',
    },
    cityIntro: 'Lima is the gastronomic capital of Latin America — Central, Maido, and Astrid y Gastón are among the world\'s best restaurants. Miraflores on the Pacific cliffs is beautiful. Crime has dropped significantly in tourist zones.',
    watchOut: 'Lima is foggy and grey June–November (garúa season). Don\'t let the sky fool you — the city is excellent.',
    sim: 'Claro and Movistar in arrivals. ~SOL 30 (~$8) for a tourist SIM with data.',
  },
  SCL: {
    rideShare: {
      apps: ['Uber', 'Cabify'],
      pickupNote: 'Rideshare pickup zone is signed at departures level. Very organised.',
      estimatedCost: '$15–25 USD to Providencia/Las Condes · $20–30 to Santiago Centro',
    },
    transit: {
      name: 'Centropuerto Bus',
      cost: 'CLP 2,400 (~$2.50)',
      time: '45–60 min to Pajaritos Metro station',
      note: 'Transfer to Metro Line 5 at Pajaritos — efficient and cheap for luggage-free travel.',
    },
    cityIntro: 'Santiago is clean, safe, and sophisticated. The Andes provide a dramatic backdrop. Barrio Italia and Lastarria are the hippest neighbourhoods. Day trip to wine country (Maipo Valley) is easy.',
    watchOut: 'Air quality can be poor in winter (June–August) due to smog in the valley.',
    sim: 'Entel (best coverage in Chile). SIM in arrivals ~CLP 15,000 for 10GB.',
  },
  EZE: {
    rideShare: {
      apps: ['Uber', 'Cabify'],
      pickupNote: 'Uber works from EZE. Exit customs, request the ride while inside, then walk to the rideshare zone.',
      estimatedCost: 'ARS 4,000–7,000 to Palermo/Recoleta (~$15–25 at bank rate)',
    },
    transit: {
      name: 'Manuel Tienda León Bus',
      cost: 'ARS 2,800 (~$10)',
      time: '45–60 min to Retiro terminal, Buenos Aires',
      note: 'Most reliable option. Comfortable buses direct to the city centre.',
    },
    cityIntro: 'Buenos Aires is the Paris of South America — incredible steak, tango, architecture, and nightlife. Palermo, San Telmo, and Recoleta are the top neighbourhoods. Dinner starts at 10pm here.',
    watchOut: 'Argentina has complex currency rules — using a foreign card gives you significantly better rates at ATMs than the official exchange. This is legal.',
    sim: 'Claro and Movistar in arrivals. Local SIM is cheap but Argentine data plans are expensive — WhatsApp and Google Maps work over WiFi in most hotels.',
  },
  PTY: {
    rideShare: {
      apps: ['Uber', 'InDriver'],
      pickupNote: 'Request Uber from inside the terminal. There are also official yellow taxis with a fixed price booth at arrivals.',
      estimatedCost: '$25–35 to Casco Viejo/Downtown',
    },
    cityIntro: 'Panama City is a fascinating mix of skyscrapers and colonial history. The Panama Canal is 30 min away. Casco Viejo is a stunning UNESCO colonial district. The dollar as currency makes things simple.',
    sim: 'Cable & Wireless (Mas Movil) in arrivals. ~$15 for a solid tourist SIM.',
  },
  SAL: {
    rideShare: {
      apps: ['Uber'],
      pickupNote: 'Uber is available and reliable from SAL. There\'s also an official taxi dispatch at arrivals.',
      estimatedCost: '$15–20 to San Salvador historic centre',
    },
    cityIntro: 'El Salvador is Central America\'s most compact country — everything is close. Incredible pupusas (stuffed corn tortillas), accessible volcanoes, and a rapidly improving safety situation in tourist areas.',
    sim: 'Tigo and Claro in arrivals. ~$5 for a data SIM.',
  },
  ASU: {
    rideShare: {
      apps: ['Uber', 'PedidosYa'],
      pickupNote: 'Uber works in Asunción. Official taxi dispatch at arrivals is also safe and very affordable.',
      estimatedCost: '~$8–12 to Centro Histórico',
    },
    cityIntro: 'Asunción is one of South America\'s most affordable capitals. The historic centre has colonial charm, and the food (especially beef) is exceptional and cheap. Very relaxed pace.',
    sim: 'Tigo and Personal in the arrivals hall. ~$5–8 for a local SIM.',
  },

  // ── Middle East ───────────────────────────────────────────────────────────
  DXB: {
    rideShare: {
      apps: ['Uber', 'Careem'],
      pickupNote: 'Careem (owned by Uber) or Uber from the rideshare pickup zone at arrivals. Well signed.',
      estimatedCost: 'AED 70–120 ($19–33) to Downtown Dubai · AED 40–60 to Deira',
    },
    transit: {
      name: 'Dubai Metro (Red Line)',
      cost: 'AED 8–12 ($2–3) with Nol card',
      time: '30 min to Downtown/Burj Khalifa',
      note: 'T1 and T3 are connected to the Metro. Fast, air-conditioned, and cheap. Buy a Nol card at the station.',
    },
    cityIntro: 'Dubai is a world of superlatives — the tallest building, the largest mall, indoor skiing in the desert. It\'s a spectacle. Outside the tourist areas, the old spice and gold souks in Deira are the real Dubai.',
    watchOut: 'Alcohol is only served in hotels and licensed venues — not freely available. Dress modestly in public areas.',
    sim: 'Etisalat (e&) tourist SIM at the airport: AED 55 for 5GB — best option.',
  },
  DOH: {
    rideShare: {
      apps: ['Uber', 'Careem'],
      pickupNote: 'Uber/Careem from the Ground Transportation Centre at Hamad Airport.',
      estimatedCost: 'QAR 60–100 ($16–27) to West Bay/Downtown',
    },
    transit: {
      name: 'Qatar Rail / Metro',
      cost: 'QAR 3–6 (~$1)',
      time: '30–40 min to West Bay',
      note: 'Clean, modern metro. Hamad Airport station is in the basement. Red Line to Msheireb for connections.',
    },
    cityIntro: 'Doha is cleaner and quieter than Dubai — a more authentic Gulf experience. The Souq Waqif is incredible for food and atmosphere. The National Museum of Qatar (designed by Jean Nouvel) is stunning.',
    watchOut: 'Qatar summers are extreme (45°C). Stay indoors midday June–September.',
    sim: 'Ooredoo tourist SIM in arrivals: QAR 50 for 5GB.',
  },

  // ── Southeast Asia ─────────────────────────────────────────────────────────
  BKK: {
    rideShare: {
      apps: ['Grab', 'Bolt'],
      pickupNote: 'Use Grab — it\'s the dominant app. Request from inside the terminal before heading to the pickup zone (Level 2, Arrivals).',
      estimatedCost: '฿250–400 ($7–11) to Sukhumvit/Silom · ฿300–500 to Khaosan Road',
    },
    transit: {
      name: 'Airport Rail Link',
      cost: '฿15–45 (~$0.50–1.30)',
      time: '30 min to Phaya Thai station',
      note: 'Cheapest and fastest into the city. Connects to BTS Skytrain at Phaya Thai.',
    },
    cityIntro: 'Bangkok is a city of temples, street food, rooftop bars, and incredible value. Tuk-tuks, street pad thai from ฿50, and some of the best nightlife in Asia. Grand Palace, Wat Pho, Chatuchak Market — all worth it.',
    watchOut: 'Tuk-tuk drivers who offer "cheap tours" usually take you to gem shops or tailors. Stick to Grab/meter taxis.',
    sim: 'AIS or True Move H in arrivals — ฿299 (~$8) for a 30-day unlimited data SIM. One of the best deals in the world.',
  },
  DMK: {
    rideShare: {
      apps: ['Grab', 'Bolt'],
      pickupNote: 'Grab from the designated pickup area outside the terminal. Much cheaper than airport taxis.',
      estimatedCost: '฿150–250 ($4–7) to Mo Chit BTS · ฿250–400 to Sukhumvit',
    },
    transit: {
      name: 'A1 Bus + BTS Skytrain',
      cost: '฿30 bus + ฿50 BTS',
      time: '45–60 min to central Bangkok',
      note: 'A1 bus to Mo Chit BTS station, then Skytrain into the city. Budget-friendly.',
    },
    cityIntro: 'Don Mueang is Bangkok\'s budget airport — mainly domestic and low-cost international. 20 min from the city by Grab. Chatuchak Weekend Market is 10 min away (world\'s largest weekend market).',
    sim: 'AIS and True Move H in the terminal — same great tourist SIM deals as Suvarnabhumi.',
  },
  SIN: {
    rideShare: {
      apps: ['Grab', 'TADA', 'Gojek'],
      pickupNote: 'Grab from the arrival halls — follow the Grab signs (prominently displayed at Changi). Very easy.',
      estimatedCost: 'SGD 20–35 ($15–26) to most of central Singapore',
    },
    transit: {
      name: 'MRT East-West Line',
      cost: 'SGD 1.80–2.30',
      time: '30 min to City Hall / Raffles Place',
      note: 'Take the MRT from Changi Airport station. Buy an EZ-Link card at the station for SGD 10 (SGD 5 deposit + $5 credit).',
    },
    cityIntro: 'Singapore is the world\'s most efficient city — spotlessly clean, remarkably safe, and with extraordinary food. Hawker centres serve world-class meals for $5. Gardens by the Bay light show is free nightly at 8pm.',
    sim: 'Singtel or StarHub tourist SIM in arrivals: SGD 15 for 100GB — exceptional value.',
  },

  // ── Japan ─────────────────────────────────────────────────────────────────
  NRT: {
    rideShare: {
      apps: ['Uber', 'DiDi Japan'],
      pickupNote: 'Japan is taxi-dominant. Uber operates but is limited — official taxis from the taxi rank are metered and reliable.',
      estimatedCost: '¥20,000–25,000 ($130–170) to Tokyo by taxi — trains are far better value',
    },
    transit: {
      name: 'Narita Express (N\'EX)',
      cost: '¥3,070 ($20)',
      time: '60 min to Shinjuku / Tokyo Station',
      note: 'Most comfortable option. Alternatively, Keisei Skyliner to Ueno for ¥2,520 (41 min) — slightly faster to east Tokyo.',
    },
    cityIntro: 'Tokyo is the world\'s greatest city — clean, safe, extraordinarily organised, and full of surprises. Incredible food at every price point, efficient trains, and neighbourhoods each with a completely different character.',
    watchOut: 'Most ATMs in Japan only accept international cards at 7-Eleven and Japan Post Bank ATMs.',
    sim: 'SIM cards at arrivals (Docomo, IIJ, Mobal) — ~¥3,000–5,000 for a tourist SIM with data. Or rent a pocket WiFi.',
  },
  HND: {
    rideShare: {
      apps: ['Uber', 'DiDi Japan'],
      pickupNote: 'Taxis are the standard — metered, always honest. Uber available but less common.',
      estimatedCost: '¥6,000–8,000 ($40–55) to Shinjuku/Shibuya',
    },
    transit: {
      name: 'Tokyo Monorail / Keikyu Line',
      cost: '¥500–700',
      time: '25–35 min to central Tokyo',
      note: 'Tokyo Monorail to Hamamatsucho or Keikyu Line direct to Shinagawa. Both fast and cheap.',
    },
    cityIntro: 'Haneda is much closer to central Tokyo than Narita — big advantage. Shibuya Crossing, Senso-ji Temple in Asakusa, and the fish market breakfast at Tsukiji are all close.',
    sim: 'Same as NRT — SIM cards available in the international arrivals area.',
  },

  // ── Hong Kong ──────────────────────────────────────────────────────────────
  HKG: {
    rideShare: {
      apps: ['Uber', 'HKTaxi'],
      pickupNote: 'Metered taxis are everywhere and honest. Uber available but taxis are often faster at HKG.',
      estimatedCost: 'HKD 300–400 ($38–51) to Kowloon · HKD 350–450 to Central (HK Island)',
    },
    transit: {
      name: 'Airport Express',
      cost: 'HKD 115 ($15)',
      time: '24 min to Kowloon · 24 min to Hong Kong (Central)',
      note: 'Fastest and most comfortable. Free in-town check-in at the HK or Kowloon stations — drop your luggage before exploring.',
    },
    cityIntro: 'Hong Kong is one of Asia\'s most dynamic cities — an extraordinary skyline, world-class dim sum, incredible hiking on Lantau and Dragon\'s Back Trail, and a street food scene unlike anywhere else.',
    sim: 'SIM cards in arrivals hall: ~HKD 48 ($6) for unlimited data. 3HK and SmarTone tourist SIMs are best value.',
  },

  // ── Europe ────────────────────────────────────────────────────────────────
  LHR: {
    rideShare: {
      apps: ['Uber', 'Bolt'],
      pickupNote: 'Rideshare pickup zones are in the terminal car parks. Follow "Private Hire" signs.',
      estimatedCost: '£45–65 to Central London',
    },
    transit: {
      name: 'Elizabeth Line (Crossrail)',
      cost: '£12.80',
      time: '30 min to Paddington/Bond Street',
      note: 'The new Elizabeth Line is fast and direct. Or take the Piccadilly Line for £7 (50 min, stops more).',
    },
    cityIntro: 'London is extraordinary — world-class museums (all free), incredible parks, and neighbourhoods as different as Notting Hill, Shoreditch, and Greenwich. The food scene has transformed over the last decade.',
    watchOut: 'UK uses GBP, not Euros. Contactless card payment works everywhere including the tube.',
    sim: 'EE or Three UK SIM in arrivals: £10–15 for a good tourist SIM with UK and international data.',
  },
  CDG: {
    rideShare: {
      apps: ['Uber', 'Bolt', 'Heetch'],
      pickupNote: 'Rideshare pickup zones are well-signed at CDG. Avoid unlicensed drivers outside.',
      estimatedCost: '€50–70 to Central Paris',
    },
    transit: {
      name: 'RER B Train',
      cost: '€11.80',
      time: '35–45 min to Châtelet–Les Halles (centre)',
      note: 'Most affordable option. Buy tickets at the airport station — don\'t board without validating.',
    },
    cityIntro: 'Paris is genuinely magical. Montmartre at sunrise, the Marais for cafés and galleries, the Seine at golden hour. Walk everywhere — the city is made for it.',
    watchOut: 'CDG is enormous with confusing T2 connections. Allow 45+ min for terminal transfers.',
    sim: 'Orange tourist SIM in arrivals: €30 for 50GB with EU roaming.',
  },
  AMS: {
    rideShare: {
      apps: ['Uber', 'Bolt'],
      pickupNote: 'Rideshare pickup area is near P1 parking. Follow signs in arrivals.',
      estimatedCost: '€35–50 to Amsterdam city centre',
    },
    transit: {
      name: 'Intercity Direct Train',
      cost: '€5.90',
      time: '17 min to Amsterdam Centraal',
      note: 'Fastest and easiest. Direct from Schiphol Station (basement of the airport). Runs every 10–15 min.',
    },
    cityIntro: 'Amsterdam is one of Europe\'s most charming cities — beautiful canal houses, cycling culture, the Rijksmuseum, and Anne Frank House. Rent a bike and you\'ll understand why the Dutch are so happy.',
    sim: 'KPN or T-Mobile Netherlands in arrivals: ~€20 for 10GB.',
  },
  FRA: {
    rideShare: {
      apps: ['Uber', 'Bolt', 'FreeNow'],
      pickupNote: 'Rideshare and taxi pickup from T1 or T2 — follow "Taxi & Ride" signs.',
      estimatedCost: '€35–50 to Frankfurt city centre',
    },
    transit: {
      name: 'S-Bahn (S8/S9)',
      cost: '€5.80',
      time: '15 min to Frankfurt Hauptbahnhof',
      note: 'S8 or S9 is the fastest option. Or take ICE long-distance trains from Fernbahnhof for other German cities.',
    },
    cityIntro: 'Frankfurt is surprisingly interesting — a sleek financial city with an excellent old town (Römerberg), fabulous apple wine bars, and some of the best museums in Germany (all free on Wednesdays).',
    sim: 'Telekom or O2 SIM in T1 and T2: ~€15–20 for 10GB EU roaming.',
  },
  IST: {
    rideShare: {
      apps: ['Uber', 'BiTaksi'],
      pickupNote: 'BiTaksi is the local app — more reliable than Uber for Istanbul. Request from the app before exiting arrivals.',
      estimatedCost: '€15–25 to Sultanahmet/Taksim',
    },
    transit: {
      name: 'Istanbul Airport Metro (M11)',
      cost: '₺100 (~$3)',
      time: '50 min to Gayrettepe for Taksim connection',
      note: 'Modern, direct metro opened in 2023. Runs 6am–midnight. Best for avoiding traffic.',
    },
    cityIntro: 'Istanbul spans two continents and 2,500 years of history. Hagia Sophia, the Grand Bazaar, the Bosphorus ferry, and the best döner of your life — all within a few kilometres of each other.',
    watchOut: 'Turkish lira fluctuates — withdraw TRY from ATMs for the best rate. Most tourist sites accept card but markets prefer cash.',
    sim: 'Turkcell in arrivals: ₺300 for a tourist SIM with good data.',
  },
};

export function getArrivalTips(airportCode: string): ArrivalTips | null {
  return TIPS[airportCode.toUpperCase()] ?? null;
}
