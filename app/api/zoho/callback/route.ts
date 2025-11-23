import { NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  api_domain?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

/**
 * OAuth callback handler for Zoho
 * GET /api/zoho/callback?code=...
 * 
 * Exchanges authorization code for refresh token and stores it
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Handle OAuth errors
    if (error) {
      return NextResponse.json(
        {
          error: "Authorization failed",
          errorDescription: errorDescription || error,
        },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const redirectUri = process.env.ZOHO_REDIRECT_URI || `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/zoho/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: "Zoho OAuth credentials not configured",
          message: "Please set ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET in your .env file",
        },
        { status: 500 }
      );
    }

    // Exchange authorization code for tokens
    const tokenUrl = "https://accounts.zoho.com/oauth/v2/token";
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code,
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
      return NextResponse.json(
        {
          error: "Failed to exchange authorization code",
          errorDescription: data.error_description || data.error || "Unknown error",
          details: data,
        },
        { status: response.status || 500 }
      );
    }

    if (!data.refresh_token) {
      return NextResponse.json(
        {
          error: "No refresh token received",
          message: "The authorization may have been revoked or the code expired. Please try again.",
          details: data,
        },
        { status: 400 }
      );
    }

    // Store tokens (we'll provide instructions for .env, but also return the values)
    const tokens = {
      refreshToken: data.refresh_token,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };

    // Try to update .env file if it exists
    let envUpdated = false;
    try {
      const envPath = join(process.cwd(), ".env");
      if (existsSync(envPath)) {
        let envContent = await readFile(envPath, "utf-8");
        
        // Update or add ZOHO_REFRESH_TOKEN
        if (envContent.includes("ZOHO_REFRESH_TOKEN=")) {
          envContent = envContent.replace(
            /ZOHO_REFRESH_TOKEN=.*/g,
            `ZOHO_REFRESH_TOKEN="${data.refresh_token}"`
          );
        } else {
          // Add it if it doesn't exist
          envContent += `\n# Zoho Mail Configuration\nZOHO_REFRESH_TOKEN="${data.refresh_token}"\n`;
        }
        
        await writeFile(envPath, envContent, "utf-8");
        envUpdated = true;
      }
    } catch (envError) {
      // If we can't write to .env, that's okay - we'll just return the token
      console.warn("Could not update .env file:", envError);
    }

    // Return HTML response for better user experience
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zoho OAuth Success</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .success {
      color: #4CAF50;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .code-block {
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      margin: 15px 0;
      word-break: break-all;
    }
    .steps {
      margin-top: 20px;
    }
    .steps ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .steps li {
      margin: 8px 0;
    }
    .warning {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 15px;
      margin: 15px 0;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success">✅ Zoho OAuth Authorization Successful!</div>
    
    <p>Your refresh token has been obtained successfully.</p>
    
    ${envUpdated ? (
      `<div class="warning">
        <strong>✓ .env file updated automatically!</strong><br>
        The refresh token has been saved to your .env file.
      </div>`
    ) : (
      `<div class="warning">
        <strong>⚠️ Manual configuration required</strong><br>
        Add this to your .env file:
        <div class="code-block">ZOHO_REFRESH_TOKEN="${data.refresh_token}"</div>
      </div>`
    )}
    
    <div class="steps">
      <h3>Next Steps:</h3>
      <ol>
        ${!envUpdated ? '<li>Add ZOHO_REFRESH_TOKEN to your .env file (see above)</li>' : ''}
        <li>Restart your application</li>
        <li>Run <code>npm run zoho:get-account-id</code> to get your Account ID</li>
        <li>Add ZOHO_ACCOUNT_ID and ZOHO_FROM_ADDRESS to your .env file</li>
      </ol>
    </div>
    
    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      You can close this window. The refresh token is valid until revoked.
    </p>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Zoho OAuth callback error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

