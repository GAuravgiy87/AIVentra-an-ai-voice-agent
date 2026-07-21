import paramiko
import time

HOST = "10.7.11.134"
USER = "core"
PASS = "test"

def run_cmd(ssh, cmd):
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    # Wait for command to finish
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    
    if out:
        print(f"STDOUT: {out}")
    if err:
        print(f"STDERR: {err}")
    return exit_status, out, err

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(HOST, username=USER, password=PASS, timeout=10)
        print("Connected successfully!")
        
        # 1. Create directory
        run_cmd(ssh, "mkdir -p ~/asterisk_config")
        
        # 2. Write pjsip.conf
        pjsip = """[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:5060

[transport-tcp]
type=transport
protocol=tcp
bind=0.0.0.0:5060
"""
        sftp = ssh.open_sftp()
        with sftp.file('asterisk_config/pjsip.conf', 'w') as f:
            f.write(pjsip)
            
        # 3. Write empty files to avoid crash
        empty_files = ['extensions.conf', 'rtp.conf', 'pjsip_custom.conf', 'extensions_custom.conf']
        for file in empty_files:
            with sftp.file(f'asterisk_config/{file}', 'w') as f:
                f.write('')
        sftp.close()
        
        # 4. Stop existing container if any
        run_cmd(ssh, f"echo '{PASS}' | sudo -S docker rm -f vantara-asterisk")
        
        # 5. Run Asterisk container
        run_cmd(ssh, f"echo '{PASS}' | sudo -S docker pull andrius/asterisk:latest")
        
        run_asterisk = (
            f"echo '{PASS}' | sudo -S docker run -d --name vantara-asterisk --restart always --net host "
            "-v ~/asterisk_config/pjsip.conf:/etc/asterisk/pjsip.conf "
            "-v ~/asterisk_config/pjsip_custom.conf:/etc/asterisk/pjsip_custom.conf "
            "-v ~/asterisk_config/extensions.conf:/etc/asterisk/extensions.conf "
            "-v ~/asterisk_config/extensions_custom.conf:/etc/asterisk/extensions_custom.conf "
            "-v ~/asterisk_config/rtp.conf:/etc/asterisk/rtp.conf "
            "andrius/asterisk:latest"
        )
        
        exit_status, out, err = run_cmd(ssh, run_asterisk)
        if exit_status == 0:
            print("Asterisk container deployed successfully!")
        else:
            print("Failed to deploy Asterisk.")
        
        # 6. Verify it's running
        run_cmd(ssh, f"echo '{PASS}' | sudo -S docker ps | grep vantara-asterisk")
        
        ssh.close()
    except Exception as e:
        print(f"Connection/Deployment failed: {e}")

if __name__ == "__main__":
    main()
