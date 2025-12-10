# Critical Test Scenarios - Phase 9

**Purpose**: Detailed test scenarios for revenue-critical and security-critical features

---

## 1. Stripe Webhooks Tests (HIGHEST PRIORITY)

**File**: `server/__tests__/stripe-webhooks.test.ts`
**Why Critical**: Revenue processing, payment webhooks, subscription lifecycle
**Estimated Effort**: 15 tests, 6 hours

---

### Test 1.1: Subscription Checkout Completed
```typescript
it("should handle subscription checkout completion", async () => {
  const checkoutSession = {
    id: "cs_test_123",
    mode: "subscription",
    customer: "cus_test_123",
    subscription: "sub_test_123",
    client_reference_id: TEST_USER_ID,
    metadata: { userId: TEST_USER_ID },
  };

  const event = {
    type: "checkout.session.completed",
    data: { object: checkoutSession },
  };

  const res = await request(app)
    .post("/api/webhooks/stripe")
    .set("stripe-signature", generateSignature(event))
    .send(event);

  expect(res.status).toBe(200);
  // Verify subscription created in database
  // Verify credits added
});
```

---

### Test 1.2: Top-Up Payment Completed
```typescript
it("should handle one-time top-up payment", async () => {
  const checkoutSession = {
    id: "cs_test_456",
    mode: "payment",
    customer: "cus_test_123",
    payment_intent: "pi_test_456",
    client_reference_id: TEST_USER_ID,
    metadata: {
      userId: TEST_USER_ID,
      credits: "100"
    },
  };

  const event = {
    type: "checkout.session.completed",
    data: { object: checkoutSession },
  };

  const res = await request(app)
    .post("/api/webhooks/stripe")
    .set("stripe-signature", generateSignature(event))
    .send(event);

  expect(res.status).toBe(200);

  // Verify top-up credits added
  const credits = await CreditService.getTotalCredits(TEST_USER_ID);
  expect(credits.topUpCredits).toBe(100);

  // Verify transaction created
  const transactions = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, TEST_USER_ID));
  expect(transactions).toHaveLength(1);
  expect(transactions[0].amount).toBe(100);
  expect(transactions[0].type).toBe("purchase");
});
```

---

### Test 1.3: Subscription Created
```typescript
it("should handle new subscription creation", async () => {
  const subscription = {
    id: "sub_test_789",
    customer: "cus_test_123",
    status: "active",
    items: {
      data: [{
        price: { id: "price_basic_monthly" },
        quantity: 1,
      }],
    },
    metadata: { userId: TEST_USER_ID },
  };

  const event = {
    type: "customer.subscription.created",
    data: { object: subscription },
  };

  const res = await request(app)
    .post("/api/webhooks/stripe")
    .set("stripe-signature", generateSignature(event))
    .send(event);

  expect(res.status).toBe(200);

  // Verify subscription record created
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, TEST_USER_ID));
  expect(sub.stripeSubscriptionId).toBe("sub_test_789");
  expect(sub.status).toBe("active");
});
```

---

### Test 1.4: Invoice Payment Succeeded (Renewal)
```typescript
it("should handle successful subscription renewal", async () => {
  // Setup: Create existing subscription
  await db.insert(subscriptions).values({
    userId: TEST_USER_ID,
    stripeSubscriptionId: "sub_test_789",
    status: "active",
    currentPeriodEnd: new Date(Date.now() - 1000), // Expired
  });

  const invoice = {
    id: "in_test_123",
    customer: "cus_test_123",
    subscription: "sub_test_789",
    amount_paid: 999, // $9.99
    status: "paid",
    billing_reason: "subscription_cycle",
  };

  const event = {
    type: "invoice.payment_succeeded",
    data: { object: invoice },
  };

  const res = await request(app)
    .post("/api/webhooks/stripe")
    .set("stripe-signature", generateSignature(event))
    .send(event);

  expect(res.status).toBe(200);

  // Verify subscription renewed
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, TEST_USER_ID));
  expect(sub.currentPeriodEnd).toBeGreaterThan(new Date());

  // Verify monthly credits reset
  const credits = await CreditService.getTotalCredits(TEST_USER_ID);
  expect(credits.monthlyCredits).toBe(100); // Depends on plan
});
```

---

### Test 1.5: Invoice Payment Failed
```typescript
it("should handle failed subscription payment", async () => {
  const invoice = {
    id: "in_test_456",
    customer: "cus_test_123",
    subscription: "sub_test_789",
    amount_due: 999,
    status: "open",
    attempt_count: 3,
    billing_reason: "subscription_cycle",
  };

  const event = {
    type: "invoice.payment_failed",
    data: { object: invoice },
  };

  const res = await request(app)
    .post("/api/webhooks/stripe")
    .set("stripe-signature", generateSignature(event))
    .send(event);

  expect(res.status).toBe(200);

  // Verify subscription status updated
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, TEST_USER_ID));
  expect(sub.status).toBe("past_due");

  // Verify user notified (check notification record)
});
```

