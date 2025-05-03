from fastapi import HTTPException
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

async def send_welcome_email(user_email: str, username: str, password: str, role: str):

    if not settings.EMAIL_SENDER or not settings.EMAIL_PASSWORD:
        logger.warning(f"Email settings not configured. EMAIL_SENDER: {settings.EMAIL_SENDER}, EMAIL_PASSWORD: {'Set' if settings.EMAIL_PASSWORD else 'Not Set'}")
        return

    try:
        logger.info(f"Attempting to send welcome email to {user_email} from {settings.EMAIL_SENDER}")
        
        msg = MIMEMultipart()
        msg['From'] = settings.EMAIL_SENDER
        msg['To'] = user_email
        msg['Subject'] = "Welcome to Our Scraping Service"

        body = f"""
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
                <p>Best regards,<br>The Admin Team</p>
            </body>
        </html>
        """

        msg.attach(MIMEText(body, 'html'))

        logger.info(f"Connecting to SMTP server: {settings.SMTP_SERVER}:{settings.SMTP_PORT}")
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.set_debuglevel(1) 
        
        try:
            logger.info("Starting TLS connection")
            server.starttls()
            logger.info("Logging in to SMTP server")
            server.login(settings.EMAIL_SENDER, settings.EMAIL_PASSWORD)
            logger.info("Sending email message")
            server.send_message(msg)
            logger.info(f"Welcome email successfully sent to {user_email}")
        finally:
            server.quit()
            
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error: {str(e)}")
        logger.error("Please check your email credentials and make sure you're using an app-specific password for Gmail")
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error while sending email: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}") 