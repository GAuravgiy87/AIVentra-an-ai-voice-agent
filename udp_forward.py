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

def forward(port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.bind(('0.0.0.0', port))
        print(f"Forwarding 0.0.0.0:{port} <-> {WSL_IP}:{port}", flush=True)
        
        last_external_addr = None
        
        while True:
            data, addr = sock.recvfrom(4096)
            if addr[0] != WSL_IP:
                # Packet from mobile phone/external device
                last_external_addr = addr
                sock.sendto(data, (WSL_IP, port))
                print(f"[{port}] {addr} -> WSL", flush=True)
            else:
                # Return packet from WSL/Asterisk
                if last_external_addr:
                    sock.sendto(data, last_external_addr)
                    print(f"[{port}] WSL -> {last_external_addr}", flush=True)
    except Exception as e:
        print(f"Failed to bind port {port}: {e}")

for p in range(20000, 20006):
    threading.Thread(target=forward, args=(p,), daemon=True).start()

try:
    while True:
        time.sleep(86400)
except KeyboardInterrupt:
    print("Stopping forwarder.")
