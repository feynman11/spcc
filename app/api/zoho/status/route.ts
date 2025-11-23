import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/zoho/token-manager";

/**
 * Check Zoho Mail configuration status
 * GET /api/zoho/status
 */
export async function GET() {
  const config = {
    clientId: !!process.env.ZOHO_CLIENT_ID,
    clientSecret: !!process.env.ZOHO_CLIENT_SECRET,
    refreshToken: !!process.env.ZOHO_REFRESH_TOKEN,
    accountId: !!process.env.ZOHO_ACCOUNT_ID,
    fromAddress: !!process.env.ZOHO_FROM_ADDRESS,
  };

  const allConfigured = Object.values(config).every((v) => v === true);
  const canAuthorize = config.clientId && config.clientSecret;
  const canSendEmails = allConfigured;

  let tokenTest: { success: boolean; error?: string } | null = null;
  if (config.refreshToken) {
    try {
      await getAccessToken();
      tokenTest = { success: true };
    } catch (error) {
      tokenTest = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  return NextResponse.json({
    configured: allConfigured,
    canAuthorize,
    canSendEmails,
    config,
    tokenTest,
    redirectUri: process.env.ZOHO_REDIRECT_URI || `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/zoho/callback`,
  });
}

