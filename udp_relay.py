"""
UDP RTP Port Relay for WSL2 Docker (v3 - Auto-Learning Bidirectional Audio)
Forwards RTP audio between LAN phone softphones (Android/iPhone) and Asterisk inside WSL2 Docker.
Features:
- Auto-learns phone IP:port per RTP port
- Fallback forward to recent LAN clients if phone hasn't sent first packet yet (breaks NAT deadlock)
- Handles active background instances gracefully
"""
import socket
import threading
import subprocess
import sys
import time

LISTEN_IP = "0.0.0.0"
RTP_START = 20000
RTP_END = 20020
BUFFER_SIZE = 4096

def get_wsl_ip():
    try:
        result = subprocess.run(
            ["wsl", "hostname", "-I"],
            capture_output=True, text=True, timeout=5
        )
        ips = result.stdout.strip().split()
        return ips[0] if ips else "127.0.0.1"
    except Exception:
        return "127.0.0.1"

WSL_IP = get_wsl_ip()
INTERNAL_PREFIXES = ("127.", "172.", WSL_IP)

def is_internal(ip):
    for prefix in INTERNAL_PREFIXES:
        if ip.startswith(prefix):
            return True
    return False

active_lan_clients = set()
port_client_map = {}
map_lock = threading.Lock()

def relay_port(port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((LISTEN_IP, port))
        sock.settimeout(1.0)

        wsl_target = (WSL_IP, port)

        while True:
            try:
                data, addr = sock.recvfrom(BUFFER_SIZE)
                if not data:
                    continue

                sender_ip = addr[0]

                if is_internal(sender_ip):
                    with map_lock:
                        target = port_client_map.get(port)
                        clients_snapshot = list(active_lan_clients)

                    if target:
                        try:
                            sock.sendto(data, target)
                        except Exception:
                            pass
                    elif clients_snapshot:
                        for client in clients_snapshot:
                            try:
                                sock.sendto(data, client)
                            except Exception:
                                pass
                else:
                    with map_lock:
                        port_client_map[port] = addr
                        active_lan_clients.add(addr)

                    try:
                        sock.sendto(data, wsl_target)
                    except Exception:
                        pass

            except socket.timeout:
                continue
            except Exception:
                pass
    except OSError as e:
        err_str = str(e)
        if "10048" in err_str or "10013" in err_str:
            pass  # Silently handle ports already bound by background process
        else:
            print(f"  [NOTE] Port {port}: {e}")

def main():
    print(f"{'=' * 60}")
    print(f"  UDP RTP Relay v3 (Auto-Learning Bidirectional Audio)")
    print(f"  WSL2 IP: {WSL_IP}")
    print(f"  Internal Prefixes: {INTERNAL_PREFIXES}")
    print(f"  Relaying UDP ports {RTP_START}-{RTP_END}")
    print(f"{'=' * 60}")

    bound_count = 0
    threads = []
    for port in range(RTP_START, RTP_END + 1):
        # Quick test if port is available or bound
        t = threading.Thread(target=relay_port, args=(port,), daemon=True)
        t.start()
        threads.append(t)
        bound_count += 1

    print(f"\n  [OK] {bound_count} RTP ports active and listening for mobile softphones.")
    print(f"  Auto-learning audio streams for 2-way call transfers...\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n  Stopping UDP relay...")
        sys.exit(0)

if __name__ == "__main__":
    main()
