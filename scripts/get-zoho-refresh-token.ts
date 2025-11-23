#!/usr/bin/env node
/**
 * Script to obtain Zoho OAuth Refresh Token
 * 
 * This script helps you exchange an authorization code for a refresh token.
 * 
 * Usage:
 *   bun run scripts/get-zoho-refresh-token.ts
 * 
 * You'll need:
 *   1. Client ID from Zoho Developer Console
 *   2. Client Secret from Zoho Developer Console
 *   3. Authorization code from the OAuth authorization flow
 *   4. Redirect URI (must match what you used in the authorization URL)
 */

import * as readline from "readline";

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  api_domain?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function getRefreshToken(): Promise<void> {
  try {
    console.log("Zoho OAuth Refresh Token Generator\n");
    console.log("=".repeat(80));
    console.log("\nThis script will help you exchange an authorization code for a refresh token.");
    console.log("\nPrerequisites:");
    console.log("  1. Client ID from Zoho Developer Console");
    console.log("  2. Client Secret from Zoho Developer Console");
    console.log("  3. Authorization code from the OAuth flow");
    console.log("  4. Redirect URI (must match the one used in authorization)\n");

    // Get user input
    const clientId = await askQuestion("Enter your Client ID: ");
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    const clientSecret = await askQuestion("Enter your Client Secret: ");
    if (!clientSecret) {
      throw new Error("Client Secret is required");
    }

    const authCode = await askQuestion("Enter the authorization code: ");
    if (!authCode) {
      throw new Error("Authorization code is required");
    }

    const redirectUri =
      (await askQuestion("Enter redirect URI (default: http://localhost:3000): ")) ||
      "http://localhost:3000";

    console.log("\nExchanging authorization code for tokens...\n");

    // Exchange authorization code for tokens
    const tokenUrl = "https://accounts.zoho.com/oauth/v2/token";

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: authCode,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data: TokenResponse = await response.json();

    if (!response.ok || data.error) {
      throw new Error(
        data.error_description || data.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    if (!data.refresh_token) {
      throw new Error("No refresh token in response. The authorization code may have expired.");
    }

    // Display results
    console.log("=".repeat(80));
    console.log("\n✅ Success! Tokens received:\n");
    console.log("Access Token (expires in 1 hour):");
    console.log(`  ${data.access_token}`);
    console.log("\nRefresh Token (long-lived - save this!):");
    console.log(`  ${data.refresh_token}`);
    console.log("\n" + "=".repeat(80));
    console.log("\n📝 Add this to your .env file:\n");
    console.log(`ZOHO_CLIENT_ID="${clientId}"`);
    console.log(`ZOHO_CLIENT_SECRET="${clientSecret}"`);
    console.log(`ZOHO_REFRESH_TOKEN="${data.refresh_token}"`);
    console.log("\n⚠️  Important:");
    console.log("  - The refresh token is long-lived and can be used to get new access tokens");
    console.log("  - Store it securely and never commit it to version control");
    console.log("  - If you lose it, you'll need to go through the OAuth flow again");
    console.log("\nNext steps:");
    console.log("  1. Add the above variables to your .env file");
    console.log("  2. Run: npm run zoho:get-account-id");
    console.log("  3. Add ZOHO_ACCOUNT_ID and ZOHO_FROM_ADDRESS to your .env file");
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : error);
    console.error("\nTroubleshooting:");
    if (error instanceof Error) {
      if (error.message.includes("invalid_code") || error.message.includes("expired")) {
        console.error("  - The authorization code may have expired (they expire quickly)");
        console.error("  - Get a new authorization code and try again");
        console.error("  - Make sure you're using the code immediately after receiving it");
      } else if (error.message.includes("invalid_client")) {
        console.error("  - Check that your Client ID and Client Secret are correct");
        console.error("  - Verify there are no extra spaces or characters");
      } else if (error.message.includes("redirect_uri")) {
        console.error("  - The redirect URI must exactly match what you used in the authorization URL");
        console.error("  - Check for trailing slashes, http vs https, etc.");
      }
    }
    console.error("\nFor detailed setup instructions, see: docs/ZOHO_SETUP.md");
    process.exit(1);
  }
}

// Run the script
getRefreshToken().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});

