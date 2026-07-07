import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BlogScrollTracker from '@/components/BlogScrollTracker';

const POSTS: Record<string, {
  title: string;
  excerpt: string;
  category: string;
  readTime: number;
  img: string;
  content: string;
}> = {
  'same-hotel-two-prices': {
    title: "I booked the same Bangkok hotel twice — $240 on US IP, $141 on Thai IP. Here's exactly how I did it.",
    excerpt: 'Same hotel, same dates, same room type. The only difference was my IP address.',
    category: 'Booking hack',
    readTime: 8,
    img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&h=600&fit=crop&auto=format',
    content: `
I've been traveling full-time for years and I track every booking obsessively. So when I noticed a price gap between what my US-based friend paid vs what I was seeing from Bangkok, I decided to test it properly.

## The experiment

Same hotel: Avani+ Riverside Bangkok. Same dates: 3 nights in March. Same room: Superior King.

- **US IP (New York VPN):** $240 total
- **Thai IP (Bangkok, no VPN):** $141 total

That's a **41% difference** on the exact same booking.

## Why this happens

Booking platforms use dynamic pricing based on dozens of signals. One of the biggest is your IP address — it tells them your likely purchasing power and local market expectations. Thai users see Thai-market prices. US users see US-market prices.

This isn't illegal. It's the same reason a flight from Bangkok to London costs less when booked in Thailand than when booked in the US.

## How to replicate it

1. **Get a VPN** — NordVPN is what I use. Connect to a Thailand server (Bangkok specifically).
2. **Clear your cookies** — or open an incognito/private window. This prevents the booking site from recognizing your account history.
3. **Search on Agoda or Booking.com** while connected to the Thai server.
4. **Book and pay** — you can use any credit card, no Thai card needed.

That's it. The price you see with a Thai IP is the price you pay.

## Does it work for hotels outside Thailand?

Yes. I've tested it for hotels in Japan, Bali, Vietnam, and even Europe. Thai IP pricing is lower across the board — not just for Thai hotels.

## Does it always work?

Not always. Some hotels have rate parity agreements. Some OTAs are getting better at detecting VPNs. But in my experience, it works roughly 70–80% of the time, and the savings when it does work are significant.

## What VPN I use

I've used NordVPN for 3 years. It's fast, has reliable Thai servers, and hasn't been blocked by Agoda in my experience. [Get NordVPN here](https://go.nordvpn.net/aff_c?offer_id=15&aff_id=151019&url_id=902) — they usually have a deal running.

## Try it yourself

Use CheapStay to compare Agoda and Booking.com prices instantly — it fetches prices server-side from a Bangkok IP so you see Thai-market rates without needing a VPN yourself.

## Planning a trip to Thailand?

Before you book, check our [Thailand entry requirements guide](/fly-to/thailand) — visa rules, vaccine requirements, and Bangkok airport arrival tips in one place.
    `.trim(),
  },
  'three-cards-i-always-travel-with': {
    title: 'The 3 cards I always travel with (and which one I use for each booking)',
    excerpt: "After years of full-time travel, I've narrowed it down to 3 cards.",
    category: 'Credit cards',
    readTime: 5,
    img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&h=600&fit=crop&auto=format',
    content: `
I used to carry five travel cards and obsessively calculate which earned the most on every purchase. Now I carry three and I've stopped thinking about it. Here's the setup.

## Card 1: Chase Sapphire Preferred — my default hotel card

**Why:** 2x points on all travel including hotels. No foreign transaction fees. Points transfer to 14 airline and hotel partners at 1:1 — including Air France, United, Hyatt, and Marriott. 60,000 point sign-up bonus (worth ~$750 in travel).

**When I use it:** Every hotel booking, every flight, every Agoda and Booking.com payment.

**The math:** A $200 hotel stay earns 400 points. Worth ~$5–8 in travel depending on how you redeem. Not exciting on its own, but it stacks over hundreds of nights.

## Card 2: Amex Gold — for food and daily spend abroad

**Why:** 4x at restaurants worldwide (not just the US). 4x at US supermarkets. $120 dining credit per year. The welcome bonus is the biggest I've seen — regularly 60,000–90,000 points.

**When I use it:** Every restaurant, every cafe, every street food stall that takes cards. Also groceries when I'm staying in an apartment.

**The math:** At 4x on a $50 dinner, that's 200 Amex points. Transfer to Air France Flying Blue or Avianca LifeMiles and those points can be worth 2–3 cents each. That $50 dinner earned ~$4–6 in flights.

## Card 3: Capital One Venture — the no-brainer catch-all

**Why:** 2x miles on every purchase, full stop. No categories. No thinking. Miles can be used as statement credit against any travel purchase at 1 cent each.

**When I use it:** Anything that doesn't fit the other two — transport, tours, random purchases. Also useful when merchants don't accept Amex.

**The math:** Dead simple. $1 spent = 2 miles = 2 cents in travel credit.

## How I stack this with hotel hacks

The best move is combining these cards with Thai IP pricing (see my other post) and cashback portals. A $150 hotel booking through Rakuten at 5% cashback = $7.50 back. Paid with Chase Sapphire = 300 points (~$4.50). Total: ~$12 saved on a $150 booking. Every time.

## The card I don't carry

I stopped carrying airline-specific cards (United, Delta, etc.) because they lock you into one ecosystem. The flexible points from Chase and Amex are worth more because you can transfer to whichever partner has the best redemption for your route.

## Bottom line

- **Hotels & travel:** Chase Sapphire Preferred
- **Food:** Amex Gold
- **Everything else:** Capital One Venture

If you only get one, get the Chase Sapphire Preferred. It's the most versatile travel card I've used.
    `.trim(),
  },
  'priceline-24hr-cancellation': {
    title: "Priceline's 24-hour cancellation: the flight hack most people miss",
    excerpt: 'US law gives you 24 hours to cancel any flight booked 7+ days out — for free.',
    category: 'Flights',
    readTime: 4,
    img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=600&fit=crop&auto=format',
    content: `
Most people don't know this exists. US DOT regulation 14 CFR 259.5 requires all airlines to either hold a reservation at the quoted price for 24 hours without payment, or allow free cancellation within 24 hours of purchase — as long as the booking is made at least 7 days before departure.

## How to use this as a price-lock strategy

The trick is to use this rule to book now and decide later.

**Step 1:** Find a flight you like at a good price. Book it. Pay for it.

**Step 2:** Keep searching. Check Google Flights, Skyscanner, the airline direct. Check the same flight the next morning when sale prices sometimes update.

**Step 3:** If you find a better price within 24 hours, cancel the first booking (free) and rebook at the lower price.

**Step 4:** If you don't find better — you already have the ticket.

## The practical version

I use this every time I book a flight more than a week out. I book the best price I find, then spend 30 minutes the next morning checking if prices dropped overnight. About 30% of the time I find something better.

## Which airlines honor this

All US airlines by law. For international airlines operating to/from the US, they also must comply. That covers most major carriers.

**Airlines that are easy about it:** United, Delta, American, Southwest, JetBlue, Alaska.

**Watch out for:** Budget carriers like Spirit and Frontier sometimes make cancellation harder than it should be — read the cancellation flow carefully.

## The 7-day rule

This only applies to bookings made **at least 7 days before departure**. Last-minute bookings don't qualify. Plan accordingly.

## What about Priceline specifically

Priceline is my preferred OTA for this because their cancellation flow is fast and the refund usually hits within 3–5 business days. Expedia works too. Booking direct with the airline is the most reliable.

## Stack it with price alerts

Set a Google Flights price alert for the route before you book. If the alert emails you a drop within your 24-hour window, you know to cancel and rebook. I've saved $60–$180 doing this.

## The one thing to check

Some fares are marked "non-refundable" even on Priceline. For those, the 24-hour rule still applies — US law overrides the fare rules for the first 24 hours. But after 24 hours, those fares are genuinely non-refundable. Don't miss the window.
    `.trim(),
  },
  'tokyo-sixty-per-night': {
    title: 'Tokyo on $60/night: the best value hotels I actually stayed in',
    excerpt: "Tokyo has a reputation for being expensive. It isn't — if you know where to look.",
    category: 'Hotel reviews',
    readTime: 6,
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=600&fit=crop&auto=format',
    content: `
Tokyo is one of my favorite cities to stay in precisely because of how good the value is at the mid-range level. $60–80/night in Tokyo gets you something that would cost $150–200 in London or New York. Here are the properties I've personally stayed in.

## Why Tokyo is cheaper than its reputation

The reputation comes from the bubble era of the 1980s and 90s. Modern Tokyo has:

- Intense hotel competition (thousands of properties)
- A historically weak yen (great for USD/EUR travelers right now)
- A culture of obsessive quality at every price point
- Capsule hotels and business hotels that punch above their price

## The neighborhoods to focus on

**Shinjuku:** Convenient, great transit connections, never boring. Slightly pricier but worth it for first-time visitors.

**Asakusa:** Old Tokyo feel, near Senso-ji temple, slightly cheaper than Shinjuku. My personal favorite.

**Akihabara:** Central, cheap, close to everything. Not as atmospheric but excellent value.

**Avoid:** Shibuya for budget stays — you pay for the address.

## Hotels I actually stayed in

### Dormy Inn Asakusa (around $65–75/night)

The Dormy Inn chain is the best kept secret in Japanese business hotel travel. They have natural hot spring baths (onsen) on the top floor included in the price, a ramen service at 21:30 (free), fast wifi, and rooms that are small but immaculately designed.

The Asakusa location puts you 5 minutes from the temple and 15 minutes by metro from anywhere in the city.

**Would I stay again:** Yes, every time I'm in Tokyo.

### Khaosan Tokyo Kabuki (around $45–55/night)

A hostel-hotel hybrid in Asakusa. Private rooms available from $45. The building itself is a renovated old structure with character. Communal spaces are social without being rowdy. Japanese breakfast included.

**Best for:** Solo travelers who want their own room but like meeting people.

### Via Inn Akihabara (around $60–70/night)

Standard business hotel, exceptional location. Everything works perfectly. Rooms are tiny (that's Tokyo) but the bed is good, the shower is strong, and checkout is 11am. Close to JR Akihabara for easy airport access.

**Best for:** Transit stops, short trips, anyone who just needs a clean reliable base.

## How I search for Tokyo hotels

I always compare Agoda vs Booking.com side by side — Tokyo is one of the cities where the price gap between the two is most consistent. Agoda usually wins by $5–15/night for the same property. Over a week, that's a meaningful difference.

I also search from a Thai IP (using CheapStay or a VPN) which drops prices another 10–15% on most Tokyo properties compared to searching from a US or European IP.

## The $60/night formula

Thai IP pricing + Agoda comparison + Asakusa or Akihabara location = consistently under $70/night for a decent private room in central Tokyo. I've done it 4 times in the last 2 years.

## Flying to Japan?

Check our [Japan entry requirements guide](/fly-to/japan) for visa rules, what to know at Narita airport, and the cheapest way into Tokyo from the terminal.
    `.trim(),
  },
  'when-booking-direct-beats-agoda': {
    title: 'When booking direct beats Agoda — my rule of thumb',
    excerpt: 'Agoda and Booking.com are usually cheapest. But not always.',
    category: 'Booking hacks',
    readTime: 3,
    img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=600&fit=crop&auto=format',
    content: `
I default to Agoda for Asia and Booking.com for Europe. But there's a specific check I do before every booking that has saved me money on dozens of trips.

## The 3-minute check

Before I confirm any booking on an OTA, I open the hotel's own website and check the direct rate. Takes 3 minutes. Here's what I look for:

**Book direct if:**
- The hotel's website matches or beats the OTA price AND offers a free amenity (breakfast, late checkout, room upgrade, parking)
- You're booking a long stay (5+ nights) — hotels are more likely to negotiate or match
- You're booking a boutique or independent property (they give up 15–20% commission to OTAs — they'd rather give you 10% off direct)
- The hotel has a "best rate guarantee" — click it, they mean it

**Stick with Agoda/Booking.com if:**
- The OTA is cheaper with no extras from the hotel
- You're booking a chain hotel (Marriott, Hilton, IHG) — their loyalty programs are better than any direct rate
- You need flexibility and the OTA has better cancellation terms

## The boutique hotel trick

Independent hotels hate paying 15–20% commission to OTAs. If you email them directly before booking and say "I'm ready to book 4 nights, can you match the Agoda price and add breakfast?", a surprising number will say yes. I do this for any stay over $100/night at an independent property.

The worst they say is no. The best result I've had was a $120/night villa in Bali that became $95/night + breakfast + airport transfer by asking.

## Chain hotels: always book direct

For Marriott, Hilton, Hyatt, IHG — book through the chain's own site or app. The points you earn on direct bookings are worth more than the marginal price difference you might find on an OTA. And you get status perks (room upgrades, late checkout) that OTA bookings don't get.

## My actual rule

OTA first, then a 3-minute check on the hotel's direct site. If the hotel is independent and the direct rate is within $10 of the OTA, I book direct and ask for one extra perk. If it's a chain, I book direct regardless. Everything else, Agoda wins.
    `.trim(),
  },

  'bangkok-vs-chiang-mai': {
    title: 'Bangkok vs Chiang Mai: which is actually cheaper for long stays?',
    excerpt: "I've lived in both for months at a time. Here's the honest cost breakdown — accommodation, food, transport, coworking.",
    category: 'Destinations',
    readTime: 7,
    img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200&h=600&fit=crop&auto=format',
    content: `
I've spent over 6 months in Bangkok and 4 months in Chiang Mai across multiple trips. People always ask which is cheaper. The honest answer: Chiang Mai is cheaper, but Bangkok is better value for some things. Here's the full breakdown.

## Accommodation

**Chiang Mai:** A private room in a guesthouse in the Old City or Nimman area runs $20–40/night. A furnished studio monthly rental is $350–600/month. A serviced apartment with pool is $600–900/month.

**Bangkok:** Decent private room in Silom or Sukhumvit area runs $35–60/night. Monthly studio rentals are $500–900/month. The range is wider because Bangkok is bigger — you can find cheaper if you go further from the BTS.

**Winner: Chiang Mai** — about 20–30% cheaper for comparable quality.

## Food

**Chiang Mai:** Street food at a night market or local spot: 40–80 THB per meal. Café lunch: 100–150 THB. You can eat well for under $10/day without trying.

**Bangkok:** Street food is similar in price but there are more mid-range options pulling your average up. Local restaurant meal: 60–120 THB. The city is bigger and prices near tourist zones are higher.

**Winner: Tie** — if you eat local, both are extremely cheap. Chiang Mai has slightly more "local" options per square kilometer.

## Transport

**Chiang Mai:** No BTS or metro. You need a scooter rental ($80–120/month) or rely on Grab. A daily Grab habit adds up — budget $3–5/day.

**Bangkok:** The BTS/MRT covers most of the city. A 30-day unlimited pass is around 1,400 THB (~$40 USD). If you're near a BTS station, no scooter needed.

**Winner: Bangkok** — surprisingly cheaper if you live near a BTS line. Chiang Mai's scooter is cheap but requires confidence riding in Thai traffic.

## Coworking

**Chiang Mai:** CAMP (free with a coffee purchase), MANA, CAMP Nimman — cheap and good. Paid coworking is $5–8/day or $60–100/month.

**Bangkok:** More options but slightly pricier. Good coworking is $8–15/day or $100–180/month in central areas.

**Winner: Chiang Mai.**

## Internet

Both cities have excellent internet. True Move H and AIS offer fiber that's fast and cheap. Bangkok has more redundancy in upscale condos. Chiang Mai is fine for remote work.

## The total monthly budget

**Chiang Mai budget (comfortable):** $800–1,200/month — accommodation, food, scooter, coworking, social life.

**Bangkok budget (comfortable):** $1,000–1,500/month — slightly higher accommodation and transport offset by more variety.

## Which should you choose?

**Choose Chiang Mai if:** you want a slower pace, mountains nearby, a tight-knit nomad community, and to stretch your budget. It's a city you can walk and cycle.

**Choose Bangkok if:** you want a bigger city, more international flights, nightlife options, and you don't mind paying slightly more for the infrastructure. The BTS system makes it surprisingly liveable.

I switch between the two every few months. Chiang Mai to decompress and save; Bangkok when I need urban energy and direct flights.

## Flying to Thailand?

Before you book, check our [Thailand entry requirements guide](/fly-to/thailand) — visa rules, yellow fever requirements, and Bangkok airport tips in one place.
    `.trim(),
  },

  'japan-budget-travel': {
    title: 'Japan on a budget: the complete cost breakdown for 2 weeks',
    excerpt: "Japan's reputation for being expensive is outdated. Here's what I actually spent — flights, hotels, food, transport — and how to do it for less.",
    category: 'Destinations',
    readTime: 8,
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=600&fit=crop&auto=format',
    content: `
Japan has a reputation for being expensive. That reputation is about 20 years out of date. With the yen at historic lows against the USD and EUR, Japan is one of the best value destinations in Asia right now. Here's exactly what a 2-week trip costs if you do it right.

## Flights

From Southeast Asia (Bangkok, Singapore, KL): $150–350 return. From the US West Coast: $600–900 return. From Europe: $700–1,100 return.

Use CheapStay to search — flights from BKK to NRT regularly come in under $250 return. Book 6–8 weeks out for the best prices.

## Accommodation

**Budget (hostel dorm):** $20–35/night in Tokyo, Osaka, Kyoto. Japan has excellent hostels — clean, organized, often with great social spaces.

**Mid-range (business hotel):** $55–90/night. Dormy Inn chain is the best value in this category — clean rooms, often includes breakfast, onsen on the top floor. I've stayed in Dormy Inn Tokyo, Osaka, and Sapporo and it's consistently excellent.

**Budget tip:** Stay in Asakusa (Tokyo) or Higashiyama (Kyoto) — slightly further from the busiest areas but on direct subway lines and 15–20% cheaper.

## Food

This is where Japan surprises people. You can eat incredibly well for almost nothing.

**Convenience store meal (7-Eleven, FamilyMart, Lawson):** 400–700 JPY. Onigiri, sandwiches, hot food — Japanese convenience store food is genuinely good.

**Ramen shop:** 800–1,200 JPY (~$5–8 USD). This is a full meal.

**Izakaya (Japanese pub-restaurant):** 2,000–4,000 JPY for dinner with a couple of drinks.

**Sushi conveyor belt (kaiten-zushi):** 1,500–2,500 JPY for a proper meal. Not the tourist traps — go to Sushiro, Kura Sushi, or Hama Sushi chains.

**My average food cost:** ~3,000 JPY/day (~$20 USD) eating well, mixing convenience store lunches with sit-down dinners.

## Transport

**IC Card (Suica/Pasmo):** Load cash onto this card at any train station — works on all trains, buses, and even convenience stores in most cities. Essential.

**JR Pass:** Worth it ONLY if you're doing multiple bullet train legs (Tokyo → Kyoto → Hiroshima → Osaka etc.). A 7-day JR Pass costs ~$300 USD — do the math on your actual itinerary before buying.

**Tokyo Metro day pass:** 600 JPY for unlimited metro rides — use if you're doing more than 3–4 trips in a day.

**Within-city transport:** Plan around 500–1,000 JPY/day for an urban trip.

## 2-week budget breakdown

| Category | Budget option | Comfortable option |
|---|---|---|
| Flights (from SE Asia) | $200 | $300 |
| Accommodation (14 nights) | $400 (hostel) | $1,000 (Dormy Inn) |
| Food | $280 (~$20/day) | $560 (~$40/day) |
| Transport | $150 | $250 |
| Attractions + misc | $100 | $200 |
| **Total** | **~$1,130** | **~$2,310** |

Japan on $80/day is completely doable and you'll eat and sleep well. The $40/day budget is backpacker-but-still-good.

## When to go

**Best value:** March (before cherry blossom peak), November. Flights and hotels 20–30% cheaper than peak.

**Avoid:** Golden Week (late April–early May) and mid-August (Obon). Hotels double in price and everything is packed.

**Cherry blossom:** Beautiful but prices peak. If you want it, book hotels 3–4 months out.

## Flying to Japan?

Check our [Japan entry requirements guide](/fly-to/japan) — visa rules, no vaccine requirements, and Narita airport arrival tips.
    `.trim(),
  },

  'best-months-fly-southeast-asia': {
    title: 'The best months to fly to Southeast Asia — and the ones to avoid',
    excerpt: 'Timing your Southeast Asia flight can save you $200–400 on the ticket alone. Here are the exact windows I use after 4 years of booking these routes.',
    category: 'Flights',
    readTime: 6,
    img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=600&fit=crop&auto=format',
    content: `
After 4 years of flying in and out of Southeast Asia — Bangkok, Bali, Vietnam, Singapore — I've learned that when you book matters almost as much as where you book from. Here's exactly when prices peak, when they drop, and how I time it.

## The core pattern

Southeast Asia has two distinct travel seasons that drive flight prices:

**High season (expensive):** December 15 – January 15, July–August. Christmas/New Year + European summer = full flights and peak prices.

**Shoulder season (best value):** February–March, October–November. Weather is still good in most of SE Asia, flights are 20–40% cheaper, and hotels have availability.

**Rainy season (cheap but wet):** May–June, September. Prices drop significantly but you'll get afternoon rain in Thailand, Vietnam, and Bali. Not a dealbreaker — rain usually comes in short heavy bursts, not all-day drizzle.

## By destination

**Thailand (Bangkok, Phuket, Chiang Mai)**
- Best months to fly: February, March, November
- Cheap but acceptable: May, September, October
- Avoid (price peak): December 20 – January 10
- Avoid (rainy + cheap): June–August in Bangkok (humid and wet but not unvisitable)

**Bali, Indonesia**
- Best months: April–May, September–October
- Dry season July–August is peak — beautiful weather but flight prices surge, especially from Australia
- Avoid for Australians: school holidays (July, September, April)
- Rainy season (wet but cheap): November–March

**Vietnam (HCMC, Hanoi, Da Nang)**
- More complex because the country spans a large latitude — north and south have different climates
- HCMC best months: December–April (dry season, still peak pricing Dec–Jan)
- Hanoi best months: October–November, March–April
- Avoid: Typhoon season August–October in central/north Vietnam

**Singapore**
- Year-round destination — no seasonal weather variation
- Prices peak December and Chinese New Year (January–February)
- Best value: May–June, September

## How far in advance to book

For SE Asia routes from the US or Europe: **6–10 weeks out** is typically the sweet spot. Earlier than that and prices are often inflated. Closer than 3 weeks and it starts going up again.

For intra-Asia routes (Bangkok to Tokyo, Singapore to Bali): these routes are competitive and deals appear even 2–3 weeks out. I regularly book 2–3 weeks out for sub-$200 return fares within the region.

## The Thai IP pricing advantage

Regardless of when you book, searching from a Thai IP (either using CheapStay or a VPN connected to Thailand) cuts 15–30% off OTA hotel prices for the destination you're flying to. The flight itself is priced globally, but your accommodation savings more than cover the difference in off-peak vs peak flight pricing.

## My actual booking strategy

1. Set a price alert on Google Flights for the route
2. When I see a price within $50 of the historical low, I book (don't wait for the absolute bottom)
3. I always book at least 7 days out so I get the 24-hour free cancellation window under US DOT rules
4. I then keep watching — if the price drops significantly in 24 hours, I cancel and rebook

The last time I used this on a Bangkok–Tokyo route I saved $140 by rebooking within the window.

## Flying soon?

Check out our destination guides before you go — [Thailand](/fly-to/thailand), [Vietnam](/fly-to/vietnam), [Japan](/fly-to/japan) — visa rules, vaccine requirements, and airport arrival tips all in one place.
    `.trim(),
  },

  'jakarta-underrated-city': {
    title: "Jakarta: Southeast Asia's most underrated city — and I'm writing this from there",
    excerpt: "Everyone goes to Bali. Almost nobody goes to Jakarta. That's exactly why you should. It's cheaper than Bangkok, the food scene rivals anywhere in Asia, and you'll have it largely to yourself.",
    category: 'Destinations',
    readTime: 7,
    img: 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=1200&h=600&fit=crop&auto=format',
    content: `
I'm writing this from Jakarta. I've been here for a few weeks and I keep asking myself the same question: why doesn't anyone talk about this city?

Everyone in Southeast Asia goes to Bali. Some people go to Yogyakarta. Almost nobody — at least among the digital nomad / long-term traveler crowd — ends up in Jakarta. That's a mistake.

## What Jakarta actually is

Jakarta is a megacity of 10+ million people. It's the capital of Indonesia, a major business hub, and has one of the most diverse and underrated food scenes in all of Asia. It has malls that rival Singapore, beaches within 2 hours, and a cost of living that makes Bangkok look expensive.

It's also chaotic, sprawling, and takes a few days to figure out. That's probably why people skip it. Their loss.

## Cost of living

This is where it gets interesting. Jakarta is genuinely one of the cheapest cities in Southeast Asia for the level of quality you get.

**Accommodation:**
- Budget guesthouse: $15–25/night
- Good serviced apartment: $35–55/night
- Decent monthly rental (furnished studio): $400–700/month
- That's significantly cheaper than Bangkok for comparable quality

**Food:**
- Warung meal (local restaurant): 20,000–40,000 IDR ($1.25–2.50 USD)
- Mid-range restaurant: 80,000–150,000 IDR (~$5–9 USD)
- Western café lunch: 80,000–150,000 IDR
- You can eat extremely well for under $10/day

**Transport:**
- Grab is ubiquitous and cheap. Cross-city ride: 30,000–80,000 IDR (~$2–5 USD)
- MRT and TransJakarta bus network covers a lot of the city and costs a few thousand IDR per trip
- Ojek (motorbike taxi via Gojek) for short hops: 10,000–25,000 IDR

**Overall monthly budget:** $700–1,100/month for a comfortable life — below Bangkok, significantly below Bali.

## The food scene

Jakarta's food is the real reason to come. Indonesia has hundreds of regional cuisines and Jakarta, as the capital, has all of them.

**Things you need to eat:**
- **Nasi Padang** — Minangkabau food from West Sumatra. You sit down, they bring 8–12 small dishes of curries, rendang, and vegetables, and you pay for what you eat. Rendang from a good Padang place in Jakarta is one of the best things I've eaten anywhere.
- **Soto Betawi** — Jakarta's own beef soup with coconut milk. Rich, deeply flavoured, eaten for breakfast.
- **Gado-gado** — peanut sauce salad with tofu, tempeh, vegetables, and lontong (rice cake). Cheap, filling, excellent.
- **Street food markets (Pasar)** — every neighborhood has one. Go in the evening.
- **PIK 2 food strip** — newer area in North Jakarta with hundreds of restaurants, very local, very cheap.

## What to do

Jakarta isn't a sightseeing city in the traditional sense. There are things to see, but the experience is about living in it.

**Kota Tua (Old Town):** Dutch colonial architecture, museums, the old port. Worth a half-day.

**SCBD and Sudirman:** The modern business/expat district. Good coffee shops, co-working spaces, walkable streets (rare in Jakarta).

**Ancol:** Beach resort area on the north coast. Not pristine, but a legitimate beach escape 30–45 minutes from the center.

**Thousand Islands (Pulau Seribu):** Day trip or overnight from the port at Ancol. White sand, clear water, 90 minutes by boat. Completely undervisited.

**Malls:** Indonesians love malls and Jakarta's are world-class. Grand Indonesia, Plaza Indonesia, Pacific Place — they're genuinely worth visiting for the food courts alone.

## Practical notes

**Getting around:** Grab and Gojek are your friends. The MRT is clean and fast but limited in coverage. Traffic is notoriously bad — don't plan tight schedules.

**Language:** Most people in service roles speak enough English. Menus in tourist-adjacent areas are often bilingual. Learning a few Indonesian words (terima kasih = thank you, berapa = how much) goes a long way.

**Safety:** Jakarta is generally safe for travelers in normal tourist and expat areas. Standard big-city awareness applies.

**Weather:** Hot and humid year-round (~28–33°C). Wet season is October–April with heavy afternoon rains. Dry season May–September is more comfortable.

## Why it's underrated

Honestly? I think it's the reputation. "Jakarta" conjures traffic and pollution. That's not wrong — it has both. But so does Bangkok, and everyone loves Bangkok.

The difference is that Bangkok has been discovered. Jakarta hasn't. That means cheaper prices, fewer tourists at every restaurant and attraction, and a more authentic experience of a genuinely interesting city.

If you want the Bangkok experience from 10 years ago — the food, the chaos, the value — go to Jakarta.

## Visa and entry

Most nationalities can visit Indonesia visa-free or get a Visa on Arrival. Check our [Indonesia entry requirements guide](/fly-to/indonesia) for the full breakdown.
    `.trim(),
  },

  'long-flight-ideas': {
    title: "14 things to do on a long flight — including a few that might actually improve your life",
    excerpt: "A 12-hour flight is dead time if you let it be. It can also be the most focused, uninterrupted block of time you get all month. Here's how I use it.",
    category: 'Travel hacks',
    readTime: 8,
    img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=600&fit=crop&auto=format',
    content: `
A 12-hour flight used to feel like a punishment. Now I look forward to them. No notifications, no meetings, no one asking you anything. It's one of the last remaining places where you can have a genuinely uninterrupted block of time.

The difference is preparation. Here's what I actually do on long flights — and a few things worth trying if you haven't.

## Before you board: get the setup right

The quality of your flight is mostly determined in the hour before you board.

**Noise-cancelling headphones** are non-negotiable for anything over 4 hours. The constant drone of the engines is more exhausting than you think — blocking it makes a real difference to how you arrive. I use them even when I'm not listening to anything. [Sony or Bose are the standard picks](https://www.amazon.com/s?k=noise+cancelling+headphones+travel&tag=cheapstay-20) — worth every cent on long-haul.

**Sleep kit** if you're flying overnight: eye mask, earplugs, and a neck pillow. A [decent travel sleep kit](https://www.amazon.com/s?k=travel+sleep+kit+eye+mask+neck+pillow&tag=cheapstay-20) costs $20 and transforms a red-eye from exhausting to actually restful.

Download everything before you board — offline Spotify playlists, Netflix downloads, podcasts, Kindle books. Assume in-flight WiFi will be slow or expensive.

---

## Things to do that actually move your life forward

### 1. Learn the basics of the local language

You have 10–14 hours and nothing to do. That's enough time to learn 100–150 words and basic phrases in almost any language using Duolingo or Babbel. You won't be fluent, but you'll arrive able to say hello, thank you, how much, and where is the bathroom — which is 80% of what you need for the first 48 hours.

I did this before my first trip to Japan. I was shocked by how much goodwill a few words in Japanese got me.

**Good apps for offline use:** Duolingo (download the language pack), Pimsleur (audio-based, great for flights).

### 2. Finish the online course you've been ignoring

Most people have a half-finished Udemy or Coursera course collecting digital dust. Download the videos and actually finish it. 12 hours is enough to complete most courses.

Good use cases: a new programming language, design basics, video editing, anything business-related. This is one of those things that's easy to justify at 35,000 feet and hard to start on the ground.

### 3. Write

Planes are unusually good for writing. No distractions, no WiFi temptation, and something about the altitude seems to make it easier. I've written some of my best blog posts at cruising altitude.

Doesn't have to be a blog post. Could be journaling, planning a project, writing letters, drafting something you've been putting off.

### 4. Read a book you've been avoiding

Not an article. Not a Twitter thread. An actual book. A long flight is often the only time people who claim "I don't have time to read" actually finish one.

A [Kindle Paperwhite](https://www.amazon.com/s?k=kindle+paperwhite&tag=cheapstay-20) makes this easier — lightweight, weeks of battery, holds your entire library. Dark mode for night flights.

### 5. Plan the trip in detail

I don't mean "look at Instagram." I mean actually plan: neighbourhoods, day itineraries, restaurants to book, transportation logistics, visa entry details. Most people land without a plan and waste the first day figuring it out.

Use the flight to build a proper itinerary. Check [our fly-to guides](/fly-to) for the entry requirements for your destination — worth reading before you arrive.

### 6. Deep work — if you have the right project

Some creative or analytical work is actually better done at altitude. Writing, coding, designing, strategy planning. If you have a laptop and a specific project, treat the flight like a focus session. Put your phone in airplane mode even if WiFi is available.

---

## Things to do that are just about enjoying the flight

### 7. Watch a film you've been meaning to see

Specifically: a long one. A 3-hour film you wouldn't normally sit through is perfect on a plane. Download it before you leave.

Good genre for flights: something visually spectacular (Dune, Lawrence of Arabia, anything IMAX-worthy) — it's one of the few times you'll watch a screen in the dark with headphones on for 3 hours straight.

### 8. Catch up on podcasts or audiobooks

Download 3–4 hours of podcasts before you go. Long-form interviews or documentary-style podcasts work well — the kind you never have time for normally.

Audiobooks are underrated for flights. A 10-hour audiobook fits neatly in a long-haul.

### 9. Sleep — properly

If it's a red-eye or you're crossing many time zones, sleeping on the plane is the best thing you can do for your first day at the destination. Don't fight it to watch movies.

The setup: window seat, sleep kit, melatonin (optional, ~0.5–1mg is enough), neck pillow, and headphones playing something low-key. Adjust your watch to destination time as soon as you board and act like it's that time.

---

## Things for your health

### 10. Stretch every 90 minutes

Blood pooling in your legs over 12 hours is genuinely uncomfortable and can cause real issues. Set a timer for every 90 minutes. Walk to the back of the plane, do a few calf raises and hip flexor stretches. Takes 5 minutes. You'll arrive feeling significantly better.

### 11. Hydrate aggressively

Cabin air is extremely dry — humidity is around 10–15%, compared to 40–60% on the ground. You lose water faster than you feel thirsty. Drink a glass of water every hour. Avoid alcohol or limit it (dehydrates you further). Your skin and your head will thank you on arrival.

### 12. Skip a meal and use that time for something else

Airline meals are rarely worth the disruption. You eat, you get sleepy, you lose the momentum of whatever you were doing. On longer flights I sometimes skip one meal, drink water instead, and use the time to keep reading or working. Arrive, eat well.

---

## Things that are just honest fun

### 13. Actually talk to the person next to you

Most of the time: fine to not do this. But occasionally you end up next to someone interesting. I've had some genuinely good conversations on long flights — people in unusual jobs, travelers with good stories, locals who can tell you where to actually go.

Worth at least a "where are you headed?" if the mood is right.

### 14. Plan your next trip

You're already in travel mode. Use the flight to daydream productively — look at where you want to go next, rough timelines, what it costs. I've planned entire months of travel on long-haul flights.

And when you're ready to actually book — [search for flights here](/).

---

## The gear that makes the difference

For a long flight, the investment that pays off most is the stuff that helps you sleep or focus:

- [Noise-cancelling headphones](https://www.amazon.com/s?k=noise+cancelling+headphones+travel&tag=cheapstay-20) — the single best upgrade
- [Sleep travel kit](https://www.amazon.com/s?k=travel+sleep+kit+eye+mask+neck+pillow&tag=cheapstay-20) — eye mask + earplugs + neck pillow, under $25
- [Kindle Paperwhite](https://www.amazon.com/s?k=kindle+paperwhite&tag=cheapstay-20) — your entire reading library, 6 weeks of battery

Everything else in our [travel shop](/shop) for the full packing list.
    `.trim(),
  },

  'anytime-fitness-global-hack': {
    title: 'The Anytime Fitness hack every traveler should know: sign up cheap, train anywhere',
    excerpt: "Sign up for Anytime Fitness in Jakarta at local prices — then use that membership at gyms in Japan, Singapore, or anywhere else in the world. Here's exactly how it works.",
    category: 'Travel hacks',
    readTime: 5,
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=600&fit=crop&auto=format',
    content: `
Most people don't know this, but Anytime Fitness memberships are global. If you sign up at any Anytime Fitness location in the world, you can walk into any other Anytime Fitness — in any country — and work out.

The hack: sign up in a country where memberships are cheap, then use that membership everywhere else.

## The price difference is significant

Anytime Fitness membership costs vary massively by country:

- **Indonesia (Jakarta):** ~$15–25 USD/month
- **Thailand (Bangkok):** ~$30–45 USD/month
- **Japan (Tokyo):** ~$60–90 USD/month
- **Singapore:** ~$80–110 USD/month
- **Australia:** ~$60–80 AUD/month
- **USA:** ~$30–50 USD/month

If you sign up in Jakarta at $20/month, you're saving $40–90/month compared to joining in Japan or Singapore. Over a year of travel, that's $500–1,000 saved on gym access alone.

## How the global access works

Anytime Fitness operates a "home club" model. When you join, one location is designated as your home club. You can then visit any other Anytime Fitness worldwide using the same key fob or app.

The key rule to understand: **Anytime Fitness can reclassify your membership if you consistently use other clubs more than your home club.** The threshold is roughly 50% — if your usage at away locations exceeds your usage at your home club over time, the system may flag your account and your membership could be transferred to the club you're actually using most, at that club's local pricing.

**How to stay under the threshold:** Use your home gym when you're in Jakarta (or wherever you signed up) for at least half your total monthly visits. If you're traveling constantly, just make sure you're not exclusively using away clubs month after month.

In practice, this works fine for most travelers. If you're based in Southeast Asia and traveling periodically to Japan or Singapore, you'll naturally be at your home gym often enough.

## How to set it up

1. **Find an Anytime Fitness in Jakarta** (or any cheap city you spend time in) — there are many locations across the city
2. **Sign up in person** — bring your passport and a payment method. Monthly membership, no long-term contract required at most locations
3. **Get your key fob** — this is your access to any Anytime Fitness worldwide
4. **Download the Anytime Fitness app** — use it to find locations globally and check in
5. **Visit any gym anywhere** — walk in, tap your fob, done

## What to watch out for

**Contracts:** Some locations require a minimum term (3 or 6 months). Ask before signing. Many Jakarta locations offer month-to-month.

**The 50% rule:** As noted above, Anytime Fitness monitors home vs away usage. Don't use it as a pure "away-only" membership for months on end — that's likely to trigger a reclassification. Use your home gym when you're in the city.

**Policy changes:** Gym chain policies change. Confirm the current global access terms with the specific location before signing up. This post reflects the policy as I experienced it — verify directly.

**Not every city has one:** Anytime Fitness has 5,000+ locations in 30+ countries, but it's not everywhere. Check the app or website for coverage before committing.

## Where it's useful

Great coverage in: Japan, South Korea, Australia, New Zealand, USA, Canada, Philippines, Singapore, Thailand, Taiwan, UK.

## The bottom line

If you're a traveler who cares about staying fit on the road, this is one of the best travel hacks available. A $20/month Jakarta membership gives you access to a global gym network that would cost $80–100/month in Tokyo or Singapore.

Sign up in Jakarta (or the cheapest city you're spending time in), use it at home when you're there, and enjoy global gym access at local prices everywhere else.

**Currently in Indonesia?** Check our [Indonesia entry requirements guide](/fly-to/indonesia) for visa, arrival, and travel tips.
    `.trim(),
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  'Booking hack': '#1D9E75',
  'Booking hacks': '#1D9E75',
  'Credit cards': '#1A73E8',
  'Flights': '#7c3aed',
  'Hotel reviews': '#b45309',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) return {};
  const url = `https://www.cheapstay.co/blog/${slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: 'Avi', url: 'https://www.cheapstay.co/about' }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.img, width: 1200, height: 630, alt: post.title }],
      type: 'article',
      authors: ['Avi'],
      url,
      siteName: 'CheapStay',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.img],
    },
    alternates: { canonical: url },
  };
}

export function generateStaticParams() {
  return Object.keys(POSTS).map(slug => ({ slug }));
}

function renderContent(md: string) {
  const lines = md.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;
  let inList = false;
  let listItems: React.ReactNode[] = [];

  function flushList() {
    if (listItems.length) {
      elements.push(<ul key={key++} className="space-y-2 my-3 ml-4">{listItems}</ul>);
      listItems = [];
      inList = false;
    }
  }

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={key++} className="text-xl font-extrabold text-gray-900 mt-10 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={key++} className="text-base font-bold text-gray-900 mt-6 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('- ')) {
      inList = true;
      listItems.push(<li key={key++} className="text-gray-600 text-sm leading-relaxed list-disc">{renderInline(line.slice(2))}</li>);
    } else if (line.trim() === '') {
      flushList();
      elements.push(<div key={key++} className="h-2" />);
    } else {
      flushList();
      elements.push(<p key={key++} className="text-gray-600 text-sm leading-relaxed">{renderInline(line)}</p>);
    }
  }
  flushList();
  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return <a key={i} href={linkMatch[2]} className="text-teal underline" target="_blank" rel="noopener noreferrer">{linkMatch[1]}</a>;
    }
    return part;
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) notFound();

  const catColor = CATEGORY_COLORS[post.category] ?? '#6b7280';

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.img,
    author: {
      '@type': 'Person',
      name: 'Avi',
      url: 'https://www.cheapstay.co/about',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CheapStay',
      url: 'https://www.cheapstay.co',
    },
    url: `https://www.cheapstay.co/blog/${slug}`,
    mainEntityOfPage: `https://www.cheapstay.co/blog/${slug}`,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="relative w-full h-64 sm:h-80">
        <Image src={post.img} alt={post.title} fill className="object-cover" unoptimized priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <div className="max-w-2xl mx-auto">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white mb-3 inline-block"
              style={{ background: catColor }}>
              {post.category}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">{post.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <a href="/about" className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200 group">
          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-sm ring-2 ring-gray-100 group-hover:ring-teal transition-all">
            <Image src="/avi.jpg" alt="Avi — founder of CheapStay" width={56} height={56} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-base font-bold text-gray-900 group-hover:text-teal transition-colors">Avi</div>
            <div className="text-sm text-gray-500 mt-0.5">Full-time traveler · 50+ countries · {post.readTime} min read</div>
          </div>
        </a>

        <article className="space-y-1">
          {renderContent(post.content)}
        </article>

        <BlogScrollTracker title={post.title} slug={slug} />

        <div className="mt-10 p-6 rounded-2xl text-center" style={{ background: '#0a1628' }}>
          <p className="text-white font-bold mb-1">Find the cheapest hotel price right now</p>
          <p className="text-white/50 text-xs mb-4">Compare Agoda vs Booking.com — Thai-market prices, no VPN needed</p>
          <Link href="/" className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#1D9E75' }}>
            Search hotels →
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link href="/blog" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← All articles</Link>
        </div>
      </div>
    </main>
  );
}
