/**
 * Simple SMTP connection test
 * Tests if we can connect to Gmail SMTP with the provided credentials
 */

import nodemailer from 'nodemailer';

const config = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: 'support@bizelev8.ai',
    pass: 'qgmf zwmk ofis srlx'
  },
  tls: {
    rejectUnauthorized: false
  }
};

console.log('🔍 Testing SMTP Connection to Gmail');
console.log('====================================\n');
console.log('Configuration:');
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  Secure: ${config.secure}`);
console.log(`  User: ${config.auth.user}`);
console.log(`  Password: ${config.auth.pass.substring(0, 4)}...${config.auth.pass.substring(config.auth.pass.length - 4)}`);
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
