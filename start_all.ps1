Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎙️  Starting Ventra AI Voice Agent Suite 🎙️" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Stop any running python/node instances of our suite to avoid port binding conflicts
Write-Host "Stopping any running Python/Node background services..." -ForegroundColor Yellow
Stop-Process -Name python -ErrorAction SilentlyContinue
Stop-Process -Name node -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Step 1. Wait for Livekit server to become fully active and listen
Write-Host "[1/5] Checking if LiveKit server is listening on port 7890..." -ForegroundColor Yellow
$retries = 0
$ready = $false
while ($retries -lt 15 -and -not $ready) {
    $conn = Test-NetConnection -ComputerName 127.0.0.1 -Port 7890 -WarningAction SilentlyContinue -InformationAction SilentlyContinue
    if ($conn.TcpTestSucceeded) {
        $ready = $true
    } else {
        $retries++
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Host "Error: LiveKit server is not running or port 7890 is not listening." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] LiveKit server is online and listening!" -ForegroundColor Green

# Step 2. Initialize SIP Gateway rules in LiveKit
Write-Host "[2/5] Initializing SIP Gateway (setup_sip.py)..." -ForegroundColor Yellow
python backend/setup_sip.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: SIP setup failed." -ForegroundColor Red
    exit 1
}

# Step 3. Start UDP RTP Media Relay & Forwarder in new windows
Write-Host "[3/7] Launching UDP RTP Media Relay (udp_relay.py)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", '$Host.UI.RawUI.WindowTitle=\"AI Voice Agent - UDP RTP Relay\"; Write-Host \"Starting UDP RTP Relay (v3 Auto-Learning)...\"; python udp_relay.py'

Write-Host "[4/7] Launching UDP Media Forwarder (udp_forward.py)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", '$Host.UI.RawUI.WindowTitle=\"AI Voice Agent - UDP Forwarder\"; Write-Host \"Starting UDP Forwarder...\"; python udp_forward.py'

# Step 5. Start Agent Worker in a new window
Write-Host "[5/7] Launching Agent Worker..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", '$Host.UI.RawUI.WindowTitle=\"AI Voice Agent - Worker\"; Write-Host \"Starting Agent Worker...\"; cd backend; python livekit_agent.py dev --url ws://127.0.0.1:7890'

# Step 6. Start Web Backend API in a new window
Write-Host "[6/7] Launching Web Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", '$Host.UI.RawUI.WindowTitle=\"AI Voice Agent - Backend API\"; Write-Host \"Starting FastAPI Backend...\"; cd backend; python main.py'

# Step 7. Start Dashboard Frontend in a new window
Write-Host "[7/7] Launching Dashboard Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", '$Host.UI.RawUI.WindowTitle=\"AI Voice Agent - Frontend Dashboard\"; Write-Host \"Starting React Frontend...\"; cd frontend; npm run dev'

Write-Host "`n🚀 All AI Voice Agent System services (including UDP RTP Relay) launched successfully!" -ForegroundColor Green
Write-Host "Please check the newly opened PowerShell windows to monitor logs, audio relays, and calls." -ForegroundColor Green
