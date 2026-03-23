import nodemailer from 'nodemailer';

type MailOptions = {
    to: string;
    subject: string;
    html: string;
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
});

export async function sendEmail({ to, subject, html }: MailOptions) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP environment variables not set. Email not sent.');
        return;
    }

    const mailOptions = {
        from: `Sales Lead Tracker <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email: ' + (error instanceof Error ? error.message : String(error)));
    }
}
