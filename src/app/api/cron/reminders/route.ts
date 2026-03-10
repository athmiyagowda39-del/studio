import { NextResponse } from "next/server";
import { getLeads } from "@/lib/server-actions/leads";
import { getUsers } from "@/lib/server-actions/users";
import { sendEmail } from "@/lib/email";
import { isSameDay, parseISO } from "date-fns";

export async function GET() {
  try {
    const [leads, users] = await Promise.all([getLeads(), getUsers()]);
    const today = new Date();
    let emailsSentCount = 0;

    console.log("CRON STARTED", today);

    const dueLeads = leads.filter((lead) => {
      if (!lead.nextFollowUpDate) return false;

      try {
        const dueDate = parseISO(lead.nextFollowUpDate);
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
      console.log("No follow-up reminders today");
      return NextResponse.json({
        message: "No follow-up reminders to send today",
      });
    }

    const userMap = new Map(users.map((user) => [user.username, user]));

    for (const lead of dueLeads) {
      if (!lead.executive) {
        console.log(`Lead ${lead.leadId} has no executive`);
        continue;
      }

      const executive = userMap.get(lead.executive);

      if (!executive?.email) {
        console.log(
          `Executive ${lead.executive} not found or missing email`
        );
        continue;
      }

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const leadUrl = `${appUrl}/leads-update`;

      const emailHtml = `
        <h2>Follow-up Reminder</h2>
        <p>Hello <b>${executive.username}</b>,</p>

        <p>You have a follow-up scheduled for today.</p>

        <table border="1" cellpadding="8">
          <tr>
            <td><b>Lead ID</b></td>
            <td>${lead.leadId}</td>
          </tr>
          <tr>
            <td><b>Company</b></td>
            <td>${lead.company}</td>
          </tr>
          <tr>
            <td><b>Contact Person</b></td>
            <td>${lead.contactPerson}</td>
          </tr>
          <tr>
            <td><b>Phone</b></td>
            <td>${lead.contactNumber}</td>
          </tr>
        </table>

        <br/>

        <a href="${leadUrl}"
           style="padding:10px 16px;background:#2563eb;color:white;text-decoration:none;border-radius:6px">
           Update Lead
        </a>

        <p style="margin-top:20px">Sales Lead Tracker</p>
      `;

      try {
        console.log(`Sending email to ${executive.email}`);

        await sendEmail({
          to: executive.email,
          subject: `Follow-up Reminder - ${lead.company}`,
          html: emailHtml,
        });

        emailsSentCount++;
      } catch (error) {
        console.error(
          `Email failed for Lead ${lead.leadId}`,
          error
        );
      }
    }

    console.log("CRON COMPLETED");

    return NextResponse.json({
      message: `Reminder process completed`,
      emailsSent: emailsSentCount,
      totalDueLeads: dueLeads.length,
    });
  } catch (error) {
    console.error("CRON JOB FAILED /api/cron/reminders", error);

    return new NextResponse("Internal Server Error", {
      status: 500,
    });
  }
}