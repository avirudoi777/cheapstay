// Real credit-card affiliate data — shared between FlightResults.tsx (booking flow)
// and fly-to country guide pages. Extracted 2026-07-22 so both can import it
// instead of duplicating the card database.

export interface CardOffer {
  name: string;
  issuer: string;
  icon: string;         // emoji fallback
  cardArt?: string;     // path under /cards/ for real card image
  // CSS gradient card art fallback (used when no cardArt image)
  cardGradient?: string;
  cardTextColor?: string;
  headline: string;
  bonus: string;
  url: string;
  highlight?: string;
}

export const CARD_DB: Record<string, CardOffer> = {
  chase_sapphire_preferred: {
    name: 'Chase Sapphire Preferred®',
    issuer: 'chase',
    icon: '💎',
    cardArt: '/cards/chase-sapphire.png',
    headline: 'Earn 3x points on travel · transfer to 14 airlines 1:1',
    bonus: '60,000 bonus points after $4k spend in 3 months',
    url: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
    highlight: 'Best overall',
  },
  chase_sapphire_reserve: {
    name: 'Chase Sapphire Reserve®',
    issuer: 'chase',
    icon: '🖤',
    cardGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    cardTextColor: '#C4A84F',
    headline: 'Earn 3x on travel + $300 travel credit · Priority Pass lounge',
    bonus: '60,000 bonus points after $4k spend in 3 months',
    url: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve',
    highlight: 'Premium',
  },
  united_explorer: {
    name: 'United℠ Explorer Card',
    issuer: 'chase',
    icon: '✈️',
    cardGradient: 'linear-gradient(135deg, #003087 0%, #0052a3 60%, #1a6fc4 100%)',
    cardTextColor: '#ffffff',
    headline: 'Earn 2x miles on United · free first checked bag',
    bonus: '60,000 bonus miles after $3k spend',
    url: 'https://creditcards.chase.com/travel-credit-cards/united/explorer',
    highlight: 'United flyers',
  },
  united_club_infinite: {
    name: 'United Club℠ Infinite Card',
    issuer: 'chase',
    icon: '🛋️',
    cardGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #003087 100%)',
    cardTextColor: '#C4A84F',
    headline: '4x miles on United + United Club lounge membership',
    bonus: '80,000 bonus miles after $5k spend',
    url: 'https://creditcards.chase.com/travel-credit-cards/united/club-infinite',
    highlight: 'United premium',
  },
  amex_platinum: {
    name: 'The Platinum Card® from Amex',
    issuer: 'amex',
    icon: '⬛',
    cardGradient: 'linear-gradient(135deg, #8e9eab 0%, #b8c6cf 30%, #d4dfe6 60%, #a8b8c3 100%)',
    cardTextColor: '#1a1a1a',
    headline: '5x points on flights · transfer to 20+ airlines · 1,400+ lounges',
    bonus: '80,000 Membership Rewards points after $8k spend',
    url: 'https://www.americanexpress.com/us/credit-cards/card/platinum/',
    highlight: 'Best lounge access',
  },
  amex_gold: {
    name: 'Amex Gold Card®',
    issuer: 'amex',
    icon: '🟡',
    cardArt: '/cards/amex-gold.png',
    headline: '3x points on flights · transfer to Delta, Air France, and more',
    bonus: '60,000 Membership Rewards points after $6k spend',
    url: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
  },
  delta_gold: {
    name: 'Delta SkyMiles® Gold Amex',
    issuer: 'amex',
    icon: '🔵',
    cardGradient: 'linear-gradient(135deg, #003366 0%, #004080 50%, #0059b3 100%)',
    cardTextColor: '#E8B84B',
    headline: '2x miles on Delta purchases · free first checked bag',
    bonus: '40,000 bonus miles after $2k spend',
    url: 'https://www.americanexpress.com/us/credit-cards/card/delta-skymiles-gold-american-express-card/',
    highlight: 'Delta flyers',
  },
  delta_platinum: {
    name: 'Delta SkyMiles® Platinum Amex',
    issuer: 'amex',
    icon: '🔷',
    cardGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #003366 100%)',
    cardTextColor: '#C0C0C0',
    headline: '3x miles on Delta · companion certificate · upgrade priority',
    bonus: '50,000 bonus miles after $3k spend',
    url: 'https://www.americanexpress.com/us/credit-cards/card/delta-skymiles-platinum-american-express-card/',
    highlight: 'Delta premium',
  },
  citi_aadvantage: {
    name: 'Citi® / AAdvantage® Platinum Select®',
    issuer: 'citi',
    icon: '🔴',
    cardGradient: 'linear-gradient(135deg, #C00 0%, #e00020 50%, #cc0000 100%)',
    cardTextColor: '#ffffff',
    headline: '2x miles on American Airlines · free first checked bag',
    bonus: '50,000 bonus miles after $2.5k spend',
    url: 'https://www.citi.com/credit-cards/citi-aadvantage-platinum-select-credit-card',
    highlight: 'American Airlines',
  },
  barclays_aviator: {
    name: 'AAdvantage® Aviator® Red',
    issuer: 'barclays',
    icon: '🔺',
    cardGradient: 'linear-gradient(135deg, #8B0000 0%, #c0392b 50%, #a93226 100%)',
    cardTextColor: '#ffffff',
    headline: '2x miles on American Airlines · companion certificate',
    bonus: '60,000 bonus miles after first purchase',
    url: 'https://cards.barclaycardus.com/banking/cards/aadvantage-aviator-red-world-elite-mastercard/',
    highlight: 'AA — easy bonus',
  },
  southwest_priority: {
    name: 'Southwest Rapid Rewards® Priority',
    issuer: 'chase',
    icon: '🟧',
    cardGradient: 'linear-gradient(135deg, #304CB2 0%, #1a2d6e 40%, #E31837 100%)',
    cardTextColor: '#ffffff',
    headline: '3x points on Southwest · 7,500 bonus points each anniversary',
    bonus: '50,000 bonus points after $1k spend',
    url: 'https://creditcards.chase.com/travel-credit-cards/southwest-airlines/priority',
    highlight: 'Southwest',
  },
  british_airways: {
    name: 'British Airways Visa Signature®',
    issuer: 'chase',
    icon: '🇬🇧',
    cardGradient: 'linear-gradient(135deg, #002147 0%, #003580 50%, #004aad 100%)',
    cardTextColor: '#ffffff',
    headline: '3x Avios on BA · works on American Airlines + Iberia',
    bonus: '85,000 Avios after $5k spend in 3 months',
    url: 'https://creditcards.chase.com/travel-credit-cards/british-airways',
    highlight: 'Oneworld',
  },
};

