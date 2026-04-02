"""
PM Internship Smart Match — Email Alert System
Sends email notifications when new high-scoring matching internships are found.

Uses Gmail SMTP (free) or Brevo free tier.

Setup:
1. Enable "Less Secure Apps" or generate an App Password for your Gmail account
2. Set environment variables:
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=your-app-password

Usage:
    python emailer.py
"""

import smtplib
import os
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from datetime import datetime

# ============ CONFIG ============
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
APP_NAME = "InternMatch"


def create_email_html(matches: list) -> str:
    """Generate a beautiful HTML email template for new matches."""
    rows = ""
    for m in matches[:5]:  # Top 5 matches
        score_color = "#22c55e" if m["score"] >= 70 else "#f59e0b" if m["score"] >= 50 else "#3b82f6"
        rows += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #2d3748;">
                <strong style="color: #f1f5f9;">{m['companyName']}</strong><br/>
                <span style="color: #e67e22; font-weight: 600;">{m['roleTitle']}</span><br/>
                <span style="color: #94a3b8; font-size: 13px;">
                    📍 {m['state']} &nbsp; 🏢 {m['sector']}
                </span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #2d3748; text-align: center;">
                <span style="background: {score_color}22; color: {score_color}; padding: 4px 12px; 
                       border-radius: 20px; font-weight: 700; font-size: 14px;">
                    {m['score']}%
                </span>
            </td>
        </tr>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: #0b1121; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="text-align: center; padding: 30px 0;">
                <h1 style="color: #e67e22; margin: 0; font-size: 24px;">
                    🎯 {APP_NAME}
                </h1>
                <p style="color: #94a3b8; margin: 8px 0 0;">New Internship Matches Found!</p>
            </div>
            
            <!-- Content Card -->
            <div style="background: #111827; border: 1px solid #1e293b; border-radius: 12px; 
                         padding: 24px; margin-bottom: 20px;">
                <h2 style="color: #f1f5f9; margin: 0 0 8px; font-size: 18px;">
                    🔔 {len(matches)} New Match{'es' if len(matches) > 1 else ''} for You
                </h2>
                <p style="color: #94a3b8; margin: 0 0 20px; font-size: 14px;">
                    Based on your profile, we found new internships that match your skills and preferences.
                </p>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <th style="text-align: left; padding: 8px 12px; color: #64748b; 
                                   font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
                                   border-bottom: 1px solid #2d3748;">
                            Internship
                        </th>
                        <th style="text-align: center; padding: 8px 12px; color: #64748b; 
                                   font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
                                   border-bottom: 1px solid #2d3748;">
                            Match
                        </th>
                    </tr>
                    {rows}
                </table>
            </div>
            
            <!-- CTA -->
            <div style="text-align: center; margin: 24px 0;">
                <a href="https://pminternship.mca.gov.in" 
                   style="display: inline-block; padding: 12px 32px; background: #e67e22; 
                          color: white; text-decoration: none; border-radius: 8px; 
                          font-weight: 600; font-size: 15px;">
                    Apply on PM Internship Portal →
                </a>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #1e293b;">
                <p style="color: #64748b; font-size: 12px; margin: 0;">
                    You're receiving this because you have email alerts enabled on {APP_NAME}.<br/>
                    Update your preferences in the app settings to manage notifications.
                </p>
            </div>
        </div>
    </body>
    </html>
    """


def send_alert(to_email: str, matches: list):
    """Send an email alert for new matches."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("⚠ Email not configured. Set SMTP_EMAIL and SMTP_PASSWORD environment variables.")
        print(f"  Would have sent {len(matches)} match alerts to {to_email}")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🎯 {len(matches)} New PM Internship Match{'es' if len(matches) > 1 else ''} for You!"
    msg["From"] = f"{APP_NAME} <{SMTP_EMAIL}>"
    msg["To"] = to_email

    # Plain text fallback
    plain = f"InternMatch found {len(matches)} new internship matches for you!\n\n"
    for m in matches[:5]:
        plain += f"• {m['companyName']} — {m['roleTitle']} ({m['score']}% match)\n"
    plain += f"\nApply at: https://pminternship.mca.gov.in"

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(create_email_html(matches), "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        print(f"✓ Email alert sent to {to_email}")
        return True
    except Exception as e:
        print(f"✕ Failed to send email to {to_email}: {e}")
        return False


def process_alerts(user_profiles: list, new_internships: list):
    """Process alerts for all users who have email alerts enabled."""
    from matcher_standalone import match_internships_standalone

    sent_count = 0
    for user in user_profiles:
        if not user.get("emailAlertsEnabled", True):
            continue

        # Run matching against new internships only
        matches = match_internships_standalone(user, new_internships)
        high_matches = [m for m in matches if m["score"] >= 50]

        if high_matches:
            success = send_alert(user["email"], high_matches)
            if success:
                sent_count += 1

    print(f"\n📧 Sent alerts to {sent_count} users")


if __name__ == "__main__":
    # Test with sample data
    test_matches = [
        {
            "companyName": "TATA CONSULTANCY SERVICES",
            "roleTitle": "SOFTWARE DEVELOPER",
            "sector": "Information Technology",
            "state": "MAHARASHTRA",
            "score": 85
        },
        {
            "companyName": "INFOSYS LIMITED",
            "roleTitle": "CLOUD ENGINEER",
            "sector": "Information Technology",
            "state": "KARNATAKA",
            "score": 72
        }
    ]

    print("Email Alert System — Test Mode")
    print(f"SMTP configured: {'Yes' if SMTP_EMAIL else 'No (set SMTP_EMAIL env var)'}")

    if SMTP_EMAIL:
        send_alert("test@example.com", test_matches)
    else:
        print("\nSample email HTML generated successfully.")
        print("To enable email alerts, set these environment variables:")
        print("  SMTP_EMAIL=your-email@gmail.com")
        print("  SMTP_PASSWORD=your-gmail-app-password")
        print("\nFor Gmail, generate an App Password at:")
        print("  https://myaccount.google.com/apppasswords")
