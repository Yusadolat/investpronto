import { SendMailClient } from "zeptomail";

const url = "api.zeptomail.com/";
const token = process.env.ZEPTOMAIL_TOKEN || "";

const client = new SendMailClient({ url, token });

interface SendEmailOptions {
  to: { address: string; name?: string };
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export async function sendEmail({ to, subject, htmlBody, textBody }: SendEmailOptions) {
  if (!token) {
    console.warn("[Email] ZEPTOMAIL_TOKEN not set — skipping email send to:", to.address);
    return { success: false, reason: "no_token" };
  }

  try {
    const response = await client.sendMail({
      from: {
        address: process.env.ZEPTOMAIL_FROM_EMAIL || "noreply@investpronto.com",
        name: "InvestPronto",
      },
      to: [
        {
          email_address: {
            address: to.address,
            name: to.name || to.address.split("@")[0],
          },
        },
      ],
      subject,
      htmlbody: htmlBody,
      textbody: textBody || subject,
      track_clicks: true,
      track_opens: true,
    });

    console.log("[Email] Sent successfully to:", to.address);
    return { success: true, response };
  } catch (error) {
    console.error("[Email] Failed to send to:", to.address, error);
    return { success: false, error };
  }
}
