/**
 * Zoho OAuth 2.0 Token Manager
 * 
 * Handles access token lifecycle including automatic refresh when tokens expire.
 * Uses environment variables for OAuth credentials and refresh token storage.
 */

interface TokenResponse {
  access_token: string;
  expires_in: number;
  api_domain?: string;
  token_type?: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

// In-memory cache for access token (refreshed automatically when expired)
let tokenCache: CachedToken | null = null;

/**
 * Get a valid access token, refreshing if necessary
 * @returns Promise<string> - Valid access token
 */
export async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
    // Token is still valid (with 1 minute buffer)
    return tokenCache.accessToken;
  }

  // Token expired or doesn't exist, refresh it
  return await refreshAccessToken();
}

/**
 * Refresh the access token using the refresh token
 * @returns Promise<string> - New access token
 */
async function refreshAccessToken(): Promise<string> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Zoho OAuth credentials. Please set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN environment variables."
    );
  }

  const tokenUrl = "https://accounts.zoho.com/oauth/v2/token";

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "ZohoMail.messages.ALL,ZohoMail.accounts.READ",
  });

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to refresh Zoho access token: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data: TokenResponse = await response.json();

    if (!data.access_token) {
      throw new Error("Invalid token response: missing access_token");
    }

    // Cache the token with expiration time
    const expiresIn = data.expires_in || 3600; // Default to 1 hour if not provided
    tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + expiresIn * 1000, // Convert seconds to milliseconds
    };

    console.log("[Zoho] Access token refreshed successfully");
    return data.access_token;
  } catch (error) {
    console.error("[Zoho] Error refreshing access token:", error);
    throw error;
  }
}

/**
 * Clear the cached access token (useful for testing or forced refresh)
 */
export function clearTokenCache(): void {
  tokenCache = null;
}

