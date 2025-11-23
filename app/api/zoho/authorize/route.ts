import { NextResponse } from "next/server";

/**
 * Generate Zoho OAuth authorization URL
 * GET /api/zoho/authorize
 */
export async function GET() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const redirectUri = process.env.ZOHO_REDIRECT_URI || `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/zoho/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: "ZOHO_CLIENT_ID is not configured. Please set it in your .env file." },
      { status: 400 }
    );
  }

  const scopes = "ZohoMail.messages.ALL,ZohoMail.accounts.READ";
  const authUrl = new URL("https://accounts.zoho.com/oauth/v2/auth");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("redirect_uri", redirectUri);

  return NextResponse.json({
    authorizationUrl: authUrl.toString(),
    redirectUri,
    message: "Visit the authorizationUrl to authorize the application",
  });
}

