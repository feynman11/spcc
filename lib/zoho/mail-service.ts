/**
 * Zoho Mail Service
 * 
 * Wrapper for Zoho Mail API to send emails using OAuth 2.0 authentication.
 */

import { getAccessToken } from "./token-manager";

export interface SendEmailOptions {
  fromAddress: string;
  toAddress: string;
  ccAddress?: string;
  bccAddress?: string;
  subject: string;
  content: string;
  mailFormat?: "html" | "plaintext";
  askReceipt?: "yes" | "no";
  encoding?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using Zoho Mail API
 * @param accountId - Zoho Mail account ID
 * @param options - Email options
 * @returns Promise<SendEmailResponse>
 */
export async function sendEmail(
  accountId: string,
  options: SendEmailOptions
): Promise<SendEmailResponse> {
  // Get valid access token
  const accessToken = await getAccessToken();

  const apiUrl = `https://mail.zoho.com/api/accounts/${accountId}/messages`;

  // Prepare request body
  const body: Record<string, string> = {
    fromAddress: options.fromAddress,
    toAddress: options.toAddress,
    subject: options.subject || "",
    content: options.content || "",
    mailFormat: options.mailFormat || "html",
    askReceipt: options.askReceipt || "no",
    encoding: options.encoding || "UTF-8",
  };

  // Add optional fields
  if (options.ccAddress) {
    body.ccAddress = options.ccAddress;
  }
  if (options.bccAddress) {
    body.bccAddress = options.bccAddress;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Zoho-oauthtoken ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Zoho Mail API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        // If parsing fails, use the raw error text
        errorMessage = errorText || errorMessage;
      }

      console.error("[Zoho Mail] Failed to send email:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }

    const responseData = await response.json();
    
    // Zoho Mail API may return different response formats
    // Check for common success indicators
    if (responseData.data?.messageId || responseData.messageId || response.status === 200) {
      console.log("[Zoho Mail] Email sent successfully");
      return {
        success: true,
        messageId: responseData.data?.messageId || responseData.messageId,
      };
    }

    return {
      success: true,
      messageId: responseData.data?.messageId || responseData.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Zoho Mail] Exception while sending email:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send email to multiple recipients (using BCC for privacy)
 * @param accountId - Zoho Mail account ID
 * @param fromAddress - Sender email address
 * @param toAddresses - Array of recipient email addresses
 * @param subject - Email subject
 * @param content - Email content (HTML or plaintext)
 * @param mailFormat - Email format (html or plaintext)
 * @returns Promise<SendEmailResponse>
 */
export async function sendEmailToMultiple(
  accountId: string,
  fromAddress: string,
  toAddresses: string[],
  subject: string,
  content: string,
  mailFormat: "html" | "plaintext" = "html"
): Promise<SendEmailResponse> {
  if (toAddresses.length === 0) {
    return {
      success: false,
      error: "No recipients provided",
    };
  }

  // Use first recipient as "to" and rest as BCC
  const toAddress = toAddresses[0];
  const bccAddress = toAddresses.length > 1 ? toAddresses.slice(1).join(",") : undefined;

  return sendEmail(accountId, {
    fromAddress,
    toAddress,
    bccAddress,
    subject,
    content,
    mailFormat,
  });
}

