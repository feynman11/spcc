# Zoho Mail API Setup Guide

This guide walks you through setting up Zoho Mail API integration to enable email notifications to admins when new members sign up.

## Prerequisites

- A Zoho account with Zoho Mail access
- Access to Zoho Developer Console

## Quick Setup (Automatic OAuth Flow)

The application can handle OAuth authorization automatically:

1. Set `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET` in your `.env` file
2. Visit `http://localhost:3000/api/zoho/authorize` (or your app URL) to get the authorization URL
3. Click the authorization URL to authorize the application
4. You'll be redirected back and the refresh token will be automatically saved to your `.env` file
5. Restart your application

Alternatively, you can check the setup status at `/api/zoho/status`.

## Manual Setup

If you prefer to set up manually, follow these steps:

## Step 1: Register Your Application

1. Go to [Zoho Developer Console](https://accounts.zoho.com/developerconsole)
2. Click **"GET STARTED"** or **"Add Client"**
3. Choose **"Server-Based Applications"** (this is important for server-side email sending)
4. Fill in the application details:
   - **Client Name**: e.g., "SPCC Email Notifications"
   - **Homepage URL**: Your application URL (e.g., `https://yourdomain.com`)
   - **Authorized Redirect URIs**: 
     - For local development: `http://localhost:3000/api/zoho/callback`
     - For production: `https://yourdomain.com/api/zoho/callback`
     - Or set `ZOHO_REDIRECT_URI` in your `.env` file to match your configuration
5. Click **"CREATE"**
6. **Save the Client ID and Client Secret** - you'll need these for your `.env` file

## Step 2: Get Authorization Code

1. Construct the authorization URL with your Client ID:

```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoMail.messages.ALL,ZohoMail.accounts.READ&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=http://localhost:3000
```

Replace `YOUR_CLIENT_ID` with the Client ID from Step 1.

2. Open this URL in your browser
3. Log in to your Zoho account if prompted
4. Authorize the application
5. You'll be redirected to your redirect URI with an authorization code in the URL:
   ```
   http://localhost:3000?code=1000.xxxxx.xxxxx
   ```
6. **Copy the code value** (everything after `code=`)

## Step 3: Exchange Authorization Code for Refresh Token

Use one of the following methods to exchange the authorization code for tokens:

### Method A: Using cURL

```bash
curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=http://localhost:3000" \
  -d "code=AUTHORIZATION_CODE_FROM_STEP_2"
```

Replace:
- `YOUR_CLIENT_ID` with your Client ID
- `YOUR_CLIENT_SECRET` with your Client Secret
- `AUTHORIZATION_CODE_FROM_STEP_2` with the code you copied

### Method B: Using the Provided Script

We've created a helper script to make this easier:

```bash
bun run scripts/get-zoho-refresh-token.ts
```

This script will prompt you for:
- Client ID
- Client Secret
- Authorization Code
- Redirect URI

### Method C: Manual Browser Request

1. Open your browser's developer console (F12)
2. Go to the Network tab
3. Use the following JavaScript in the console:

```javascript
fetch('https://accounts.zoho.com/oauth/v2/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: 'YOUR_CLIENT_ID',
    client_secret: 'YOUR_CLIENT_SECRET',
    redirect_uri: 'http://localhost:3000',
    code: 'AUTHORIZATION_CODE_FROM_STEP_2'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## Step 4: Extract the Refresh Token

The response from Step 3 will look like this:

```json
{
  "access_token": "1000.xxxxx.xxxxx",
  "refresh_token": "1000.xxxxx.xxxxx",
  "expires_in": 3600,
  "api_domain": "https://www.zohoapis.com",
  "token_type": "Bearer"
}
```

**Important**: Save the `refresh_token` value - this is what you'll use as `ZOHO_REFRESH_TOKEN` in your `.env` file.

**Note**: The `access_token` expires after 1 hour, but the `refresh_token` is long-lived and can be used to get new access tokens automatically.

## Step 5: Get Your Account ID

Once you have the refresh token, you can get your Zoho Mail Account ID:

```bash
npm run zoho:get-account-id
# or
bun run scripts/get-zoho-account-id.ts
```

This will display all your Zoho Mail accounts and their Account IDs. Use the Account ID for the account you want to send emails from.

## Step 6: Configure Environment Variables

Add the following to your `.env` file:

```env
# Zoho Mail Configuration
ZOHO_CLIENT_ID="your-client-id-from-step-1"
ZOHO_CLIENT_SECRET="your-client-secret-from-step-1"
ZOHO_REFRESH_TOKEN="your-refresh-token-from-step-4"
ZOHO_ACCOUNT_ID="your-account-id-from-step-5"
ZOHO_FROM_ADDRESS="noreply@yourdomain.com"
```

**Important Notes:**
- `ZOHO_FROM_ADDRESS` must be an email address associated with your Zoho Mail account
- The email address must match the account you're using to send emails
- All values should be in quotes

## Step 7: Test the Integration

1. Start your application
2. Create a new member (or trigger the member creation flow)
3. Check the application logs - you should see a message indicating the email was sent
4. Check the admin email inboxes for the notification

## Troubleshooting

### "Invalid refresh token" error
- The refresh token may have expired or been revoked
- You need to repeat Steps 2-4 to get a new refresh token
- Make sure you're using the `refresh_token` value, not the `access_token`

### "Invalid client" error
- Verify your Client ID and Client Secret are correct
- Make sure there are no extra spaces or quotes in your `.env` file

### "Access denied" or scope errors
- Ensure your OAuth application has the correct scopes:
  - `ZohoMail.messages.ALL` (or `ZohoMail.messages.CREATE`)
  - `ZohoMail.accounts.READ`
- Re-authorize the application if you changed scopes

### "Account not found" error
- Verify your `ZOHO_ACCOUNT_ID` is correct
- Run the `get-zoho-account-id.ts` script again to get the correct ID
- Make sure the account is enabled in your Zoho Mail settings

### Email not sending
- Check that `ZOHO_FROM_ADDRESS` matches an email address in your Zoho Mail account
- Verify all environment variables are set correctly
- Check application logs for detailed error messages
- Ensure your Zoho Mail account has permission to send emails

## Security Best Practices

1. **Never commit your `.env` file** to version control
2. **Store secrets securely** in production (use a secrets manager)
3. **Rotate refresh tokens** periodically if possible
4. **Use environment-specific values** for different deployment environments
5. **Restrict OAuth application scopes** to only what's needed

## Additional Resources

- [Zoho Mail API Documentation](https://www.zoho.com/mail/help/api/)
- [Zoho OAuth 2.0 Guide](https://www.zoho.com/mail/help/api/using-oauth-2.html)
- [Zoho Developer Console](https://accounts.zoho.com/developerconsole)

