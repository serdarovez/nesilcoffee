#!/usr/bin/env python3
"""SOCKS5 ProxyCommand relay for ssh(1) on Windows.

Windows OpenSSH has no built-in SOCKS support, so it cannot use Happ/Xray's
local proxy on its own. ssh runs this as its ProxyCommand: it opens a SOCKS5
CONNECT through the proxy to the real target, then pipes ssh's stdin/stdout to
that socket. Python's sys.stdin.buffer / sys.stdout.buffer are true binary
streams, which is why this works where a PowerShell console relay does not.

Usage (via ~/.ssh/config):
    ProxyCommand python C:/Users/Seri/Desktop/nesilcoffee/deploy/socks-proxy.py %h %p
"""
import socket
import struct
import sys
import threading

PROXY_HOST = "127.0.0.1"
PROXY_PORT = 10808  # Happ/Xray SOCKS5


def recvn(sock, n):
    """Read exactly n bytes — never one more, so the SSH banner that may arrive
    in the same segment as the SOCKS reply is left untouched for the pump."""
    buf = b""
    while len(buf) < n:
        chunk = sock.recv(n - len(buf))
        if not chunk:
            raise EOFError("proxy closed during handshake")
        buf += chunk
    return buf


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: socks-proxy.py <host> <port>")
    host, port = sys.argv[1], int(sys.argv[2])

    s = socket.create_connection((PROXY_HOST, PROXY_PORT), timeout=20)
    s.settimeout(None)

    # Greeting: version 5, one method, "no authentication".
    s.sendall(b"\x05\x01\x00")
    if recvn(s, 2)[1] != 0x00:
        sys.exit("socks-proxy: proxy rejected no-auth")

    # CONNECT. Send a domain name literally so the proxy resolves it at its
    # exit; only pack an IPv4 literal when the target already is one.
    port_bytes = struct.pack(">H", port)
    try:
        req = b"\x05\x01\x00\x01" + socket.inet_aton(host) + port_bytes
    except OSError:
        name = host.encode("idna")
        req = b"\x05\x01\x00\x03" + bytes([len(name)]) + name + port_bytes
    s.sendall(req)

    header = recvn(s, 4)
    if header[1] != 0x00:
        sys.exit(f"socks-proxy: CONNECT failed (code {header[1]})")
    # Drain the bound address exactly, by type, so we stop at the payload start.
    atyp = header[3]
    if atyp == 0x01:
        recvn(s, 4 + 2)
    elif atyp == 0x04:
        recvn(s, 16 + 2)
    elif atyp == 0x03:
        recvn(s, recvn(s, 1)[0] + 2)

    # Tunnel is open. Pump both directions until either end closes.
    stdin, stdout = sys.stdin.buffer, sys.stdout.buffer

    def upstream():
        try:
            while True:
                # read1, not read: BufferedReader.read(n) blocks until it has
                # the full n bytes, which deadlocks on SSH's short handshake
                # messages. read1 returns whatever is available after one read.
                data = stdin.read1(65536)
                if not data:
                    break
                s.sendall(data)
        except OSError:
            pass
        finally:
            try:
                s.shutdown(socket.SHUT_WR)
            except OSError:
                pass

    t = threading.Thread(target=upstream, daemon=True)
    t.start()
    try:
        while True:
            data = s.recv(65536)
            if not data:
                break
            stdout.write(data)
            stdout.flush()
    except OSError:
        pass


if __name__ == "__main__":
    import os

    try:
        main()
    except (KeyboardInterrupt, OSError):
        # A dropped tunnel or Ctrl+C is normal teardown, not an error worth a
        # traceback.
        pass
    finally:
        # Skip interpreter finalization: the daemon reader thread may be
        # blocked in stdin.read1(), and a normal shutdown then crashes with
        # "_enter_buffered_busy … at interpreter shutdown". os._exit exits
        # immediately without that cleanup, so ssh just sees the pipe close.
        os._exit(0)