// Airline IATA code → card keys to show (first 2 shown by default)
export const AIRLINE_CARDS: Record<string, string[]> = {
  UA: ['united_explorer', 'chase_sapphire_preferred', 'united_club_infinite'],
  DL: ['delta_gold', 'delta_platinum', 'amex_platinum'],
  AA: ['citi_aadvantage', 'barclays_aviator', 'chase_sapphire_preferred'],
  WN: ['southwest_priority', 'chase_sapphire_preferred'],
  B6: ['chase_sapphire_preferred', 'amex_gold'],              // JetBlue
  AS: ['chase_sapphire_preferred', 'amex_platinum'],          // Alaska
  BA: ['british_airways', 'chase_sapphire_preferred'],
  IB: ['british_airways', 'chase_sapphire_preferred'],        // Iberia (Avios)
  QF: ['british_airways', 'amex_platinum'],                   // Qantas
  EK: ['amex_platinum', 'chase_sapphire_preferred'],
  SQ: ['amex_platinum', 'chase_sapphire_preferred'],
  AF: ['amex_gold', 'chase_sapphire_preferred'],
  KL: ['amex_gold', 'chase_sapphire_preferred'],
  LH: ['amex_platinum', 'chase_sapphire_preferred'],
  OS: ['amex_platinum', 'chase_sapphire_preferred'],          // Austrian (LH group)
  LX: ['amex_platinum', 'chase_sapphire_preferred'],          // Swiss (LH group)
  TK: ['amex_gold', 'chase_sapphire_preferred'],
  MH: ['amex_platinum', 'chase_sapphire_preferred'],
  CX: ['amex_platinum', 'chase_sapphire_preferred'],          // Cathay
  NH: ['amex_platinum', 'chase_sapphire_preferred'],          // ANA
  JL: ['amex_platinum', 'chase_sapphire_preferred'],          // JAL
};
export const DEFAULT_CARDS = ['chase_sapphire_preferred', 'amex_gold'];

export function getCardOffers(airlineCodes: string[]): CardOffer[] {
  for (const code of airlineCodes) {
    const keys = AIRLINE_CARDS[code.toUpperCase()];
    if (keys) return keys.slice(0, 2).map(k => CARD_DB[k]).filter(Boolean);
  }
  return DEFAULT_CARDS.map(k => CARD_DB[k]);
}

export const ISSUER_STYLE: Record<string, { bg: string; color: string }> = {
  chase: { bg: '#EFF6FF', color: '#1D4ED8' },
  amex: { bg: '#F0FDF4', color: '#15803D' },
  citi: { bg: '#FFF7ED', color: '#C2410C' },
  barclays: { bg: '#FDF4FF', color: '#7E22CE' },
};
