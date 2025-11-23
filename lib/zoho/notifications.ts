/**
 * Zoho Mail Notifications
 * 
 * Functions to send email notifications to admins for various events.
 */

import { prisma } from "@/lib/prisma";
import { sendEmailToMultiple } from "./mail-service";

export interface MemberSignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  membershipType: string;
  joinDate: Date;
}

/**
 * Send email notification to admins when a new member signs up
 * @param memberData - Member information
 * @returns Promise<void> - Does not throw, logs errors instead
 */
export async function notifyAdminsOfNewMember(
  memberData: MemberSignupData
): Promise<void> {
  // Check if Zoho Mail is configured
  const accountId = process.env.ZOHO_ACCOUNT_ID;
  const fromAddress = process.env.ZOHO_FROM_ADDRESS;

  if (!accountId || !fromAddress) {
    console.warn(
      "[Zoho Notifications] Zoho Mail not configured. Skipping admin notification. " +
      "Set ZOHO_ACCOUNT_ID and ZOHO_FROM_ADDRESS to enable email notifications."
    );
    return;
  }

  try {
    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: "admin",
      },
      select: {
        email: true,
      },
    });

    if (adminUsers.length === 0) {
      console.warn("[Zoho Notifications] No admin users found. Skipping notification.");
      return;
    }

    const adminEmails = adminUsers.map((user) => user.email).filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      console.warn("[Zoho Notifications] No admin emails found. Skipping notification.");
      return;
    }

    // Format membership type for display
    const membershipTypeDisplay = memberData.membershipType
      .charAt(0)
      .toUpperCase() + memberData.membershipType.slice(1);

    // Format join date
    const joinDateFormatted = new Date(memberData.joinDate).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Create email content
    const subject = `New Member Signup: ${memberData.firstName} ${memberData.lastName}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4CAF50;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 5px 5px;
    }
    .info-row {
      margin: 10px 0;
      padding: 10px;
      background-color: white;
      border-left: 3px solid #4CAF50;
    }
    .label {
      font-weight: bold;
      color: #555;
    }
    .value {
      color: #333;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Member Signup</h2>
    </div>
    <div class="content">
      <p>A new member has completed their signup:</p>
      
      <div class="info-row">
        <div class="label">Name:</div>
        <div class="value">${memberData.firstName} ${memberData.lastName}</div>
      </div>
      
      <div class="info-row">
        <div class="label">Email:</div>
        <div class="value">${memberData.email}</div>
      </div>
      
      <div class="info-row">
        <div class="label">Membership Type:</div>
        <div class="value">${membershipTypeDisplay}</div>
      </div>
      
      ${memberData.phone ? `
      <div class="info-row">
        <div class="label">Phone:</div>
        <div class="value">${memberData.phone}</div>
      </div>
      ` : ""}
      
      <div class="info-row">
        <div class="label">Join Date:</div>
        <div class="value">${joinDateFormatted}</div>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send email to all admins
    const result = await sendEmailToMultiple(
      accountId,
      fromAddress,
      adminEmails,
      subject,
      htmlContent,
      "html"
    );

    if (result.success) {
      console.log(
        `[Zoho Notifications] Successfully sent new member notification to ${adminEmails.length} admin(s)`
      );
    } else {
      console.error(
        `[Zoho Notifications] Failed to send new member notification: ${result.error}`
      );
    }
  } catch (error) {
    // Log error but don't throw - member creation should succeed even if email fails
    console.error("[Zoho Notifications] Error sending admin notification:", error);
  }
}

