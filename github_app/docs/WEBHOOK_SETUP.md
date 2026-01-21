# GitHub Webhook Setup Guide

This guide explains how to set up the GitHub webhook for your GitHub App to receive events from GitHub.

## 1. Configure the Webhook Secret in GitHub App Settings

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Navigate to "GitHub Apps" 
3. Click on your app "code-generation-platform"
4. Scroll down to the "Webhook" section
5. In the "Webhook URL" field, enter: `https://your-domain.com/webhook` (replace with your actual domain)
   - For local testing, you can use a tool like [ngrok](https://ngrok.com/) to create a public URL
6. Click "Generate a new secret" in the "Webhook secret" field
7. Copy the generated secret

## 2. Update Environment Variables

In your `.env` file, replace `your_webhook_secret_here` with the secret you generated:

```env
GITHUB_WEBHOOK_SECRET=your_actual_secret_here
```

## 3. Testing Webhook Locally

To test the webhook locally, you can use ngrok:

1. Install ngrok: `npm install -g ngrok` or download from [ngrok.com](https://ngrok.com/)
2. Start your application: `npm run dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abcd-1234-efgh.ngrok.io`)
5. Update your GitHub App settings with webhook URL: `https://abcd-1234-efgh.ngrok.io/webhook`
6. Use the same webhook secret as configured in your `.env` file

## 4. Webhook Endpoint

The application exposes a webhook endpoint at `/webhook` which handles various GitHub events:
- `installation` events (when someone installs your GitHub App)
- `installation_repositories` events (when repositories are added/removed from installation)
- `push` events (when code is pushed to repositories)
- `pull_request` events (when pull requests are opened, closed, etc.)

## 5. Verification

The webhook endpoint validates the signature using the `GITHUB_WEBHOOK_SECRET` to ensure requests are genuinely from GitHub.

## 6. Security Notes

- Keep your webhook secret secure and never commit it to version control
- The webhook endpoint validates the signature to prevent unauthorized access
- In production, ensure proper logging and monitoring of webhook events