import socket
import threading
import sys
import time

import subprocess

def get_wsl_ip():
    try:
        out = subprocess.check_output("wsl hostname -I", shell=True, text=True)
        ips = out.strip().split()
        if ips:
            return ips[0]
    except Exception as e:
        print(f"Error resolving WSL IP: {e}")
    return '172.24.169.55'  # fallback

WSL_IP = get_wsl_ip()
print(f"Resolved WSL IP: {WSL_IP}", flush=True)

def get_lan_ip():
    try:
        hostname = socket.gethostname()
        ips = socket.gethostbyname_ex(hostname)[2]
        for ip in ips:
            if ip.startswith("10.7.11."):
                return ip
        for ip in ips:
            if ip.startswith("10.7."):
                return ip
        # Fallback
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '0.0.0.0'

LAN_IP = get_lan_ip()
print(f"Resolved Windows LAN IP: {LAN_IP}", flush=True)

def forward(port):
    try:
        # Main socket bound to port for receiving external phone traffic
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.bind(('0.0.0.0', port))
        
        # Track client sockets to support multiple concurrent devices (e.g. MicroSIP and Mobile Phone)
        client_sockets = {}
        client_sockets_lock = threading.Lock()
        
        print(f"Forwarding 0.0.0.0:{port} <-> {WSL_IP}:{port}", flush=True)
        
        while True:
            try:
                data, addr = sock.recvfrom(4096)
                if port == 5061:
                    print(f"[UDP 5061] Received {len(data)} bytes from {addr}", flush=True)
                is_wsl = (
                    addr[0] == WSL_IP or 
                    addr[0].startswith('172.')
                )
                if not is_wsl:
                    with client_sockets_lock:
                        if addr not in client_sockets:
                            client_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                            client_sock.bind(('0.0.0.0', 0))
                            
                            def receive_from_asterisk(c_sock, c_addr):
                                while True:
                                    try:
                                        resp_data, resp_addr = c_sock.recvfrom(4096)
                                        sock.sendto(resp_data, c_addr)
                                    except Exception:
                                        break
                                        
                            threading.Thread(target=receive_from_asterisk, args=(client_sock, addr), daemon=True).start()
                            client_sockets[addr] = client_sock
                        
                        target_sock = client_sockets[addr]
                    
                    target_sock.sendto(data, (WSL_IP, port))
            except ConnectionResetError:
                # Windows throws WinError 10054 on UDP socket if previous send failed. Ignore it.
                continue
            except Exception as e:
                print(f"[Port {port}] Error in receive loop: {e}", flush=True)
                continue
    except Exception as e:
        print(f"Failed to bind port {port}: {e}")

print(f"Forwarding TCP is now handled natively by Docker", flush=True)

for p in range(20000, 20021):
    threading.Thread(target=forward, args=(p,), daemon=True).start()

for p in range(50000, 50051):
    threading.Thread(target=forward, args=(p,), daemon=True).start()

# Forward UDP port 5061 for SIP signaling
threading.Thread(target=forward, args=(5061,), daemon=True).start()


try:
    while True:
        time.sleep(86400)
except KeyboardInterrupt:
    print("Stopping forwarder.")
