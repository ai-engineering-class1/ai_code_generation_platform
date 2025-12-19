#!/bin/bash
# Script to help create and test Jira webhooks via command line
# Note: Jira Cloud doesn't have a public API for creating webhooks,
# but this script helps with testing and provides the exact URL to use

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Jira Webhook Setup Helper"
echo "=========================================="
echo ""

# Get inputs
read -p "Enter your Jira URL (e.g., https://your-domain.atlassian.net): " JIRA_URL
read -p "Enter your Jira email: " JIRA_EMAIL
read -sp "Enter your Jira API token: " JIRA_TOKEN
echo ""
read -p "Enter your webhook URL (e.g., https://abc123.ngrok.io/api/v1/jira/webhook): " WEBHOOK_URL
read -p "Enter Jira project key (optional, for testing): " PROJECT_KEY

echo ""
echo "=========================================="
echo "Testing Webhook Endpoint"
echo "=========================================="

# Test webhook endpoint
echo "Testing webhook endpoint: $WEBHOOK_URL"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$WEBHOOK_URL")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Webhook endpoint is accessible${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Webhook endpoint returned: $HTTP_CODE${NC}"
    echo "Response: $BODY"
fi

echo ""
echo "=========================================="
echo "Testing Jira API Connection"
echo "=========================================="

# Test Jira API connection
AUTH=$(echo -n "$JIRA_EMAIL:$JIRA_TOKEN" | base64)
TEST_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X GET \
    -H "Authorization: Basic $AUTH" \
    -H "Accept: application/json" \
    "$JIRA_URL/rest/api/3/myself")

TEST_HTTP_CODE=$(echo "$TEST_RESPONSE" | tail -n1)
TEST_BODY=$(echo "$TEST_RESPONSE" | sed '$d')

if [ "$TEST_HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Jira API connection successful${NC}"
    USER_NAME=$(echo "$TEST_BODY" | grep -o '"displayName":"[^"]*' | cut -d'"' -f4)
    echo "Connected as: $USER_NAME"
else
    echo -e "${RED}✗ Jira API connection failed: $TEST_HTTP_CODE${NC}"
    echo "Response: $TEST_BODY"
fi

echo ""
echo "=========================================="
echo "Webhook Configuration for Jira UI"
echo "=========================================="
echo ""
echo "Since Jira Cloud doesn't have a public API for creating webhooks,"
echo "you need to create it manually in the Jira UI:"
echo ""
echo "1. Go to: $JIRA_URL/plugins/servlet/webhooks"
echo "   OR"
echo "   Go to your project → Project Settings → Webhooks"
echo ""
echo "2. Click 'Create a webhook' or 'Add webhook'"
echo ""
echo "3. Use these settings:"
echo "   Name: AI Code Platform Webhook"
echo "   URL: $WEBHOOK_URL"
echo "   Status: Enabled"
echo "   Events:"
echo "     ✓ Issue created"
echo "     ✓ Issue updated"
echo "     ✓ Issue deleted"
echo ""
echo "4. Click 'Create' or 'Save'"
echo ""
echo "=========================================="
echo "Testing Webhook (after creation)"
echo "=========================================="
echo ""
echo "After creating the webhook in Jira, test it with:"
echo ""
echo "curl -X POST '$WEBHOOK_URL' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"webhookEvent\":\"jira:issue_created\",\"issue\":{\"key\":\"TEST-1\"}}'"
echo ""

