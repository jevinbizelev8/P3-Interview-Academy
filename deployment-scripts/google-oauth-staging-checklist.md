# Google OAuth Staging Checklist

## Environment Variables
- Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` on Elastic Beanstalk staging.
- Point `GOOGLE_CALLBACK_URL` to `https://p3app-staging.bizelev8.ai/api/auth/google/callback` (or the active staging host).
- Configure optional overrides:
  - `GOOGLE_SUCCESS_REDIRECT` → `/dashboard`
  - `GOOGLE_FAILURE_REDIRECT` → `/?authError=google`
- Enable the client toggle: `VITE_ENABLE_GOOGLE_OAUTH=true` in the staging `.env` and bundle environment.

## Verification Steps
1. Redeploy the staging bundle after updating environment variables.
2. Click **Continue with Google** on the staging login modal; confirm Google consent screen appears.
3. Complete consent with a test Google account.
4. Verify the callback lands on the redirect target, session cookie is set, and `/api/auth/user` returns the Google profile.
5. Confirm account linking:
   - Create a password account with the same email.
   - Re-run Google login and ensure the existing account upgrades `authProvider` to `both`.
6. Trigger an error (e.g., deny consent) and verify the login modal surfaces the `authError=google` message.

## Rollback Advice
- Toggle `VITE_ENABLE_GOOGLE_OAUTH=false` to hide the button without removing server routes.
- Clear Elastic Beanstalk environment variables to disable Google OAuth entirely.
