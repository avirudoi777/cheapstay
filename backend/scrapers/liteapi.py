"""
Liteapi hotel search integration.
Replaces Agoda + Booking.com scrapers with a legitimate REST API.
Uses guestNationality="TH" to fetch Thai-market pricing automatically.
"""

import httpx
import re as _re
from typing import Optional

BASE_URL = "https://api.liteapi.travel/v3.0"

# City name → (countryCode, cityName for API)
# Add more as needed
CITY_MAP: dict[str, tuple[str, str]] = {
    # Southeast Asia
    "bangkok":          ("TH", "Bangkok"),
    "chiang mai":       ("TH", "Chiang Mai"),
    "phuket":           ("TH", "Phuket"),
    "pattaya":          ("TH", "Pattaya"),
    "hua hin":          ("TH", "Hua Hin"),
    "koh samui":        ("TH", "Koh Samui"),
    "krabi":            ("TH", "Krabi"),
    "bali":             ("ID", "Bali"),
    "jakarta":          ("ID", "Jakarta"),
    "singapore":        ("SG", "Singapore"),
    "kuala lumpur":     ("MY", "Kuala Lumpur"),
    "penang":           ("MY", "Penang"),
    "ho chi minh":      ("VN", "Ho Chi Minh City"),
    "ho chi minh city": ("VN", "Ho Chi Minh City"),
    "saigon":           ("VN", "Ho Chi Minh City"),
    "hanoi":            ("VN", "Hanoi"),
    "hoi an":           ("VN", "Hoi An"),
    "da nang":          ("VN", "Da Nang"),
    "siem reap":        ("KH", "Siem Reap"),
    "phnom penh":       ("KH", "Phnom Penh"),
    "manila":           ("PH", "Manila"),
    "cebu":             ("PH", "Cebu"),
    "yangon":           ("MM", "Yangon"),
    "colombo":          ("LK", "Colombo"),
    "maldives":         ("MV", "Male"),
    "male":             ("MV", "Male"),
    # East Asia
    "tokyo":            ("JP", "Tokyo"),
    "osaka":            ("JP", "Osaka"),
    "kyoto":            ("JP", "Kyoto"),
    "seoul":            ("KR", "Seoul"),
    "busan":            ("KR", "Busan"),
    "hong kong":        ("HK", "Hong Kong"),
    "taipei":           ("TW", "Taipei"),
    "beijing":          ("CN", "Beijing"),
    "shanghai":         ("CN", "Shanghai"),
    # South Asia
    "delhi":            ("IN", "New Delhi"),
    "new delhi":        ("IN", "New Delhi"),
    "mumbai":           ("IN", "Mumbai"),
    "goa":              ("IN", "Goa"),
    "kathmandu":        ("NP", "Kathmandu"),
    # Middle East
    "dubai":            ("AE", "Dubai"),
    "abu dhabi":        ("AE", "Abu Dhabi"),
    "doha":             ("QA", "Doha"),
    # Europe
    "london":           ("GB", "London"),
    "paris":            ("FR", "Paris"),
    "barcelona":        ("ES", "Barcelona"),
    "madrid":           ("ES", "Madrid"),
    "rome":             ("IT", "Rome"),
    "amsterdam":        ("NL", "Amsterdam"),
    "berlin":           ("DE", "Berlin"),
    "prague":           ("CZ", "Prague"),
    "budapest":         ("HU", "Budapest"),
    "vienna":           ("AT", "Vienna"),
    "lisbon":           ("PT", "Lisbon"),
    "athens":           ("GR", "Athens"),
    "istanbul":         ("TR", "Istanbul"),
    "zurich":           ("CH", "Zurich"),
    # Americas
    "new york":         ("US", "New York"),
    "los angeles":      ("US", "Los Angeles"),
    "miami":            ("US", "Miami"),
    "las vegas":        ("US", "Las Vegas"),
    "san francisco":    ("US", "San Francisco"),
    "chicago":          ("US", "Chicago"),
    "cancun":           ("MX", "Cancun"),
    "mexico city":      ("MX", "Mexico City"),
    "rio de janeiro":   ("BR", "Rio de Janeiro"),
    "buenos aires":     ("AR", "Buenos Aires"),
    # Oceania
    "sydney":           ("AU", "Sydney"),
    "melbourne":        ("AU", "Melbourne"),
    "auckland":         ("NZ", "Auckland"),
    # Africa
    "cape town":        ("ZA", "Cape Town"),
    "marrakech":        ("MA", "Marrakech"),
    "cairo":            ("EG", "Cairo"),
}


