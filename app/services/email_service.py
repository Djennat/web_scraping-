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

async def send_scraping_status_email(email: str, username: str, website_url: str, status: str, admin_message: str = None):
    if not settings.EMAIL_SENDER or not settings.EMAIL_PASSWORD:
        logger.warning("Email credentials not configured, skipping status email")
        return

    msg = MIMEMultipart()
    msg['From'] = settings.EMAIL_SENDER
    msg['To'] = email
    msg['Subject'] = f"Scraping Request {status.capitalize()}"

    body = f"""
    Hello {username},

    Your scraping request for {website_url} has been {status.lower()}.

    """

    if admin_message:
        body += f"\nAdmin Message: {admin_message}\n"

    body += """
    You can check the status of your request in your dashboard.

    Best regards,
    The Scraping Platform Team
    """

    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.EMAIL_SENDER, settings.EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Status email sent to {email} for request {status}")
    except Exception as e:
        logger.error(f"Failed to send status email: {str(e)}")
        # Don't raise an exception here as we don't want to fail the request if email fails

async def send_scraping_results_email(email: str, username: str, website_url: str, result_id: str):
    logger.info(f"Attempting to send results email to {email} for result {result_id}")
    
    if not settings.EMAIL_SENDER or not settings.EMAIL_PASSWORD:
        logger.error(f"Email settings not configured. EMAIL_SENDER: {settings.EMAIL_SENDER}, EMAIL_PASSWORD: {'Set' if settings.EMAIL_PASSWORD else 'Not Set'}")
        return

    try:
        logger.info(f"Creating email message for {email}")
        msg = MIMEMultipart("alternative")
        msg['From'] = f"WebScraping Service <{settings.EMAIL_SENDER}>"
        msg['To'] = email
        msg['Subject'] = "Your Scraping Results Are Ready!"
        msg['Reply-To'] = settings.EMAIL_SENDER

        # Plain text version
        plain_text = f"""
Hello {username},

Great news! Your scraping results for {website_url} are now ready.

You can view your results by logging into your account and checking your dashboard.

Result ID: {result_id}

Best regards,
The Scraping Platform Team
        """

        # HTML version
        html_body = f"""
        <html>
            <body>
                <h2>Your Scraping Results Are Ready!</h2>
                <p>Hello {username},</p>
                <p>Great news! Your scraping results for <strong>{website_url}</strong> are now ready.</p>
                <p>You can view your results by logging into your account and checking your dashboard.</p>
                <p><strong>Result ID:</strong> {result_id}</p>
                <p>Best regards,<br>The Scraping Platform Team</p>
            </body>
        </html>
        """

        msg.attach(MIMEText(plain_text, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        logger.info(f"Connecting to SMTP server: {settings.SMTP_SERVER}:{settings.SMTP_PORT}")
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.set_debuglevel(1)  # Enable debug output

        try:
            logger.info("Starting TLS connection")
            server.starttls()

            logger.info(f"Logging in to SMTP server with email: {settings.EMAIL_SENDER}")
            server.login(settings.EMAIL_SENDER, settings.EMAIL_PASSWORD)

            logger.info("Sending email message")
            server.send_message(msg)
            logger.info(f"Results notification email successfully sent to {email} for result {result_id}")
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Authentication Error: {str(e)}")
            logger.error("Make sure you're using an App-Specific password for Gmail (not your regular password)")
        except smtplib.SMTPException as e:
            logger.error(f"SMTP Error: {str(e)}")
        finally:
            server.quit()
            logger.info("SMTP connection closed")
    except Exception as e:
        logger.error(f"Failed to send results notification email: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Don't raise an exception as we don't want to fail the request if email fails
