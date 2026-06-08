"""
Minimal local SOCKS5 proxy server.

Playwright → this proxy (localhost) → internet via Python asyncio (Thai IP).

Why this works: the user's VPN routes the Chromium browser process through a US IP
but leaves Python processes on Thai IP. By proxying Playwright's traffic through a
local server that forwards connections using Python's network stack, we force all
Agoda requests to exit from Thai IP — getting the local geo-discounted rates.
"""

import asyncio
import struct


async def _relay(reader, writer):
    try:
        while True:
            data = await reader.read(65536)
            if not data:
                break
            writer.write(data)
            await writer.drain()
    except (asyncio.CancelledError, ConnectionError, BrokenPipeError, OSError):
        pass
    finally:
        try:
            writer.close()
        except Exception:
            pass


async def _handle(client_r, client_w):
    try:
        # SOCKS5 greeting: VER(1) NMETHODS(1) METHODS(n)
        greeting = await asyncio.wait_for(client_r.read(257), timeout=10)
        if not greeting or greeting[0] != 5:
            return
        client_w.write(b'\x05\x00')   # accept, no-auth
        await client_w.drain()

        # SOCKS5 request: VER CMD RSV ATYP ...
        req = await asyncio.wait_for(client_r.read(4), timeout=10)
        if len(req) < 4 or req[0] != 5 or req[1] != 1:  # only CONNECT
            client_w.write(b'\x05\x07\x00\x01\x00\x00\x00\x00\x00\x00')
            await client_w.drain()
            return

        atyp = req[3]
        if atyp == 1:      # IPv4
            raw = await asyncio.wait_for(client_r.read(4), timeout=10)
            host = '.'.join(str(b) for b in raw)
        elif atyp == 3:    # domain name
            n = (await asyncio.wait_for(client_r.read(1), timeout=10))[0]
            host = (await asyncio.wait_for(client_r.read(n), timeout=10)).decode()
        elif atyp == 4:    # IPv6
            import socket
            raw = await asyncio.wait_for(client_r.read(16), timeout=10)
            host = socket.inet_ntop(socket.AF_INET6, raw)
        else:
            client_w.write(b'\x05\x08\x00\x01\x00\x00\x00\x00\x00\x00')
            await client_w.drain()
            return

        port = struct.unpack('>H', await asyncio.wait_for(client_r.read(2), timeout=10))[0]

        # Open connection using Python's network stack → Thai IP (bypasses browser VPN)
        try:
            remote_r, remote_w = await asyncio.wait_for(
                asyncio.open_connection(host, port), timeout=30
            )
        except Exception:
            client_w.write(b'\x05\x05\x00\x01\x00\x00\x00\x00\x00\x00')
            await client_w.drain()
            return

        # Success — relay bytes in both directions
        client_w.write(b'\x05\x00\x00\x01\x00\x00\x00\x00\x00\x00')
        await client_w.drain()

        await asyncio.gather(
            _relay(client_r, remote_w),
            _relay(remote_r, client_w),
        )

    except Exception:
        pass
    finally:
        try:
            client_w.close()
        except Exception:
            pass


async def start(host='127.0.0.1', port=0):
    """Start the proxy. Returns (server, port). port=0 lets OS pick a free port."""
    server = await asyncio.start_server(_handle, host, port)
    actual_port = server.sockets[0].getsockname()[1]
    return server, actual_port
