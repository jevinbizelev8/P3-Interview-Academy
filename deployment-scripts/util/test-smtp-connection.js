/**
 * Simple SMTP connection test
 * Tests if we can connect to Gmail SMTP with the provided credentials
 */

import nodemailer from 'nodemailer';

// Use environment variables for security
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_FROM;
const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

if (!smtpUser || !smtpPass) {
  console.error('❌ Error: SMTP credentials not found in environment variables');
  console.error('   Required: SMTP_USER and SMTP_PASS');
  console.error('   Set them before running this script:');
  console.error('   export SMTP_USER="your-email@domain.com"');
  console.error('   export SMTP_PASS="your-app-password"');
  process.exit(1);
}

const config = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  requireTLS: true,
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
};

console.log('🔍 Testing SMTP Connection to Gmail');
console.log('====================================\n');
console.log('Configuration:');
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  Secure: ${config.secure}`);
console.log(`  User: ${config.auth.user}`);
console.log(`  Password: ${'*'.repeat(Math.min(config.auth.pass.length, 16))} (${config.auth.pass.length} chars)`);
console.log('');

async function testSMTP() {
  try {
    console.log('Creating transporter...');
    const transporter = nodemailer.createTransport(config);

    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: '"P3 Interview Academy" <support@bizelev8.ai>',
      to: 'support@bizelev8.ai',
      subject: 'Test Email from P3 Interview Academy',
      text: 'This is a test email to verify SMTP is working correctly.',
      html: '<p>This is a test email to verify SMTP is working correctly.</p>'
    });

    console.log('✅ Email sent successfully!');
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  Response: ${info.response}`);
    console.log('');
    console.log('🎉 SMTP is working correctly!');
    console.log('   The issue must be elsewhere in the application code.');

  } catch (error) {
    console.error('❌ SMTP test failed!');
    console.error(`   Error: ${error.message}`);
    console.error('');
    console.error('Full error details:');
    console.error(error);
    console.error('');
    console.error('Possible causes:');
    console.error('1. Gmail app password is incorrect or revoked');
    console.error('2. Gmail account has blocked less secure apps');
    console.error('3. Gmail account requires additional verification');
    console.error('4. Network/firewall blocking SMTP connection');
    console.error('5. Gmail rate limiting or suspicious activity detection');
  }
}

testSMTP().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
