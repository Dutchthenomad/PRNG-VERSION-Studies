# Start-Collector.ps1
# PowerShell script to start the enhanced PRNG data collector

# Display banner
Write-Host ""
Write-Host "🎮 RUGS.FUN ENHANCED DATA COLLECTOR" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 16+" -ForegroundColor Red
    exit 1
}

# Check for required files
if (-not (Test-Path "enhanced_persistent_collector.js")) {
    Write-Host "❌ Enhanced collector script not found" -ForegroundColor Red
    exit 1
}

# Parse command line arguments
param(
    [int]$target = 10000,
    [switch]$verbose = $false,
    [switch]$test = $false
)

# If test mode is enabled, override target
if ($test) {
    $target = 3
    $verbose = $true
    Write-Host "🧪 TEST MODE: Will collect 3 games with verbose output" -ForegroundColor Yellow
}

# Build command
$command = "node enhanced_persistent_collector.js --target $target"
if ($verbose) {
    $command += " --verbose"
}

# Display startup info
Write-Host ""
Write-Host "📊 Collection Settings:" -ForegroundColor Cyan
Write-Host "- Target games: $target"
Write-Host "- Verbose mode: $($verbose -eq $true ? 'Enabled' : 'Disabled')"
Write-Host "- Output directory: rugs-data/"
Write-Host ""
Write-Host "💡 Press Ctrl+C to stop collection gracefully" -ForegroundColor Yellow
Write-Host ""

# Start the collector
Write-Host "🚀 Starting enhanced collector..." -ForegroundColor Green
Write-Host ""
Invoke-Expression $command
