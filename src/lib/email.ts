import nodemailer from 'nodemailer';

type MailOptions = {
    to: string;
    cc?: string;
    from?: string;
    subject: string;
    html: string;
    wfDataDataID?: string;
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // TLS 1.2+ is the default in modern Node.js, providing the security 
    // requested in the reference code (SecurityProtocolType 3072).
    tls: {
        rejectUnauthorized: true 
    }
});

/**
 * Sends an email notification using logic referenced from C# SendNotification implementation.
 * Handles recipients, CC, sender overrides, and standardized logging.
 */
export async function sendEmail({ to, cc, from, subject, html, wfDataDataID }: MailOptions) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP environment variables not set. Email not sent.');
        return;
    }

    // Skip processing if subject is empty, matching C# logic
    if (!subject) {
        console.warn('PWNotification Warning: Subject is empty. Email not sent.');
        return;
    }

    const mailOptions: any = {
        from: from || `Sales Lead Tracker <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
    };

    if (cc) {
        mailOptions.cc = cc;
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        
        // Standardized Success Logging (matching C# reference pattern)
        console.log(`PWNotification Success:  torecipients  : ${to} ccrecipients : ${cc || ''} subject      : ${subject} wfDataDataID : ${wfDataDataID || ''}`);
        
        return info;
    } catch (error: any) {
        // Standardized Error Logging (matching C# reference pattern)
        console.error(`PWNotification Failed:  torecipients  : ${to} ccrecipients : ${cc || ''} subject      : ${subject} wfDataDataID : ${wfDataDataID || ''}`);
        console.error('Message: ' + (error.message || String(error)));
        console.error('Stacktrace: ' + (error.stack || 'No stacktrace available'));
        
        throw new Error('Failed to send email: ' + (error.message || String(error)));
    }
}