---

### Test 1.6: Subscription Deleted (Cancelled)
```typescript
it("should handle subscription cancellation", async () => {
  const subscription = {
    id: "sub_test_789",
    customer: "cus_test_123",
    status: "canceled",
    cancel_at_period_end: false,
    canceled_at: Math.floor(Date.now() / 1000),
    metadata: { userId: TEST_USER_ID },
  };

  const event = {
    type: "customer.subscription.deleted",
    data: { object: subscription },
  };

  const res = await request(app)
    .post("/api/webhooks/stripe")
    .set("stripe-signature", generateSignature(event))
    .send(event);

  expect(res.status).toBe(200);

  // Verify subscription cancelled
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, TEST_USER_ID));
  expect(sub.status).toBe("canceled");
  expect(sub.canceledAt).toBeTruthy();
});
```

---

### Test 1.7: Missing Webhook Signature (Security)
```typescript
it("should reject webhook without signature", async () => {
  const event = {
    type: "checkout.session.completed",
    data: { object: {} },
  };

  const res = await request(app)
    .post("/api/webhooks/stripe")
    // No stripe-signature header
    .send(event);

  expect(res.status).toBe(400);
  expect(res.text).toContain("Missing signature");
});
```

---

### Test 1.8: Invalid Webhook Signature (Security)
```typescript
it("should reject webhook with invalid signature", async () => {
  const event = {
    type: "checkout.session.completed",
    data: { object: {} },
  };

  const res = await request(app)
    .post("/api/webhooks/stripe")
    .set("stripe-signature", "invalid_signature")
    .send(event);

  expect(res.status).toBe(400);
  expect(res.text).toContain("Webhook Error");
});
```

---

### Test 1.9: Duplicate Event (Idempotency)
```typescript
it("should handle duplicate webhook events idempotently", async () => {
  const checkoutSession = {
    id: "cs_test_duplicate",
    mode: "payment",
    metadata: { userId: TEST_USER_ID, credits: "50" },
  };

  const event = {
    id: "evt_duplicate_123",
    type: "checkout.session.completed",
    data: { object: checkoutSession },
  };

  // Send webhook twice
  const res1 = await request(app)
    .post("/api/webhooks/stripe")
    .set("stripe-signature", generateSignature(event))
    .send(event);

  const res2 = await request(app)
    .post("/api/webhooks/stripe")
    .set("stripe-signature", generateSignature(event))
    .send(event);

  expect(res1.status).toBe(200);
  expect(res2.status).toBe(200);

  // Verify credits only added once
  const credits = await CreditService.getTotalCredits(TEST_USER_ID);
  expect(credits.topUpCredits).toBe(50); // Not 100

  // Verify only one transaction
  const transactions = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, TEST_USER_ID));
  expect(transactions).toHaveLength(1);
});
```

---

### Test 1.10: Unknown Event Type
```typescript
it("should ignore unknown webhook event types", async () => {
  const event = {
    type: "customer.tax_id.created", // Unhandled event
    data: { object: {} },
  };

  const res = await request(app)
    .post("/api/webhooks/stripe")
    .set("stripe-signature", generateSignature(event))
    .send(event);

  expect(res.status).toBe(200);
  // Should log but not error
});
```

---

## 2. Admin Routes Tests (HIGH PRIORITY)

**File**: `server/__tests__/admin.routes.test.ts`
**Why Critical**: Phase 3.5 security fixes, user management, credit management
**Estimated Effort**: 20 tests, 8 hours

---

### Test 2.1: List Users with Pagination
```typescript
it("should list users with pagination", async () => {
  // Create 25 test users
  const users = Array.from({ length: 25 }, (_, i) => ({
    email: `user${i}@example.com`,
    name: `User ${i}`,
  }));
  await db.insert(usersTable).values(users);

  const res = await request(app)
    .get("/api/admin/users?page=1&limit=10")
    .set("Authorization", `Bearer ${adminToken}`)
    .expect(200);

  expect(res.body.success).toBe(true);
  expect(res.body.data.users).toHaveLength(10);
  expect(res.body.data.pagination.total).toBe(25);
  expect(res.body.data.pagination.page).toBe(1);
  expect(res.body.data.pagination.pages).toBe(3);
});
```

---

