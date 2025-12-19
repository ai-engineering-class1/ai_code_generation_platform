# PowerShell script to help create and test Jira webhooks via command line
# Note: Jira Cloud doesn't have a public API for creating webhooks,
# but this script helps with testing and provides the exact URL to use

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Jira Webhook Setup Helper" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Get inputs
$JIRA_URL = Read-Host "Enter your Jira URL (e.g., https://your-domain.atlassian.net)"
$JIRA_EMAIL = Read-Host "Enter your Jira email"
$JIRA_TOKEN = Read-Host "Enter your Jira API token" -AsSecureString
$JIRA_TOKEN_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($JIRA_TOKEN)
)
$WEBHOOK_URL = Read-Host "Enter your webhook URL (e.g., https://abc123.ngrok.io/api/v1/jira/webhook)"
$PROJECT_KEY = Read-Host "Enter Jira project key (optional, for testing)"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing Webhook Endpoint" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Test webhook endpoint
Write-Host "Testing webhook endpoint: $WEBHOOK_URL"
try {
    $response = Invoke-WebRequest -Uri $WEBHOOK_URL -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Webhook endpoint is accessible" -ForegroundColor Green
        Write-Host "Response: $($response.Content)"
    }
} catch {
    Write-Host "✗ Webhook endpoint error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing Jira API Connection" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Test Jira API connection
$credentials = "$JIRA_EMAIL:$JIRA_TOKEN_PLAIN"
$encodedCredentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($credentials))

$headers = @{
    "Authorization" = "Basic $encodedCredentials"
    "Accept" = "application/json"
}

try {
    $testResponse = Invoke-RestMethod -Uri "$JIRA_URL/rest/api/3/myself" -Method GET -Headers $headers
    Write-Host "✓ Jira API connection successful" -ForegroundColor Green
    Write-Host "Connected as: $($testResponse.displayName) ($($testResponse.emailAddress))"
} catch {
    Write-Host "✗ Jira API connection failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Webhook Configuration for Jira UI" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Since Jira Cloud doesn't have a public API for creating webhooks," -ForegroundColor Yellow
Write-Host "you need to create it manually in the Jira UI:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: $JIRA_URL/plugins/servlet/webhooks" -ForegroundColor White
Write-Host "   OR" -ForegroundColor White
Write-Host "   Go to your project → Project Settings → Webhooks" -ForegroundColor White
Write-Host ""
Write-Host "2. Click 'Create a webhook' or 'Add webhook'" -ForegroundColor White
Write-Host ""
Write-Host "3. Use these settings:" -ForegroundColor White
Write-Host "   Name: AI Code Platform Webhook" -ForegroundColor White
Write-Host "   URL: $WEBHOOK_URL" -ForegroundColor White
Write-Host "   Status: Enabled" -ForegroundColor White
Write-Host "   Events:" -ForegroundColor White
Write-Host "     ✓ Issue created" -ForegroundColor White
Write-Host "     ✓ Issue updated" -ForegroundColor White
Write-Host "     ✓ Issue deleted" -ForegroundColor White
Write-Host ""
Write-Host "4. Click 'Create' or 'Save'" -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing Webhook (after creation)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After creating the webhook in Jira, test it with:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Invoke-WebRequest -Uri '$WEBHOOK_URL' -Method POST -ContentType 'application/json' -Body '{\"webhookEvent\":\"jira:issue_created\",\"issue\":{\"key\":\"TEST-1\"}}'" -ForegroundColor Gray
Write-Host ""

# Clean up secure string
$JIRA_TOKEN_PLAIN = $null

