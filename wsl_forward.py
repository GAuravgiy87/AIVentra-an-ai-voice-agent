import socket
import threading
import sys
import time

import subprocess

def get_asterisk_ip():
    try:
        out = subprocess.check_output(
            ["docker", "inspect", "-f", "{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}", "voiceagent-asterisk-1"],
            text=True
        )
        ip = out.strip()
        if ip:
            return ip
    except Exception as e:
        print(f"Error resolving Asterisk IP: {e}")
    return '172.20.0.2'  # fallback

ASTERISK_IP = get_asterisk_ip()
print(f"Resolved Asterisk IP: {ASTERISK_IP}", flush=True)

def forward(port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.bind(('0.0.0.0', port))
        print(f"WSL Forwarding 0.0.0.0:{port} <-> {ASTERISK_IP}:{port}", flush=True)
        
        last_windows_addr = None
        
        while True:
            data, addr = sock.recvfrom(4096)
            if addr[0] != ASTERISK_IP:
                # Packet from Windows Proxy
                last_windows_addr = addr
                dest_port = 5060 if port == 5061 else port
                sock.sendto(data, (ASTERISK_IP, dest_port))
            else:
                # Return packet from Asterisk
                if last_windows_addr:
                    sock.sendto(data, last_windows_addr)
    except Exception as e:
        print(f"Failed to bind port {port}: {e}")

for p in range(20000, 20021):
    threading.Thread(target=forward, args=(p,), daemon=True).start()

# Forward UDP port 5061 for SIP signaling
threading.Thread(target=forward, args=(5061,), daemon=True).start()

try:
    while True:
        time.sleep(86400)
except KeyboardInterrupt:
    print("Stopping WSL forwarder.")