### Test 2.2: Search Users by Email
```typescript
it("should search users by email", async () => {
  await db.insert(usersTable).values([
    { email: "alice@example.com", name: "Alice" },
    { email: "bob@example.com", name: "Bob" },
    { email: "charlie@example.com", name: "Charlie" },
  ]);

  const res = await request(app)
    .get("/api/admin/users?search=alice")
    .set("Authorization", `Bearer ${adminToken}`)
    .expect(200);

  expect(res.body.data.users).toHaveLength(1);
  expect(res.body.data.users[0].email).toBe("alice@example.com");
});
```

---

### Test 2.3: Adjust User Credits (Add)
```typescript
it("should add credits to user account", async () => {
  const [user] = await db.insert(usersTable).values({
    email: "test@example.com",
  }).returning();

  const res = await request(app)
    .post("/api/admin/credits/adjust")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      userId: user.id,
      amount: 100,
      reason: "Customer support credit grant",
    })
    .expect(200);

  expect(res.body.success).toBe(true);

  // Verify credits added
  const credits = await CreditService.getTotalCredits(user.id);
  expect(credits.topUpCredits).toBe(100);

  // Verify transaction created
  const [transaction] = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, user.id));
  expect(transaction.amount).toBe(100);
  expect(transaction.type).toBe("admin_adjustment");
  expect(transaction.reason).toBe("Customer support credit grant");
});
```

---

### Test 2.4: Audit Log Created on Credit Adjustment
```typescript
it("should create audit log for credit adjustment", async () => {
  const [user] = await db.insert(usersTable).values({
    email: "test@example.com",
  }).returning();

  await request(app)
    .post("/api/admin/credits/adjust")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      userId: user.id,
      amount: 50,
      reason: "Test adjustment",
    })
    .expect(200);

  // Verify audit log created
  const [log] = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, ADMIN_USER_ID));

  expect(log.action).toBe("admin.credits.adjust");
  expect(log.resourceId).toBe(user.id);
  expect(log.details).toContain("50 credits");
});
```

---

### Test 2.5: Non-Admin Cannot Access Admin Routes
```typescript
it("should reject non-admin users", async () => {
  const res = await request(app)
    .get("/api/admin/users")
    .set("Authorization", `Bearer ${userToken}`) // Regular user token
    .expect(403);

  expect(res.body.message).toContain("Admin access required");
});
```

---

### Test 2.6: Rate Limiting (60 req/min)
```typescript
it("should enforce rate limiting (60 req/min)", async () => {
  // Send 61 requests in quick succession
  const requests = Array.from({ length: 61 }, () =>
    request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
  );

  const responses = await Promise.all(requests);

  // First 60 should succeed
  const successful = responses.filter(r => r.status === 200);
  expect(successful.length).toBe(60);

  // 61st should be rate limited
  const rateLimited = responses.filter(r => r.status === 429);
  expect(rateLimited.length).toBeGreaterThanOrEqual(1);
  expect(rateLimited[0].body.message).toContain("Too many requests");
});
```

---

### Test 2.7: CSRF Protection (Referrer Validation)
```typescript
it("should validate referrer for CSRF protection", async () => {
  const res = await request(app)
    .post("/api/admin/credits/adjust")
    .set("Authorization", `Bearer ${adminToken}`)
    .set("Referer", "https://malicious-site.com") // Invalid referrer
    .send({
      userId: TEST_USER_ID,
      amount: 100,
      reason: "Test",
    })
    .expect(403);

  expect(res.body.message).toContain("Invalid referrer");
});
```

---

### Test 2.8: Input Validation (Negative Amount)
```typescript
it("should reject negative credit amounts", async () => {
  const res = await request(app)
    .post("/api/admin/credits/adjust")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      userId: TEST_USER_ID,
      amount: -50, // Negative amount
      reason: "Test",
    })
    .expect(400);

  expect(res.body.message).toContain("Amount must be positive");
});
```

---

## 3. Credits Routes Tests (HIGH PRIORITY)

**File**: `server/__tests__/credits.routes.test.ts`
**Why Critical**: Core billing feature, user-facing credit balance
**Estimated Effort**: 8 tests, 3 hours

---

### Test 3.1: Get Credit Balance
```typescript
it("should return user credit balance", async () => {
  // Setup: Give user 100 monthly + 50 top-up credits
  await db.insert(subscriptions).values({
    userId: TEST_USER_ID,
    monthlyCredits: 100,
  });
  await db.insert(creditTransactions).values({
    userId: TEST_USER_ID,
    amount: 50,
    type: "purchase",
    balanceAfter: 150,
  });

  const res = await request(app)
    .get("/api/credits/balance")
    .set("Authorization", `Bearer ${userToken}`)
    .expect(200);

  expect(res.body.success).toBe(true);
  expect(res.body.data.totalCredits).toBe(150);
  expect(res.body.data.monthlyCredits).toBe(100);
  expect(res.body.data.topUpCredits).toBe(50);
  expect(res.body.data.breakdown).toBeDefined();
});
```