def _headers(api_key: str) -> dict:
    return {
        "X-API-Key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def _lookup_city(location: str) -> Optional[tuple[str, str]]:
    """Return (countryCode, cityName) for a location string, or None if unknown."""
    key = location.lower().strip()
    if key in CITY_MAP:
        return CITY_MAP[key]
    # Try partial match
    for k, v in CITY_MAP.items():
        if k in key or key in k:
            return v
    return None


async def fetch_hotel_ids(api_key: str, country_code: str, city_name: str, limit: int = 50) -> list[str]:
    """Fetch hotel IDs for a city from Liteapi."""
    async with httpx.AsyncClient(timeout=20, trust_env=False) as client:
        r = await client.get(
            f"{BASE_URL}/data/hotels",
            headers=_headers(api_key),
            params={
                "countryCode": country_code,
                "cityName": city_name,
                "limit": limit,
                "language": "en",
            },
        )
        r.raise_for_status()
        data = r.json()
        hotels = data.get("data", [])
        return [h["id"] for h in hotels if h.get("id")]


async def fetch_rates(
    api_key: str,
    hotel_ids: list[str],
    checkin: str,
    checkout: str,
    adults: int = 2,
    currency: str = "USD",
    guest_nationality: str = "TH",
) -> list[dict]:
    """Fetch rates for a list of hotel IDs. Uses TH nationality for Thai pricing."""
    if not hotel_ids:
        return []

    payload = {
        "hotelIds": hotel_ids[:50],  # API limit
        "checkin": checkin,
        "checkout": checkout,
        "currency": currency,
        "guestNationality": guest_nationality,
        "occupancies": [{"adults": adults}],
    }

    async with httpx.AsyncClient(timeout=30, trust_env=False) as client:
        r = await client.post(
            f"{BASE_URL}/hotels/rates",
            headers=_headers(api_key),
            json=payload,
        )
        r.raise_for_status()
        data = r.json()
        return data.get("data", [])


def _nights(checkin: str, checkout: str) -> int:
    from datetime import date
    try:
        n = (date.fromisoformat(checkout) - date.fromisoformat(checkin)).days
        return max(n, 1)
    except Exception:
        return 1


def _parse_rate(hotel_rate: dict, nights: int) -> Optional[dict]:
    """Convert a Liteapi hotel rate object into the format CheapStay frontend expects."""
    hotel_info = hotel_rate.get("hotel", {})
    rates = hotel_rate.get("roomTypes", [])

    if not rates:
        return None

    # Pick cheapest room
    cheapest = None
    cheapest_price = None
    for room in rates:
        for rate in room.get("rates", []):
            price = rate.get("retailRate", {}).get("total", [{}])[0].get("amount")
            if price is not None:
                if cheapest_price is None or price < cheapest_price:
                    cheapest_price = price
                    cheapest = rate

    if cheapest_price is None:
        return None

    price_per_night = round(cheapest_price / nights, 2) if nights > 0 else cheapest_price

    # Build booking URL
    booking_url = hotel_rate.get("bookingUrl") or cheapest.get("bookingUrl") or ""

    # Extract hotel details
    name = hotel_info.get("name", "Unknown Hotel")
    stars = hotel_info.get("starRating")
    rating = hotel_info.get("rating")
    address = hotel_info.get("address", {})
    location_str = address.get("city") or address.get("country") or ""

    # Images
    images = hotel_info.get("images", [])
    image_url = images[0].get("url") if images else None

    # Amenities
    facilities = hotel_info.get("facilities", [])
    amenity_names = [f.get("name") for f in facilities[:3] if f.get("name")]

    # Cancellation
    cancel_policy = cheapest.get("cancellationPolicies", {})
    is_free_cancel = bool(cancel_policy.get("cancelPolicyInfos"))

    return {
        "name": name,
        "image_url": image_url,
        "rating": str(rating) if rating else None,
        "review_label": None,
        "review_count": None,
        "stars": int(stars) if stars else None,
        "location": location_str,
        "original_price": None,
        "nights": nights,
        "amenities": amenity_names,
        "review_snippet": None,
        "deal_badge": None,
        "agoda_price": None,
        "agoda_url": "",
        "hl_price": None,
        "hl_url": None,
        "best_platform": "liteapi",
        "price": price_per_night,
        "booking_price": price_per_night,
        "booking_url": booking_url,
        "total_price": round(cheapest_price, 2),
        "free_cancellation": is_free_cancel,
        "thai_price": True,  # Always true — we use guestNationality=TH
    }


async def fetch_city_hotels(
    api_key: str,
    location: str,
    checkin: str,
    checkout: str,
    adults: int = 2,
    hotel_name: str = "",
) -> dict:
    """
    Main entry point: fetch hotels for a city with Thai pricing.
    Returns a dict matching the existing /search-city response shape.
    """
    nights = _nights(checkin, checkout)

    # Resolve city to country code
    city_info = _lookup_city(location)
    if city_info is None:
        return {"hotels": [], "total_count": 0, "error": f"City not found: {location}"}

    country_code, city_name = city_info

    try:
        hotel_ids = await fetch_hotel_ids(api_key, country_code, city_name, limit=50)
    except Exception as e:
        return {"hotels": [], "total_count": 0, "error": str(e)}

    if not hotel_ids:
        return {"hotels": [], "total_count": 0}

    try:
        rates = await fetch_rates(api_key, hotel_ids, checkin, checkout, adults)
    except Exception as e:
        return {"hotels": [], "total_count": 0, "error": str(e)}

    hotels = []
    for hotel_rate in rates:
        parsed = _parse_rate(hotel_rate, nights)
        if parsed is None:
            continue
        # Filter by hotel name if provided
        if hotel_name:
            if hotel_name.lower() not in parsed["name"].lower():
                continue
        hotels.append(parsed)

    # Sort by price ascending
    hotels.sort(key=lambda h: h["price"] if h["price"] is not None else 9999)

    # Mark best deal
    if hotels:
        hotels[0]["best"] = True

    return {"hotels": hotels, "total_count": len(hotels)}
