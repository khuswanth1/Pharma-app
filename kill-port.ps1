# kill-port.ps1 - Kill process on a specific port and optionally restart a service

param(
    [int]$Port = 8085,
    [switch]$RestartPayment
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PORT KILLER & SERVICE RESTARTER       " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find PID using the port
Write-Host "Looking for process on port $Port..." -ForegroundColor Gray

# Use Get-NetTCPConnection (more reliable than parsing netstat text)
$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

if (-not $connections) {
    Write-Host "No process found listening on port $Port." -ForegroundColor Green
} else {
    foreach ($conn in $connections) {
        $processId = $conn.OwningProcess
        if ($processId -and $processId -gt 0) {
            Write-Host "Found process PID: $processId on port $Port" -ForegroundColor Yellow
            try {
                $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "Process name: $($proc.ProcessName)" -ForegroundColor Gray
                }
                Stop-Process -Id $processId -Force -ErrorAction Stop
                Write-Host "Successfully killed PID $processId" -ForegroundColor Green
            } catch {
                Write-Host "Failed to kill PID $processId : $_" -ForegroundColor Red
                # Fallback: try taskkill
                Write-Host "Trying taskkill as fallback..." -ForegroundColor DarkYellow
                taskkill /F /PID $processId 2>$null
                Write-Host "Taskkill attempted for PID $processId" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host ""
Write-Host "Port $Port is now free." -ForegroundColor Green

if ($RestartPayment) {
    Write-Host ""
    Write-Host "Starting Payment Service on port $Port..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    Start-Process powershell -WorkingDirectory $PSScriptRoot -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='Payment Service'; .\mvnw spring-boot:run -pl payment-service"
    Write-Host "Payment Service launched in a new window!" -ForegroundColor Green
}
