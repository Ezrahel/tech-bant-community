import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody } from '@/lib/api-helpers';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildSupportHtml(params: {
    email: string;
    subject: string;
    category: string;
    message: string;
}): string {
    const { email, subject, category, message } = params;

    // Escape HTML to prevent injection via user-supplied content
    const esc = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 20px">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="padding:40px 40px 32px;text-align:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px">TechBant Support Request</h1>
            <p style="margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:14px;line-height:1.5">A user has submitted a support ticket</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px">

            <!-- Category badge -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:20px;padding:5px 14px">
                  <span style="color:#ffffff;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">${esc(category)}</span>
                </td>
              </tr>
            </table>

            <!-- Field: From -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
              <tr>
                <td style="padding:16px;background-color:#f9f9fb;border-radius:10px;border-left:4px solid #667eea">
                  <p style="margin:0 0 4px;color:#888888;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px">From</p>
                  <p style="margin:0;color:#1a1a1a;font-size:15px;word-break:break-all">${esc(email)}</p>
                </td>
              </tr>
            </table>

            <!-- Field: Subject -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
              <tr>
                <td style="padding:16px;background-color:#f9f9fb;border-radius:10px;border-left:4px solid #764ba2">
                  <p style="margin:0 0 4px;color:#888888;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px">Subject</p>
                  <p style="margin:0;color:#1a1a1a;font-size:15px">${esc(subject)}</p>
                </td>
              </tr>
            </table>

            <!-- Field: Message -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:16px;background-color:#f9f9fb;border-radius:10px;border-left:4px solid #9b59b6">
                  <p style="margin:0 0 8px;color:#888888;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px">Message</p>
                  <p style="margin:0;color:#4a4a4a;font-size:15px;line-height:1.7;white-space:pre-wrap">${esc(message)}</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background-color:#fafafa;border-top:1px solid #e8e8e8">
            <p style="margin:0;color:#888888;font-size:12px;text-align:center;line-height:1.6">
              TechBant Community &middot; Support System<br>
              Reply directly to this email to respond to the user.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await parseBody<{
            email: string;
            subject: string;
            category: string;
            message: string;
        }>(req);

        if (!body) {
            return errorResponse('Invalid request body', 400);
        }

        const { email, subject, category, message } = body;

        // Validate required fields
        if (!email || typeof email !== 'string' || !email.trim()) {
            return errorResponse('Email is required', 400);
        }
        if (!subject || typeof subject !== 'string' || !subject.trim()) {
            return errorResponse('Subject is required', 400);
        }
        if (!category || typeof category !== 'string' || !category.trim()) {
            return errorResponse('Category is required', 400);
        }
        if (!message || typeof message !== 'string' || !message.trim()) {
            return errorResponse('Message is required', 400);
        }

        // Validate formats and lengths
        if (!EMAIL_REGEX.test(email.trim())) {
            return errorResponse('Invalid email address', 400);
        }
        if (subject.trim().length > 200) {
            return errorResponse('Subject must be 200 characters or fewer', 400);
        }
        if (message.trim().length > 5000) {
            return errorResponse('Message must be 5000 characters or fewer', 400);
        }

        // Graceful degradation: if no API key, skip sending but still return success
        if (!process.env.RESEND_API_KEY) {
            console.warn('[support] RESEND_API_KEY is not set — skipping email delivery');
            return jsonResponse({ message: 'Support request sent successfully' });
        }

        try {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: process.env.RESEND_FROM || 'TechBant <noreply@techbantcommunity.com>',
                    to: 'ditechinc024@gmail.com',
                    reply_to: email.trim(),
                    subject: `[TechBant Support] ${subject.trim()}`,
                    html: buildSupportHtml({
                        email: email.trim(),
                        subject: subject.trim(),
                        category: category.trim(),
                        message: message.trim(),
                    }),
                }),
            });

            if (!res.ok) {
                const errorBody = await res.text().catch(() => '(unreadable)');
                console.error(`[support] Resend API error ${res.status}:`, errorBody);
            }
        } catch (emailError) {
            console.error('[support] Failed to send support email:', emailError);
        }

        return jsonResponse({ message: 'Support request sent successfully' });
    } catch (error: unknown) {
        console.error('[support] Unexpected error:', error);
        return errorResponse('Internal server error', 500);
    }
}
