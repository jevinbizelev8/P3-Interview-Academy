import 'dotenv/config';
import crypto from 'crypto';
import { verifyEmailTransport } from '../../server/services/email-service';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../server/services/email-service';

function sanitizeGmailAppPassword() {
  if (process.env.SMTP_PASS) {
    // Gmail app passwords are 16 chars; users often paste with spaces for readability
    process.env.SMTP_PASS = process.env.SMTP_PASS.replace(/\s+/g, '');
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  sanitizeGmailAppPassword();

  if (args.has('--verify')) {
    const res = await verifyEmailTransport();
    console.log(JSON.stringify({ action: 'verify', ...res }));
    return;
  }

  if (args.has('--send')) {
    const to = process.env.TEST_EMAIL_TARGET || process.argv.find(a => a.includes('@'));
    const firstName = process.env.TEST_EMAIL_NAME || 'Test';
    if (!to) {
      console.error('Missing recipient. Set TEST_EMAIL_TARGET env or pass an email arg.');
      process.exit(2);
    }
    const token = crypto.randomBytes(32).toString('hex');
    console.log(JSON.stringify({ action: 'send', to }));
    await sendVerificationEmail(to, token, firstName);
    console.log(JSON.stringify({ status: 'ok', message: 'sent' }));
    return;
  }

  if (args.has('--send-reset')) {
    const to = process.env.TEST_EMAIL_TARGET || process.argv.find(a => a.includes('@'));
    const firstName = process.env.TEST_EMAIL_NAME || 'Test';
    if (!to) {
      console.error('Missing recipient. Set TEST_EMAIL_TARGET env or pass an email arg.');
      process.exit(2);
    }
    const token = crypto.randomBytes(32).toString('hex');
    console.log(JSON.stringify({ action: 'send-reset', to }));
    await sendPasswordResetEmail(to, token, firstName);
    console.log(JSON.stringify({ status: 'ok', message: 'sent' }));
    return;
  }

  console.log('Usage:');
  console.log('  npm run email:verify');
  console.log('  npm run email:send -- you@example.com');
  console.log('  npm run email:send --send-reset -- you@example.com');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
