import { NextResponse } from "next/server";
import { getLeads } from "@/lib/server-actions/leads";
import { getUsers } from "@/lib/server-actions/users";
import { sendEmail } from "@/lib/email";
import { isSameDay, parseISO, startOfDay } from "date-fns";

export async function GET() {
  try {
    const [leads, users] = await Promise.all([getLeads(), getUsers()]);
    const today = startOfDay(new Date());
    let emailsSentCount = 0;
    const skipReasons: string[] = [];

    console.log("CRON STARTED", today.toISOString());

    // Filter leads due for today
    const dueLeads = leads.filter((lead) => {
      if (!lead.nextFollowUpDate) return false;

      try {
        const dueDate = startOfDay(parseISO(lead.nextFollowUpDate));
        return isSameDay(dueDate, today);
      } catch (err) {
        console.error(
          `Invalid date for Lead ${lead.leadId}:`,
          lead.nextFollowUpDate
        );
        return false;
      }
    });

    if (!dueLeads.length) {
      return NextResponse.json({
        message: "No follow-up reminders to send today",
        totalDueLeads: 0,
      });
    }

    // Create a robust user map (trimmed and lowercase for matching)
    const userMap = new Map(
      users.map((user) => [user.username.trim().toLowerCase(), user])
    );

    for (const lead of dueLeads) {
      const executiveNameRaw = lead.executive?.trim().toLowerCase();

      if (!executiveNameRaw) {
        skipReasons.push(`Lead ${lead.leadId}: No executive assigned`);
        continue;
      }

      const executive = userMap.get(executiveNameRaw);

      if (!executive) {
        skipReasons.push(`Lead ${lead.leadId}: Executive '${lead.executive}' not found in system`);
        continue;
      }

      if (!executive.email) {
        skipReasons.push(`Lead ${lead.leadId}: Executive '${executive.username}' has no email address`);
        continue;
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const leadUrl = `${appUrl}/leads-update`;

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Follow-up Reminder</h2>
          </div>
          <div style="padding: 24px; color: #1e293b;">
            <p>Hello <b>${executive.username}</b>,</p>
            <p>You have a lead follow-up scheduled for today.</p>
            
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <table width="100%" cellpadding="5">
                <tr><td width="35%"><b>Lead ID</b></td><td>${lead.leadId}</td></tr>
                <tr><td><b>Company</b></td><td>${lead.company}</td></tr>
                <tr><td><b>Contact</b></td><td>${lead.contactPerson}</td></tr>
                <tr><td><b>Phone</b></td><td>${lead.contactNumber}</td></tr>
              </table>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${leadUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Lead Details
              </a>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b;">
            Sales Lead Tracker &copy; ${new Date().getFullYear()}
          </div>
        </div>
      `;

      try {
        await sendEmail({
          to: executive.email,
          subject: `Reminder: Follow-up with ${lead.company} (ID: ${lead.leadId})`,
          html: emailHtml,
        });
        emailsSentCount++;
      } catch (error) {
        console.error(`Email failed for Lead ${lead.leadId}:`, error);
        skipReasons.push(`Lead ${lead.leadId}: SMTP failure`);
      }
    }

    console.log(`CRON COMPLETED. Sent: ${emailsSentCount}, Skipped: ${skipReasons.length}`);

    return NextResponse.json({
      message: "Reminder process completed",
      emailsSent: emailsSentCount,
      totalDueLeads: dueLeads.length,
      skippedDetails: skipReasons.length > 0 ? skipReasons : undefined
    });
  } catch (error) {
    console.error("CRON JOB FAILED /api/cron/reminders", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}