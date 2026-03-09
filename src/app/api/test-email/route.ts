import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET() {
  try {
    await sendEmail({
      to: "raghu.pavan@peopleworks.in",
      subject: "SMTP Test Email",
      html: `
        <h2>SMTP Working ✅</h2>
        <p>This is a dummy email sent from Sales Lead Tracker.</p>
      `,
    });

    return NextResponse.json({
      message: "Dummy email sent successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Email failed" },
      { status: 500 }
    );
  }
}