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

// Proactively verify SMTP connectivity and auth at runtime
export async function verifyEmailTransport(): Promise<{ ok: boolean; message: string }> {
  try {
    const t = getTransporter();
    await t.verify();
    console.log('[smtp-verify] ok SMTP transport verified');
    return { ok: true, message: 'SMTP transport verified' };
  } catch (err: any) {
    const host = process.env.SMTP_HOST;
    const fromAddr = process.env.EMAIL_FROM;
    const code = err?.code || err?.errno || 'UNKNOWN';
    const cmd = err?.command || err?.stage || 'connect';
    const resp = typeof err?.response === 'string' ? err.response.slice(0,200) : undefined;
    console.error('[smtp-verify] fail', { host, from: fromAddr, code, cmd, response: resp });
    return { ok: false, message: `SMTP verify failed (host=${host}, from=${fromAddr}) code=${code} cmd=${cmd}` };
  }
}

function getTransporter(): Transporter {
  if (!transporter) {
    const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // false for port 587, true for 465
      requireTLS: true, // Force STARTTLS for Gmail
      auth: {
        user: process.env.SMTP_USER,
        pass: smtpPass,
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
      <title>P3 Interview Academy</title>
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
          <h1>P3 Interview Academy</h1>
          <p>Prepare. Practice. Perform.</p>
        </div>
        ${content}
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} P3 Interview Academy. All rights reserved.</p>
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
      <h2>Welcome, ${safeName}!</h2>
      <p>Thank you for joining P3 Interview Academy. We're excited to help you prepare for your interview success!</p>
      <p>To get started, please verify your email address by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      <div class="info-box">
        <p><strong>Important:</strong></p>
        <p>- This verification link will expire in 24 hours for security reasons.</p>
        <p>- If you didn't create an account, you can safely ignore this email.</p>
        <p>- If the button doesn't work, copy and paste this link:</p>
        <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Verify your P³ Interview Academy account',
    html: getEmailTemplate(content),
    text: `Welcome, ${safeName}!\n\nPlease verify your email: ${verificationUrl}\n\nThis link expires in 24 hours.`,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
  } catch (error) {
    // Sanitize error logging - don't expose SMTP credentials
    console.error('Failed to send verification email:', {
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
      <h2>Password Reset Request</h2>
      <p>Hi ${safeName},</p>
      <p>We received a request to reset your P3 Interview Academy password.</p>
      <p>Click the button below to create a new password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <div class="info-box">
        <p><strong>Security Information:</strong></p>
        <p>� This link will expire in 1 hour.</p>
        <p>� If you didn't request this, ignore this email.</p>
        <p>� If the button doesn't work, copy this link:</p>
        <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Reset your P3 Interview Academy password',
    html: getEmailTemplate(content),
    text: `Hi ${safeName},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
  } catch (error) {
    // Sanitize error logging - don't expose SMTP credentials
    console.error('Failed to send password reset email:', {
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
      <h2>Welcome to P3 Interview Academy!</h2>
      <p>Hi ${safeName},</p>
      <p>Your email has been verified! You're all set to start your interview preparation journey.</p>
      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
      </div>
      <p>Good luck with your interview preparation!</p>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Welcome to P3 Interview Academy!',
    html: getEmailTemplate(content),
    text: `Welcome, ${safeName}!\n\nVisit your dashboard: ${dashboardUrl}`,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
  } catch (error) {
    // Sanitize error logging - don't expose SMTP credentials
    console.error('Failed to send welcome email:', {
      code: (error as any).code,
      command: (error as any).command,
      // Credentials intentionally omitted from logs
    });
    // Don't throw error for welcome emails - not critical
  }
}

// ============================================================================
// SUBSCRIPTION & BILLING EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Send credit reset notification email (monthly billing cycle renewal)
 */
export async function sendCreditResetEmail(
  email: string,
  name: string,
  monthlyCredits: number,
  topUpCredits: number,
  planType: string,
  nextResetDate: Date
): Promise<void> {
  const safeName = escapeHtml(name);
  const billingUrl = `${getAppUrl()}/billing`;
  const formattedDate = nextResetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const content = `
    <div class="content">
      <h2>Your Monthly Credits Have Been Reset! ⚡</h2>
      <p>Hi ${safeName},</p>
      <p>Good news! Your ${planType} tier monthly credits have been automatically renewed.</p>
      <div class="info-box">
        <p><strong>Credit Summary:</strong></p>
        <p>✅ Monthly Credits: <strong>${monthlyCredits} credits</strong></p>
        <p>💎 Top-Up Credits: <strong>${topUpCredits} credits</strong> (never expire)</p>
        <p>📊 Total Available: <strong>${monthlyCredits + topUpCredits} credits</strong></p>
        <p>📅 Next Reset: ${formattedDate}</p>
      </div>
      <p>You're all set to continue your interview preparation journey!</p>
      <div style="text-align: center;">
        <a href="${billingUrl}" class="button">View Billing Dashboard</a>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Your ${planType} Credits Have Been Reset - P3 Interview Academy`,
    html: getEmailTemplate(content),
  };

  await getTransporter().sendMail(mailOptions);
  console.log(`[email] Credit reset notification sent to ${email}`);
}

/**
 * Send subscription started email (after successful upgrade)
 */
export async function sendSubscriptionStartedEmail(
  email: string,
  name: string,
  planType: 'PRO' | 'ADVANCED',
  monthlyCredits: number,
  pricePerMonth: number,
  nextBillingDate: Date
): Promise<void> {
  const safeName = escapeHtml(name);
  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const billingUrl = `${getAppUrl()}/billing`;
  const formattedDate = nextBillingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const content = `
    <div class="content">
      <h2>Welcome to ${planType}! 🎉</h2>
      <p>Hi ${safeName},</p>
      <p>Thank you for upgrading to ${planType} tier! Your subscription is now active.</p>
      <div class="info-box">
        <p><strong>Subscription Details:</strong></p>
        <p>📦 Plan: <strong>${planType}</strong></p>
        <p>⚡ Monthly Credits: <strong>${monthlyCredits} credits</strong></p>
        <p>💰 Price: <strong>$${pricePerMonth}/month</strong></p>
        <p>📅 Next Billing: ${formattedDate}</p>
      </div>
      <p>Your credits have been added to your account and are ready to use!</p>
      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="button">Start Practicing Now</a>
      </div>
      <p style="text-align: center; margin-top: 16px;">
        <a href="${billingUrl}" style="color: #667eea; text-decoration: none;">Manage your subscription →</a>
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Welcome to ${planType} - P3 Interview Academy`,
    html: getEmailTemplate(content),
  };

  await getTransporter().sendMail(mailOptions);
  console.log(`[email] Subscription started notification sent to ${email}`);
}

/**
 * Send payment succeeded email (subscription renewal)
 */
export async function sendPaymentSucceededEmail(
  email: string,
  name: string,
  amount: number,
  invoiceUrl: string,
  nextBillingDate: Date
): Promise<void> {
  const safeName = escapeHtml(name);
  const formattedDate = nextBillingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const content = `
    <div class="content">
      <h2>Payment Received ✅</h2>
      <p>Hi ${safeName},</p>
      <p>Your subscription payment has been processed successfully.</p>
      <div class="info-box">
        <p><strong>Payment Details:</strong></p>
        <p>💳 Amount: <strong>$${amount.toFixed(2)}</strong></p>
        <p>📅 Next Billing: ${formattedDate}</p>
        <p>📄 <a href="${invoiceUrl}" style="color: #667eea;">Download Invoice</a></p>
      </div>
      <p>Thank you for continuing with P3 Interview Academy!</p>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Payment Received - P3 Interview Academy',
    html: getEmailTemplate(content),
  };

  await getTransporter().sendMail(mailOptions);
  console.log(`[email] Payment succeeded notification sent to ${email}`);
}

/**
 * Send payment failed email (dunning management)
 */
export async function sendPaymentFailedEmail(
  email: string,
  name: string,
  amount: number,
  retryDate: Date
): Promise<void> {
  const safeName = escapeHtml(name);
  const billingUrl = `${getAppUrl()}/billing`;
  const formattedDate = retryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const content = `
    <div class="content">
      <h2>Payment Failed - Action Required ⚠️</h2>
      <p>Hi ${safeName},</p>
      <p>We were unable to process your subscription payment of $${amount.toFixed(2)}.</p>
      <div class="info-box">
        <p><strong>What happens next:</strong></p>
        <p>🔄 We'll automatically retry on ${formattedDate}</p>
        <p>⚡ Your account remains active during this period</p>
        <p>💳 Please update your payment method to avoid service interruption</p>
      </div>
      <p>Update your payment method now to ensure uninterrupted access:</p>
      <div style="text-align: center;">
        <a href="${billingUrl}" class="button">Update Payment Method</a>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Payment Failed - Update Required - P3 Interview Academy',
    html: getEmailTemplate(content),
  };

  await getTransporter().sendMail(mailOptions);
  console.log(`[email] Payment failed notification sent to ${email}`);
}

/**
 * Send top-up purchase confirmation email
 */
export async function sendTopUpPurchaseEmail(
  email: string,
  name: string,
  credits: number,
  amount: number
): Promise<void> {
  const safeName = escapeHtml(name);
  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const billingUrl = `${getAppUrl()}/billing`;

  const content = `
    <div class="content">
      <h2>Credits Added Successfully! 💎</h2>
      <p>Hi ${safeName},</p>
      <p>Your credit top-up purchase has been completed.</p>
      <div class="info-box">
        <p><strong>Purchase Summary:</strong></p>
        <p>⚡ Credits Added: <strong>${credits} credits</strong></p>
        <p>💰 Amount Paid: <strong>$${amount.toFixed(2)}</strong></p>
        <p>✨ <strong>These credits never expire!</strong></p>
      </div>
      <p>Your credits are now available in your account and ready to use.</p>
      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="button">Start Using Credits</a>
      </div>
      <p style="text-align: center; margin-top: 16px;">
        <a href="${billingUrl}" style="color: #667eea; text-decoration: none;">View billing history →</a>
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
    to: email,
    subject: `${credits} Credits Added to Your Account - P3 Interview Academy`,
    html: getEmailTemplate(content),
  };

  await getTransporter().sendMail(mailOptions);
  console.log(`[email] Top-up purchase confirmation sent to ${email}`);
}

/**
 * Send low credits warning email (when balance < 20%)
 */
export async function sendLowCreditsWarningEmail(
  email: string,
  name: string,
  currentCredits: number,
  planType: string
): Promise<void> {
  const safeName = escapeHtml(name);
  const billingUrl = `${getAppUrl()}/billing`;

  const content = `
    <div class="content">
      <h2>Running Low on Credits ⚠️</h2>
      <p>Hi ${safeName},</p>
      <p>Your credit balance is running low. You currently have <strong>${currentCredits} credits</strong> remaining.</p>
      <div class="info-box">
        <p><strong>Options to get more credits:</strong></p>
        <p>📦 Upgrade your plan for more monthly credits</p>
        <p>💎 Purchase a one-time credit top-up (never expires)</p>
        ${planType === 'FREE' ? '<p>🎯 FREE tier resets to 50 credits monthly</p>' : '<p>🔄 Your credits reset automatically each month</p>'}
      </div>
      <p>Don't let low credits interrupt your interview preparation!</p>
      <div style="text-align: center;">
        <a href="${billingUrl}" class="button">Get More Credits</a>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Low Credits Alert - P3 Interview Academy',
    html: getEmailTemplate(content),
  };

  await getTransporter().sendMail(mailOptions);
  console.log(`[email] Low credits warning sent to ${email}`);
}

/**
 * Send subscription canceled email
 */
export async function sendSubscriptionCanceledEmail(
  email: string,
  name: string,
  planType: string,
  effectiveDate: Date
): Promise<void> {
  const safeName = escapeHtml(name);
  const billingUrl = `${getAppUrl()}/billing`;
  const formattedDate = effectiveDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const content = `
    <div class="content">
      <h2>Subscription Canceled</h2>
      <p>Hi ${safeName},</p>
      <p>Your ${planType} subscription has been canceled.</p>
      <div class="info-box">
        <p><strong>What happens next:</strong></p>
        <p>📅 Active until: ${formattedDate}</p>
        <p>🔄 After that, you'll be moved to the FREE tier (50 credits/month)</p>
        <p>💎 Your top-up credits will be preserved</p>
        <p>✅ You can resubscribe anytime</p>
      </div>
      <p>We're sorry to see you go! If you change your mind, you can reactivate your subscription at any time.</p>
      <div style="text-align: center;">
        <a href="${billingUrl}" class="button">Reactivate Subscription</a>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Subscription Canceled - P3 Interview Academy',
    html: getEmailTemplate(content),
  };

  await getTransporter().sendMail(mailOptions);
  console.log(`[email] Subscription canceled notification sent to ${email}`);
}

