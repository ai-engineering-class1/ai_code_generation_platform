# PowerShell script to help create and manage GitHub webhooks
# This is a simplified version - use create_github_webhook.py for full functionality

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "GitHub Webhook Setup Helper" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: For full functionality, use create_github_webhook.py" -ForegroundColor Yellow
Write-Host "This PowerShell script provides basic webhook URL testing." -ForegroundColor Yellow
Write-Host ""

# Get inputs
$GITHUB_TOKEN = Read-Host "Enter your GitHub Personal Access Token" -AsSecureString
$GITHUB_TOKEN_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($GITHUB_TOKEN)
)

$REPO = Read-Host "Enter repository (format: owner/repo, e.g., lee-liao/ai_agent_exercises)"
$WEBHOOK_URL = Read-Host "Enter your webhook URL (e.g., https://abc123.ngrok.io/api/v1/github/webhook)"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing Webhook Endpoint" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Test webhook endpoint
Write-Host "Testing webhook endpoint: $WEBHOOK_URL"
try {
    $response = Invoke-WebRequest -Uri $WEBHOOK_URL -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Webhook endpoint is accessible" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 405) {
        Write-Host "✓ Webhook endpoint is accessible (405 is expected for GET)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Webhook endpoint returned: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing GitHub API Connection" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Test GitHub API
$headers = @{
    "Authorization" = "token $GITHUB_TOKEN_PLAIN"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers -Method Get
    Write-Host "✓ GitHub API connection successful" -ForegroundColor Green
    Write-Host "Connected as: $($response.login) ($($response.name))" -ForegroundColor Green
} catch {
    Write-Host "✗ GitHub API connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Webhook Configuration Instructions" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To create or manage webhooks, use the Python script:" -ForegroundColor Yellow
Write-Host "  python create_github_webhook.py" -ForegroundColor White
Write-Host ""
Write-Host "Or manually in GitHub:" -ForegroundColor Yellow
Write-Host "1. Go to: https://github.com/$REPO/settings/hooks" -ForegroundColor White
Write-Host "2. Click 'Add webhook'" -ForegroundColor White
Write-Host "3. Configure:" -ForegroundColor White
Write-Host "   - Payload URL: $WEBHOOK_URL" -ForegroundColor White
Write-Host "   - Content type: application/json" -ForegroundColor White
Write-Host "   - Events: pull_request, workflow_run, push" -ForegroundColor White
Write-Host "4. Click 'Add webhook'" -ForegroundColor White
Write-Host ""
