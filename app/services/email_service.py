from fastapi import HTTPException
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

async def send_welcome_email(user_email: str, username: str, password: str, role: str):

    # Check if email settings are configured
    if not settings.EMAIL_SENDER or not settings.EMAIL_PASSWORD:
        logger.warning(f"Email settings not configured. EMAIL_SENDER: {settings.EMAIL_SENDER}, EMAIL_PASSWORD: {'Set' if settings.EMAIL_PASSWORD else 'Not Set'}")
        return

    try:
        logger.info(f"Attempting to send welcome email to {user_email} from {settings.EMAIL_SENDER}")

        # Create the message
        msg = MIMEMultipart("alternative")
        msg['From'] = f"WebScraping Service <{settings.EMAIL_SENDER}>"  # Add sender name (✅ Helps reduce spam)
        msg['To'] = user_email
        msg['Subject'] = "Welcome to Our Scraping Service"
        msg['Reply-To'] = settings.EMAIL_SENDER  # ✅ Recommended header
        msg.add_header('List-Unsubscribe', '<mailto:unsubscribe@yourdomain.com>')  # ✅ Optional, reduces spam rating

        # Plain text version (required for compatibility and spam score)
        plain_text = f"""
Welcome to Our Scraping Service!

Your account has been created successfully. Here are your credentials:

Username: {username}
Password: {password}
Role: {role}

Please change your password after your first login.

If this email was not intended for you, please disregard it.

Best regards,
The Admin Team
        """

        # HTML version (✅ Better for user experience and Gmail prefers both formats)
        html_body = f"""
        <html>
            <body>
                <h2>Welcome to Our Scraping Service!</h2>
                <p>Your account has been created successfully. Here are your credentials:</p>
                <ul>
                    <li><strong>Username:</strong> {username}</li>
                    <li><strong>Password:</strong> {password}</li>
                    <li><strong>Role:</strong> {role}</li>
                </ul>
                <p>Please change your password after your first login.</p>
                <p>If this email was not intended for you, please disregard it.</p>
                <p>Best regards,<br>The Admin Team</p>
            </body>
        </html>
        """

        # Attach both versions to the email (✅ Gmail wants both for reliability)
        msg.attach(MIMEText(plain_text, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        logger.info(f"Connecting to SMTP server: {settings.SMTP_SERVER}:{settings.SMTP_PORT}")
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.set_debuglevel(1)  # Optional: for debugging SMTP issues

        try:
            logger.info("Starting TLS connection")
            server.starttls()

            logger.info("Logging in to SMTP server")
            server.login(settings.EMAIL_SENDER, settings.EMAIL_PASSWORD)  # ✅ Use Gmail App Password here

            logger.info("Sending email message")
            server.send_message(msg)
            logger.info(f"Welcome email successfully sent to {user_email}")
        finally:
            server.quit()

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error: {str(e)}")
        logger.error("Make sure you're using an App-Specific password for Gmail (not your regular password)")
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error while sending email: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
