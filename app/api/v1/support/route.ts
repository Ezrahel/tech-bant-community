import { NextRequest } from "next/server";
import { jsonResponse, errorResponse, parseBody } from "@/lib/api-helpers";

const SUPPORT_EMAIL_HTML = (
  senderEmail: string,
  category: string,
  subject: string,
  message: string,
) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 20px">
    <tr><td align="center">
      <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="padding:36px 40px 28px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)">
            <p style="margin:0 0 6px;color:rgba(255,255,255,0.75);font-size:12px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase">TechBant Community</p>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px">New Support Request</h1>
          </td>
        </tr>

        <!-- Meta row -->
        <tr>
          <td style="padding:24px 40px 0">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:12px">
                  <span style="display:inline-block;padding:4px 12px;background:#f0f0f0;border-radius:20px;font-size:12px;font-weight:600;color:#555;text-transform:capitalize">${category}</span>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:6px">
                  <span style="font-size:12px;color:#999;font-weight:500;text-transform:uppercase;letter-spacing:0.8px">From</span>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:20px">
                  <a href="mailto:${senderEmail}" style="color:#667eea;font-size:15px;font-weight:500;text-decoration:none">${senderEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:6px">
                  <span style="font-size:12px;color:#999;font-weight:500;text-transform:uppercase;letter-spacing:0.8px">Subject</span>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:24px;border-bottom:1px solid #eeeeee">
                  <p style="margin:0;color:#1a1a1a;font-size:16px;font-weight:600">${subject}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Message body -->
        <tr>
          <td style="padding:24px 40px 32px">
            <p style="margin:0 0 12px;font-size:12px;color:#999;font-weight:500;text-transform:uppercase;letter-spacing:0.8px">Message</p>
            <div style="background:#f8f8f8;border-radius:10px;padding:20px 24px">
              <p style="margin:0;color:#333333;font-size:15px;line-height:1.7;white-space:pre-wrap">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;background-color:#fafafa;border-top:1px solid #eeeeee">
            <p style="margin:0;color:#aaaaaa;font-size:12px;text-align:center">
              TechBant Community &middot; Support request submitted via the platform<br>
              Reply directly to this email to respond to the user.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody<{
      email: string;
      subject: string;
      category: string;
      message: string;
    }>(req);

    if (!body) {
      return errorResponse("Invalid request body", 400);
    }

    const { email, subject, category, message } = body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!email || typeof email !== "string" || !email.trim()) {
      return errorResponse("Email is required", 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return errorResponse("Please enter a valid email address", 400);
    }
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return errorResponse("Subject is required", 400);
    }
    if (subject.trim().length > 200) {
      return errorResponse("Subject must be 200 characters or less", 400);
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return errorResponse("Message is required", 400);
    }
    if (message.trim().length > 5000) {
      return errorResponse("Message must be 5000 characters or less", 400);
    }

    const safeCategory = (
      category && typeof category === "string" ? category : "general"
    ).trim();

    // ── Send via Resend ───────────────────────────────────────────────────
    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      console.warn("[Support] RESEND_API_KEY not set — email not delivered");
      return jsonResponse({ message: "Support request received" });
    }

    const resendFrom =
      process.env.RESEND_FROM || "TechBant <noreply@techbantcommunity.com>";

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: resendFrom,
        to: "ditechinc024@gmail.com",
        reply_to: email.trim(),
        subject: `[TechBant Support] ${subject.trim()}`,
        html: SUPPORT_EMAIL_HTML(
          email.trim(),
          safeCategory,
          subject.trim(),
          message.trim(),
        ),
      }),
    });

    if (!resendResp.ok) {
      const resendError = await resendResp.json().catch(() => ({}));
      console.error("[Support] Resend API error:", resendError);
      // Still return success to the user — don't leak infra errors
    }

    return jsonResponse({ message: "Support request sent successfully" });
  } catch (error: unknown) {
    console.error("[Support] Unexpected error:", error);
    return errorResponse("Internal server error", 500);
  }
}
