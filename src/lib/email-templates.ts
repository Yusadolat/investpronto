const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

function layout(content: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>InvestPronto</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:32px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:rgba(255,255,255,0.2);border-radius:10px;padding:8px;vertical-align:middle;">
                    <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTMgOWwxMi02IDkgNi05IDYtMTItNnoiLz48cGF0aCBkPSJNMjEgOXY2YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yVjloMTgiLz48L3N2Zz4=" alt="" width="20" height="20" style="display:block;" />
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">InvestPronto</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
                This is an automated message from InvestPronto.
              </p>
              <p style="margin:0;font-size:12px;color:#cbd5e1;">
                If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

interface InvestorInviteData {
  recipientName?: string;
  hostelName: string;
  inviterName: string;
  token: string;
  amountInvested: string;
  percentageShare: string;
  agreementType: string;
}

export function investorInvitationEmail(data: InvestorInviteData) {
  const inviteUrl = `${baseUrl}/invite?token=${data.token}`;
  const agreementLabel = data.agreementType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">
      You're Invited to Invest
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
      ${data.inviterName} has invited you to join <strong style="color:#0f172a;">${data.hostelName}</strong> as an investor on InvestPronto.
    </p>

    <!-- Investment Details Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">
            Investment Summary
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;">
                <span style="font-size:13px;color:#64748b;">Amount</span>
              </td>
              <td style="padding:6px 0;text-align:right;">
                <span style="font-size:14px;font-weight:600;color:#0f172a;">${data.amountInvested}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;border-top:1px solid #e2e8f0;">
                <span style="font-size:13px;color:#64748b;">Share</span>
              </td>
              <td style="padding:6px 0;border-top:1px solid #e2e8f0;text-align:right;">
                <span style="font-size:14px;font-weight:600;color:#0f172a;">${data.percentageShare}%</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;border-top:1px solid #e2e8f0;">
                <span style="font-size:13px;color:#64748b;">Agreement</span>
              </td>
              <td style="padding:6px 0;border-top:1px solid #e2e8f0;text-align:right;">
                <span style="font-size:14px;font-weight:600;color:#0f172a;">${agreementLabel}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.5;">
      This invitation expires in 7 days.<br />
      Can't click the button? Copy this link:<br />
      <a href="${inviteUrl}" style="color:#3b82f6;word-break:break-all;">${inviteUrl}</a>
    </p>
  `;

  return {
    subject: `You're invited to invest in ${data.hostelName}`,
    htmlBody: layout(content),
    textBody: `${data.inviterName} has invited you to invest in ${data.hostelName}. Accept your invitation: ${inviteUrl}`,
  };
}

interface FounderInviteData {
  recipientName?: string;
  hostelName: string;
  inviterName: string;
  token: string;
  role: "admin" | "operator";
  contributionAmount?: string;
}

export function founderInvitationEmail(data: FounderInviteData) {
  const inviteUrl = `${baseUrl}/invite?token=${data.token}`;
  const roleLabel = data.role === "admin" ? "Co-Founder" : "Operator";

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">
      You're Invited as ${roleLabel}
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
      ${data.inviterName} has invited you to join <strong style="color:#0f172a;">${data.hostelName}</strong> as a <strong style="color:#0f172a;">${roleLabel}</strong> on InvestPronto.
    </p>

    <!-- Role Details Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#166534;">
            Your Role: ${roleLabel}
          </p>
          <p style="margin:0;font-size:13px;color:#4ade80;line-height:1.5;">
            ${data.role === "admin"
              ? "As a co-founder, you'll have full administrative access to manage this property, track finances, and oversee operations."
              : "As an operator, you'll be able to log revenue, expenses, and help manage day-to-day operations."}
          </p>
          ${data.contributionAmount ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid #bbf7d0;">
            <tr>
              <td style="padding-top:12px;">
                <span style="font-size:13px;color:#166534;">Capital Contribution</span>
              </td>
              <td style="padding-top:12px;text-align:right;">
                <span style="font-size:14px;font-weight:600;color:#166534;">${data.contributionAmount}</span>
              </td>
            </tr>
          </table>` : ""}
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#166534 0%,#22c55e 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.5;">
      This invitation expires in 7 days.<br />
      Can't click the button? Copy this link:<br />
      <a href="${inviteUrl}" style="color:#3b82f6;word-break:break-all;">${inviteUrl}</a>
    </p>
  `;

  return {
    subject: `You're invited as ${roleLabel} for ${data.hostelName}`,
    htmlBody: layout(content),
    textBody: `${data.inviterName} has invited you to join ${data.hostelName} as a ${roleLabel}. Accept your invitation: ${inviteUrl}`,
  };
}
