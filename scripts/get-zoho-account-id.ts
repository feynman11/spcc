#!/usr/bin/env node
/**
 * Script to retrieve Zoho Mail Account ID
 * 
 * This script uses the Zoho Mail API to fetch all accounts associated with
 * the authenticated user and displays their account IDs.
 * 
 * Usage:
 *   bun run scripts/get-zoho-account-id.ts
 *   or
 *   node scripts/get-zoho-account-id.ts
 * 
 * Requires environment variables:
 *   - ZOHO_CLIENT_ID
 *   - ZOHO_CLIENT_SECRET
 *   - ZOHO_REFRESH_TOKEN
 */

import { getAccessToken } from "../lib/zoho/token-manager";

interface AccountData {
  accountId: string;
  accountDisplayName: string;
  incomingUserName: string;
  sequence: number;
  accountName: string;
  enabled: boolean;
}

interface AccountsResponse {
  status: {
    code: number;
    description: string;
  };
  data: AccountData[];
}

async function getAccountId(): Promise<void> {
  try {
    console.log("Fetching Zoho Mail account information...\n");

    // Get access token (this may log token refresh messages)
    const accessToken = await getAccessToken();

    // Make API request to get all accounts
    const apiUrl = "https://mail.zoho.com/api/accounts";

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Zoho-oauthtoken ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch accounts: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    const data: AccountsResponse = await response.json();

    if (data.status.code !== 200) {
      throw new Error(`API returned error: ${data.status.description}`);
    }

    if (!data.data || data.data.length === 0) {
      console.log("No accounts found.");
      return;
    }

    // Display account information
    console.log("Zoho Mail Accounts:\n");
    console.log("=".repeat(80));

    data.data.forEach((account, index) => {
      console.log(`\nAccount ${index + 1}:`);
      console.log(`  Account ID:        ${account.accountId}`);
      console.log(`  Display Name:      ${account.accountDisplayName}`);
      console.log(`  Email Address:     ${account.incomingUserName}`);
      console.log(`  Account Name:      ${account.accountName}`);
      console.log(`  Enabled:           ${account.enabled ? "Yes" : "No"}`);
      console.log(`  Sequence:          ${account.sequence}`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("\nTo use an account ID in your .env file, set:");
    console.log(`ZOHO_ACCOUNT_ID="${data.data[0].accountId}"`);

    if (data.data.length > 1) {
      console.log("\nNote: Multiple accounts found. Use the Account ID for the account");
      console.log("you want to send emails from.");
    }
  } catch (error) {
    console.error("\nError retrieving account ID:", error);
    if (error instanceof Error) {
      console.error("\nTroubleshooting:");
      if (error.message.includes("Missing Zoho OAuth credentials")) {
        console.error("  - Ensure ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN are set in your .env file");
        console.error("  - Make sure you're running this script from the project root where .env is located");
      } else if (error.message.includes("Failed to refresh")) {
        console.error("  - Check that your ZOHO_REFRESH_TOKEN is valid and not expired");
        console.error("  - You may need to re-authenticate to get a new refresh token");
        console.error("  - See: https://www.zoho.com/mail/help/api/using-oauth-2.html");
      } else if (error.message.includes("Failed to fetch accounts")) {
        console.error("  - Verify your OAuth token has the ZohoMail.accounts.READ scope");
        console.error("  - Check that your Zoho account has access to the Mail API");
        console.error("  - Ensure your OAuth application is registered as a Server-Based Application");
      }
    }
    process.exit(1);
  }
}

// Run the script
getAccountId().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});

