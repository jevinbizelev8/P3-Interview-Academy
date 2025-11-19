# Founder UAT Testing - Quick Start Guide

**Environment**: Staging (Test Mode)
**URL**: https://p3app-staging.bizelev8.ai
**Test Card**: 4242 4242 4242 4242

---

## Quick Test Instructions

### Test 1: Buy 100 Credits ($10)
1. Login to staging
2. Find "Buy Credits" or similar button
3. Select "100 Credits" option
4. Complete Stripe checkout with test card: **4242 4242 4242 4242**
5. Verify +100 credits added to your account

### Test 2: Buy 500 Credits ($45)
Repeat Test 1 with "500 Credits" option

### Test 3: Buy 2000 Credits ($160)
Repeat Test 1 with "2000 Credits" option

---

## Stripe Test Card Details

**Card Number**: `4242 4242 4242 4242`
**Expiry**: Any future date (e.g., `12/25`)
**CVC**: Any 3 digits (e.g., `123`)
**ZIP**: Any 5 digits (e.g., `12345`)

---

## What to Check

✅ **Success Criteria**:
- Stripe checkout page opens correctly
- Payment completes without errors
- Credits added to account immediately
- Can see transaction in history
- Can use credits for practice sessions

❌ **Report if you see**:
- Checkout page doesn't load
- Payment fails despite using test card
- Credits don't update after payment
- Error messages anywhere in the flow
- Webhook errors in Stripe Dashboard

---

## Monitoring Your Tests

### Check Stripe Dashboard
https://dashboard.stripe.com/test/webhooks/we_1SQMkQRYjG8QUIcydUOPT29V

Look for:
- ✅ Green checkmarks (webhook delivered successfully)
- ❌ Red X marks (webhook failed - report this)

### Check Application
- Credit balance should update within 1-2 seconds
- Transaction history should show new purchase
- No error messages should appear

---

## Need Help?

**Detailed Instructions**: See `STRIPE_STAGING_VERIFICATION_REPORT.md`

**Common Issues**:
1. **Credits not added**: Check Stripe Dashboard webhook status
2. **Checkout doesn't open**: Check browser console for errors
3. **Payment declined**: Ensure using exact test card number above

**Support**:
- Check browser console (F12 → Console tab) for JavaScript errors
- Check Stripe Dashboard for webhook delivery status
- Review application logs if you have AWS access

---

**Quick Status**: ✅ All Stripe configuration verified and ready for testing
