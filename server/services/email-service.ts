import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import escapeHtml from 'escape-html';

const getAppUrl = (): string => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.APP_URL_PROD || 'https://p3app.bizelev8.ai';
  }
  return process.env.APP_URL_DEV || 'http://localhost:5000';
};

let transporter: Transporter | null = null;

// Validate email configuration at startup
export function validateEmailConfig(): void {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required email configuration: ${missing.join(', ')}`);
  }
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // false for port 587, true for 465
      requireTLS: true, // Force STARTTLS for Gmail
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Enable certificate validation in production for security
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
  }
  return transporter;
}

const getEmailTemplate = (content: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>P³ Interview Academy</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          color: #e0e7ff;
          margin: 10px 0 0 0;
          font-size: 14px;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #1f2937;
          font-size: 24px;
          margin-top: 0;
          margin-bottom: 20px;
        }
        .content p {
          color: #4b5563;
          margin: 16px 0;
          font-size: 16px;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          margin: 24px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
        }
        .info-box {
          background-color: #f9fafb;
          border-left: 4px solid #667eea;
          padding: 16px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box p {
          margin: 8px 0;
          font-size: 14px;
          color: #6b7280;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          color: #6b7280;
          font-size: 14px;
          margin: 8px 0;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>P³ Interview Academy</h1>
          <p>Prepare. Practice. Perform.</p>
        </div>
        ${content}
        <div class="footer">
          <p>© ${new Date().getFullYear()} P³ Interview Academy. All rights reserved.</p>
          <p><a href="${getAppUrl()}">Visit our website</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export async function sendVerificationEmail(
  email: string,
  token: string,
  firstName: string
): Promise<void> {
  // Validate inputs
  if (!token || token.length < 32) {
    throw new Error('Invalid verification token');
  }
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }

  const verificationUrl = `${getAppUrl()}/verify-email?token=${token}`;
  const safeName = escapeHtml(firstName);

  const content = `
    <div class="content">
      <h2>Welcome, ${safeName}! 👋</h2>
      <p>Thank you for joining P³ Interview Academy. We're excited to help you prepare for your interview success!</p>
      <p>To get started, please verify your email address by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      <div class="info-box">
        <p><strong>📌 Important:</strong></p>
        <p>• This verification link will expire in 24 hours for security reasons</p>
        <p>• If you didn't create an account, you can safely ignore this email</p>
        <p>• If the button doesn't work, copy and paste this link:</p>
        <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Verify your P³ Interview Academy account',
    html: getEmailTemplate(content),
    text: `Welcome, ${safeName}!\n\nPlease verify your email: ${verificationUrl}\n\nThis link expires in 24 hours.`,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
  } catch (error) {
    // Sanitize error logging - don't expose SMTP credentials
    console.error('❌ Failed to send verification email:', {
      code: (error as any).code,
      command: (error as any).command,
      // Credentials intentionally omitted from logs
    });
    throw new Error('Failed to send verification email');
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  firstName: string
): Promise<void> {
  // Validate inputs
  if (!token || token.length < 32) {
    throw new Error('Invalid reset token');
  }
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }

  const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;
  const safeName = escapeHtml(firstName);

  const content = `
    <div class="content">
      <h2>Password Reset Request 🔒</h2>
      <p>Hi ${safeName},</p>
      <p>We received a request to reset your P³ Interview Academy password.</p>
      <p>Click the button below to create a new password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <div class="info-box">
        <p><strong>⚠️ Security Information:</strong></p>
        <p>• This link will expire in 1 hour</p>
        <p>• If you didn't request this, ignore this email</p>
        <p>• If the button doesn't work, copy this link:</p>
        <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Reset your P³ Interview Academy password',
    html: getEmailTemplate(content),
    text: `Hi ${safeName},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
  } catch (error) {
    // Sanitize error logging - don't expose SMTP credentials
    console.error('❌ Failed to send password reset email:', {
      code: (error as any).code,
      command: (error as any).command,
      // Credentials intentionally omitted from logs
    });
    throw new Error('Failed to send password reset email');
  }
}

export async function sendWelcomeEmail(
  email: string,
  firstName: string
): Promise<void> {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }

  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const safeName = escapeHtml(firstName);

  const content = `
    <div class="content">
      <h2>🎉 Welcome to P³ Interview Academy!</h2>
      <p>Hi ${safeName},</p>
      <p>Your email has been verified! You're all set to start your interview preparation journey.</p>
      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
      </div>
      <p>Good luck with your interview preparation! 🚀</p>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: '🎉 Welcome to P³ Interview Academy!',
    html: getEmailTemplate(content),
    text: `Welcome, ${safeName}!\n\nVisit your dashboard: ${dashboardUrl}`,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
  } catch (error) {
    // Sanitize error logging - don't expose SMTP credentials
    console.error('❌ Failed to send welcome email:', {
      code: (error as any).code,
      command: (error as any).command,
      // Credentials intentionally omitted from logs
    });
    // Don't throw error for welcome emails - not critical
  }
}
