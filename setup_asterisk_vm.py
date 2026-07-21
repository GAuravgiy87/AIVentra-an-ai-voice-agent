import paramiko
import os
import sys

HOST = "10.7.11.134"
USER = "core"
PASS = "test"

def run_cmd(ssh, cmd):
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(f"STDOUT: {out}")
    if err:
        print(f"STDERR: {err}")
    return out, err

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(HOST, username=USER, password=PASS, timeout=10)
        print("Connected successfully!")
        
        # Check OS
        run_cmd(ssh, "uname -a")
        run_cmd(ssh, "cat /etc/os-release")
        
        # Check Docker
        run_cmd(ssh, "docker --version")
        
        ssh.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()
