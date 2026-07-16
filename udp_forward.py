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

def forward_tcp(port):
    def handle_client(client_sock):
        try:
            remote_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            remote_sock.connect(('127.0.0.1', port))
            
            def pipe(src, dst):
                try:
                    while True:
                        data = src.recv(4096)
                        if not data:
                            break
                        dst.sendall(data)
                except Exception:
                    pass
                finally:
                    src.close()
                    dst.close()
            
            threading.Thread(target=pipe, args=(client_sock, remote_sock), daemon=True).start()
            threading.Thread(target=pipe, args=(remote_sock, client_sock), daemon=True).start()
        except Exception as e:
            print(f"[TCP {port}] Forwarding error: {e}")
            client_sock.close()

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind(('0.0.0.0', port))
        server.listen(100)
        print(f"Forwarding TCP 0.0.0.0:{port} <-> 127.0.0.1:{port}", flush=True)
        while True:
            client, addr = server.accept()
            threading.Thread(target=handle_client, args=(client,), daemon=True).start()
    except Exception as e:
        print(f"Failed to bind TCP port {port}: {e}")

for p in range(20000, 20006):
    threading.Thread(target=forward, args=(p,), daemon=True).start()

# Forward TCP port 5061 for SIP signaling
threading.Thread(target=forward_tcp, args=(5061,), daemon=True).start()

try:
    while True:
        time.sleep(86400)
except KeyboardInterrupt:
    print("Stopping forwarder.")