/**
 * Send free tier welcome email (new user signup)
 */
export async function sendFreeTierWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const safeName = escapeHtml(name);
  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const billingUrl = `${getAppUrl()}/billing`;

  const content = `
    <div class="content">
      <h2>Welcome to P3 Interview Academy! 🎉</h2>
      <p>Hi ${safeName},</p>
      <p>Your account has been created successfully! You're starting with the FREE tier.</p>
      <div class="info-box">
        <p><strong>What's included:</strong></p>
        <p>⚡ <strong>50 free credits</strong> every month</p>
        <p>🔄 Credits reset automatically on the 1st of each month</p>
        <p>✨ Access to all core features:</p>
        <p style="margin-left: 20px;">• AI-powered interview practice</p>
        <p style="margin-left: 20px;">• Preparation session generator</p>
        <p style="margin-left: 20px;">• Performance analytics</p>
      </div>
      <p>Ready to start your interview preparation journey?</p>
      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="button">Start Practicing Now</a>
      </div>
      <p style="text-align: center; margin-top: 16px;">
        <a href="${billingUrl}" style="color: #667eea; text-decoration: none;">Explore premium plans →</a>
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'P3 Interview Academy'}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Welcome to P3 Interview Academy - Get Started!',
    html: getEmailTemplate(content),
  };

  await getTransporter().sendMail(mailOptions);
  console.log(`[email] Free tier welcome email sent to ${email}`);
}
