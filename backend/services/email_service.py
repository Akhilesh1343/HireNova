import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, List, Dict, Any

# In-memory test store for automated testing verification when SMTP is unconfigured
_test_dispatched_emails: List[Dict[str, Any]] = []


def is_smtp_configured() -> bool:
    """Return True if SMTP host is configured in the environment."""
    return bool(os.getenv("SMTP_HOST", "").strip())


def get_test_dispatched_emails() -> List[Dict[str, Any]]:
    """Retrieve test-captured dispatched emails for unit and integration testing."""
    return list(_test_dispatched_emails)


def clear_test_dispatched_emails() -> None:
    """Clear test email capture store."""
    _test_dispatched_emails.clear()


def send_password_reset_email(recipient_email: str, recipient_name: str, reset_url: str) -> bool:
    """
    Sends a secure, branded password-reset email to recipient_email containing reset_url.
    If SMTP is not configured in the environment, captures to the test store for test verification
    and logs a server diagnostic message without exposing secrets.
    """
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_from = os.getenv("SMTP_FROM_EMAIL", "noreply@hirenova.ai").strip()
    smtp_from_name = os.getenv("SMTP_FROM_NAME", "HireNova Security").strip()
    smtp_tls = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")

    subject = "HireNova — Reset your account password"

    text_body = f"""Hello {recipient_name or 'there'},

We received a request to reset your password for your HireNova recruitment workspace account.

Please use the secure link below to set a new password:
{reset_url}

This link is single-use and will expire in 20 minutes for security reasons.

If you did not request this password reset, please ignore this email. Your account remains secure.

Best regards,
The HireNova Security Team
"""

    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your HireNova Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050807; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #050807; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #0B1210; border: 1px solid rgba(52, 211, 153, 0.25); border-radius: 16px; padding: 36px 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
          <tr>
            <td align="left" style="padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.08);">
              <span style="font-size: 20px; font-weight: 800; color: #F8FAFC; letter-spacing: -0.5px;">HireNova</span>
              <span style="display: inline-block; width: 6px; height: 6px; background-color: #34D399; border-radius: 50%; margin-left: 4px;"></span>
              <div style="font-size: 11px; color: #34D399; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">Next-Gen Recruitment</div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 28px; padding-bottom: 24px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #F8FAFC; margin: 0 0 12px 0;">Reset your password</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #94A3A8; margin: 0 0 20px 0;">
                Hello {recipient_name or 'there'}, we received a request to reset the password for your HireNova account (<strong style="color: #F8FAFC;">{recipient_email}</strong>).
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="background-color: #059669; color: #FFFFFF; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(5,150,105,0.4);">Set New Password</a>
              </div>
              <p style="font-size: 12px; line-height: 1.6; color: #94A3A8; margin: 0 0 10px 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 11px; word-break: break-all; color: #34D399; background: rgba(5,150,105,0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(52,211,153,0.2);">
                {reset_url}
              </p>
              <p style="font-size: 12px; color: #64748B; margin-top: 24px;">
                This link will expire in <strong style="color: #94A3A8;">20 minutes</strong> and can only be used once. If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; font-size: 11px; color: #64748B; text-align: center;">
              HireNova Recruitment Intelligence Platform &bull; Automated &amp; Secure
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    # Record in test capture store
    _test_dispatched_emails.append({
        "to": recipient_email,
        "name": recipient_name,
        "reset_url": reset_url,
        "subject": subject
    })

    if not smtp_host:
        print(f"[EMAIL SERVICE] SMTP is not configured. (To deliver real emails, set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in backend/.env).")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{smtp_from_name} <{smtp_from}>"
        msg["To"] = recipient_email

        msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        if smtp_tls:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            server.ehlo()
            server.starttls()
            server.ehlo()
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)

        if smtp_user and smtp_pass:
            server.login(smtp_user, smtp_pass)

        server.sendmail(smtp_from, [recipient_email], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"[EMAIL SERVICE ERROR] Failed to send email to '{recipient_email}': {e}")
        return False

