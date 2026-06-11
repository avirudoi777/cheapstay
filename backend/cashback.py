import json
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

_ENV_DEFAULTS = {
    "scraperapi_key":       os.environ.get("SCRAPERAPI_KEY", ""),
    "agoda_affiliate_id":   os.environ.get("AGODA_AFFILIATE_ID", ""),
    "travelpayouts_token":  os.environ.get("TRAVELPAYOUTS_TOKEN", ""),
    "travelpayouts_marker": os.environ.get("TRAVELPAYOUTS_MARKER", ""),
    "credit_card_rate":     float(os.environ.get("CC_CASHBACK_RATE", "0.03")),
    "sites": {
        "agoda":     {"portal": "TopCashBack", "rate": float(os.environ.get("AGODA_CASHBACK_RATE", "0.06"))},
        "hotellook": {"portal": "Travelpayouts", "rate": float(os.environ.get("HL_CASHBACK_RATE", "0.0"))},
    },
}


def load_config() -> dict:
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH) as f:
            return json.load(f)
    return _ENV_DEFAULTS


def save_config(data: dict):
    with open(CONFIG_PATH, "w") as f:
        json.dump(data, f, indent=2)


def net_price(raw: float, portal_rate: float, cc_rate: float) -> float:
    after_portal = raw * (1 - portal_rate)
    after_cc = after_portal * (1 - cc_rate)
    return round(after_cc, 2)


def _platform_to_key(platform: str) -> str:
    # "Booking.com" → "booking", "Agoda" → "agoda", "Priceline" → "priceline"
    return platform.lower().replace(".com", "").replace(" ", "").split("/")[0]


def apply_cashback(result: dict, config: dict) -> dict:
    site_key = _platform_to_key(result["platform"])
    site_cfg = config["sites"].get(site_key, {})
    portal_rate = site_cfg.get("rate", 0.0)
    cc_rate = config.get("credit_card_rate", 0.03)

    result["portal"] = site_cfg.get("portal", "")
    result["portal_cashback_pct"] = round(portal_rate * 100, 1)
    result["cc_cashback_pct"] = round(cc_rate * 100, 1)

    if result.get("raw_price") is not None:
        result["net_price"] = net_price(result["raw_price"], portal_rate, cc_rate)
    else:
        result["net_price"] = None

    # Append Agoda affiliate ID when configured
    aff_id = config.get("agoda_affiliate_id", "").strip()
    if aff_id and result["platform"] == "Agoda" and result.get("booking_url"):
        sep = "&" if "?" in result["booking_url"] else "?"
        result["booking_url"] = f"{result['booking_url']}{sep}cid={aff_id}"

    return result
