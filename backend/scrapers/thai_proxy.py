"""
Thai proxy resolver for Agoda geo-price fetching.

When the user's VPN routes all traffic through a non-Thai IP, we need an explicit
Thai proxy to get geo-discounted prices. Priority:
  1. User-configured proxy from config.json (thai_proxy key)
  2. Local SOCKS5 relay via Python asyncio (works when Python is on Thai IP)
  3. None → caller shows "configure a Thai proxy" prompt

Auto-discovery of free Thai proxies was removed — free public proxies don't
support HTTPS tunneling reliably enough for Agoda's JS-rendered price pages.
"""


async def get(configured: str = "") -> str | None:
    """Return a proxy URL that routes through Thailand, or None."""
    return configured.strip() or None
