import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Reportiq <onboarding@resend.dev>";

/** Convert markdown summary text to HTML for email */
function markdownToHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (line.startsWith("## "))
        return `<h2 style="margin:24px 0 8px;font-size:16px;font-weight:600;color:#111827;">${line.slice(3)}</h2>`;
      if (line.startsWith("# "))
        return `<h1 style="margin:28px 0 10px;font-size:18px;font-weight:700;color:#111827;">${line.slice(2)}</h1>`;
      if (line.startsWith("- ") || line.startsWith("• ")) {
        const content = line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        return `<li style="margin:4px 0;color:#374151;">${content}</li>`;
      }
      if (line.trim() === "") return "<br/>";
      const content = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return `<p style="margin:6px 0;color:#374151;line-height:1.6;">${content}</p>`;
    })
    .join("\n");
}

export interface SendReportEmailOptions {
  to: string;
  reportTitle: string;
  clientName: string;
  periodLabel: string;
  summary: string;
  agencyName: string;
  brandColor: string;
}

export async function sendReportEmail({
  to,
  reportTitle,
  clientName,
  periodLabel,
  summary,
  agencyName,
  brandColor,
}: SendReportEmailOptions) {
  const bodyHtml = markdownToHtml(summary);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Brand header -->
        <tr>
          <td style="background:${brandColor};padding:28px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${agencyName}</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Client Performance Report</p>
          </td>
        </tr>

        <!-- Report meta -->
        <tr>
          <td style="padding:24px 32px 0;border-bottom:1px solid #e5e7eb;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">${reportTitle}</h1>
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Client: <strong style="color:#374151;">${clientName}</strong></p>
            <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">Period: <strong style="color:#374151;">${periodLabel}</strong></p>
          </td>
        </tr>

        <!-- Summary body -->
        <tr>
          <td style="padding:24px 32px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              This report was prepared by <strong>${agencyName}</strong> and delivered via Reportiq.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${reportTitle} — ${clientName}`,
    html,
  });
}