---

### Test 3.2: Requires Authentication
```typescript
it("should require authentication", async () => {
  const res = await request(app)
    .get("/api/credits/balance")
    // No Authorization header
    .expect(401);

  expect(res.body.message).toContain("Authentication required");
});
```

---

### Test 3.3: Balance After Subscription Renewal
```typescript
it("should return correct balance after renewal", async () => {
  // Setup: User used 80 of 100 monthly credits
  await db.insert(subscriptions).values({
    userId: TEST_USER_ID,
    monthlyCredits: 100,
    creditsUsed: 80,
  });

  // Simulate renewal (reset credits)
  await db.update(subscriptions)
    .set({ creditsUsed: 0, currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
    .where(eq(subscriptions.userId, TEST_USER_ID));

  const res = await request(app)
    .get("/api/credits/balance")
    .set("Authorization", `Bearer ${userToken}`)
    .expect(200);

  expect(res.body.data.monthlyCredits).toBe(100); // Reset to full
});
```

---

## 4. Subscriptions Routes Tests (HIGH PRIORITY)

**File**: `server/__tests__/subscriptions.routes.test.ts`
**Why Critical**: Recurring revenue management
**Estimated Effort**: 12 tests, 5 hours

---

### Test 4.1: Get Current Subscription
```typescript
it("should return current active subscription", async () => {
  await db.insert(subscriptions).values({
    userId: TEST_USER_ID,
    stripeSubscriptionId: "sub_test_123",
    stripePriceId: "price_basic_monthly",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const res = await request(app)
    .get("/api/subscriptions/current")
    .set("Authorization", `Bearer ${userToken}`)
    .expect(200);

  expect(res.body.success).toBe(true);
  expect(res.body.data.subscription.status).toBe("active");
  expect(res.body.data.subscription.stripeSubscriptionId).toBe("sub_test_123");
});
```

---

### Test 4.2: Create Checkout Session
```typescript
it("should create Stripe checkout session", async () => {
  // Mock Stripe API
  mockStripe.checkout.sessions.create.mockResolvedValue({
    id: "cs_test_123",
    url: "https://checkout.stripe.com/test",
  });

  const res = await request(app)
    .post("/api/subscriptions/checkout")
    .set("Authorization", `Bearer ${userToken}`)
    .send({
      priceId: "price_basic_monthly",
    })
    .expect(200);

  expect(res.body.success).toBe(true);
  expect(res.body.data.url).toContain("checkout.stripe.com");
  expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
    expect.objectContaining({
      mode: "subscription",
      customer_email: expect.any(String),
    })
  );
});
```

---

### Test 4.3: Cancel Subscription
```typescript
it("should cancel subscription at period end", async () => {
  await db.insert(subscriptions).values({
    userId: TEST_USER_ID,
    stripeSubscriptionId: "sub_test_123",
    status: "active",
  });

  // Mock Stripe API
  mockStripe.subscriptions.update.mockResolvedValue({
    id: "sub_test_123",
    cancel_at_period_end: true,
  });

  const res = await request(app)
    .post("/api/subscriptions/cancel")
    .set("Authorization", `Bearer ${userToken}`)
    .expect(200);

  expect(res.body.success).toBe(true);

  // Verify database updated
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, TEST_USER_ID));
  expect(sub.cancelAtPeriodEnd).toBe(true);
});
```

---

## 5. Quick Test Helpers

### Stripe Signature Generator
```typescript
function generateWebhookSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");
  return `t=${timestamp},v1=${signature}`;
}
```

### Admin Token Generator
```typescript
async function createAdminToken(): Promise<string> {
  const [admin] = await db.insert(usersTable).values({
    email: "admin@example.com",
    role: "admin",
  }).returning();
  return jwt.sign({ id: admin.id, role: "admin" }, JWT_SECRET);
}
```

### Test Database Cleanup
```typescript
afterEach(async () => {
  await db.delete(creditTransactions).where(eq(creditTransactions.userId, TEST_USER_ID));
  await db.delete(subscriptions).where(eq(subscriptions.userId, TEST_USER_ID));
  await db.delete(usersTable).where(eq(usersTable.id, TEST_USER_ID));
});
```

---

**Last Updated**: 2025-12-02
**Ready for Implementation**: ✅ Yes
