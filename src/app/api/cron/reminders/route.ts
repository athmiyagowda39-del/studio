import { NextResponse } from 'next/server';
import { getLeads } from '@/actions/leads';
import { getUsers } from '@/actions/users';
import { sendEmail } from '@/lib/email';
import { isSameDay, parseISO } from 'date-fns';

export async function GET() {
    try {
        const [leads, users] = await Promise.all([getLeads(), getUsers()]);
        const today = new Date();
        let emailsSentCount = 0;

        const dueLeads = leads.filter(lead => {
            if (!lead.nextFollowUpDate) return false;
            try {
                // The date might be in different formats, so we need robust parsing.
                // Assuming ISO string or a format that `new Date()` can handle.
                const dueDate = new Date(lead.nextFollowUpDate);
                return isSameDay(dueDate, today);
            } catch (e) {
                console.error(`Invalid date format for lead ${lead.leadId}: ${lead.nextFollowUpDate}`);
                return false;
            }
        });

        if (dueLeads.length === 0) {
            return NextResponse.json({ message: 'No follow-up reminders to send today.' });
        }
        
        const userMap = new Map(users.map(user => [user.username, user]));

        for (const lead of dueLeads) {
            if (!lead.executive) {
                console.log(`Lead ${lead.leadId} has a due follow-up but no assigned executive. Skipping.`);
                continue;
            }
            
            const executive = userMap.get(lead.executive);
            if (!executive || !executive.email) {
                console.log(`Executive '${lead.executive}' for lead ${lead.leadId} not found or has no email. Skipping.`);
                continue;
            }

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const leadUrl = `${appUrl}/leads-update`;

            const emailHtml = `
                <h1>Follow-up Reminder</h1>
                <p>Hi ${executive.username},</p>
                <p>This is a reminder that you have a follow-up scheduled for today for the following lead:</p>
                <ul>
                    <li><strong>Lead ID:</strong> ${lead.leadId}</li>
                    <li><strong>Company:</strong> ${lead.company}</li>
                    <li><strong>Contact Person:</strong> ${lead.contactPerson}</li>
                    <li><strong>Contact Number:</strong> ${lead.contactNumber}</li>
                </ul>
                <p>You can view and update the lead here:</p>
                <a href="${leadUrl}">Update Lead</a>
                <p>Thank you,</p>
                <p>Sales Lead Tracker Bot</p>
            `;

            try {
                await sendEmail({
                    to: executive.email,
                    subject: `Follow-up Reminder: ${lead.company}`,
                    html: emailHtml,
                });
                emailsSentCount++;
            } catch (error) {
                console.error(`Failed to send reminder for lead ${lead.leadId} to ${executive.email}:`, error);
                // Continue to the next lead even if one email fails
            }
        }

        return NextResponse.json({
            message: `Reminder process completed. Sent ${emailsSentCount} emails.`,
            totalDueLeads: dueLeads.length,
        });

    } catch (error) {
        console.error('CRON JOB FAILED: /api/cron/reminders', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
