# Database Migration: Add external_transaction_id Column

**Date**: 2025-12-02
**Status**: ⚠️ REQUIRED BEFORE DEPLOYMENT
**Priority**: CRITICAL (Security Fix)

---

## Overview

This migration adds the `external_transaction_id` column to the `credit_transactions` table. This column is **critical** for implementing Stripe webhook idempotency, which prevents double-crediting users when duplicate webhooks are received.

## Why This is Critical

**Security Issue Fixed**: Without this column, duplicate Stripe webhooks could result in:
- Users being credited multiple times for a single payment
- Revenue loss for the platform
- User balance corruption

**Related Commits**:
- `1089528b` - Implemented Stripe idempotency checks
- `5dcf9b27` - Phase 9 Testing completion

---

## Migration SQL

```sql
-- Add external_transaction_id column to credit_transactions table
-- This column stores Stripe session IDs or other external transaction identifiers
ALTER TABLE credit_transactions
ADD COLUMN IF NOT EXISTS external_transaction_id VARCHAR(255) UNIQUE;
```

---

## Execution Instructions

### Staging Environment (p3_staging database)

**REQUIRED**: This must be run on staging before the staging deployment is fully functional.

```bash
# Connect to staging database
psql postgresql://app_user:ZgVs0A8jEJurQezzkp37txtJ@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/p3_staging

# Run migration
ALTER TABLE credit_transactions
ADD COLUMN IF NOT EXISTS external_transaction_id VARCHAR(255) UNIQUE;

# Verify column was added
\d credit_transactions

# Check for any errors
SELECT COUNT(*) FROM credit_transactions WHERE external_transaction_id IS NOT NULL;
-- Should return 0 for existing records
```

### Production Environment (postgres database)

**REQUIRED**: Run this after staging validation is complete.

```bash
# Connect to production database
psql postgresql://app_user_prod:REPLACE_WITH_PASSWORD@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/postgres

# Run migration
ALTER TABLE credit_transactions
ADD COLUMN IF NOT EXISTS external_transaction_id VARCHAR(255) UNIQUE;

# Verify column was added
\d credit_transactions

# Check for any errors
SELECT COUNT(*) FROM credit_transactions WHERE external_transaction_id IS NOT NULL;
-- Should return 0 for existing records
```

---

## Verification Steps

After running the migration:

1. **Check column exists**:
   ```sql
   SELECT column_name, data_type, character_maximum_length, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'credit_transactions'
   AND column_name = 'external_transaction_id';
   ```

2. **Check unique constraint**:
   ```sql
   SELECT constraint_name, constraint_type
   FROM information_schema.table_constraints
   WHERE table_name = 'credit_transactions'
   AND constraint_name LIKE '%external_transaction_id%';
   ```

3. **Test Stripe webhook**:
   - Use Stripe CLI to trigger test webhook
   - Verify credit transaction is created with external_transaction_id
   - Retry webhook and verify duplicate is rejected

---

## Rollback Plan

If issues occur, the column can be safely removed (since it starts as NULL for all existing records):

```sql
-- Rollback: Remove the column
ALTER TABLE credit_transactions
DROP COLUMN IF EXISTS external_transaction_id;
```

**Note**: Rollback should only be done if the deployment is also rolled back, as the new code expects this column to exist.

---

## Testing Checklist

After migration on staging:

- [ ] Column added successfully
- [ ] Unique constraint is active
- [ ] Health endpoint returns 200
- [ ] Database connectivity verified
- [ ] Test Stripe webhook (using Stripe CLI)
- [ ] Verify idempotency (retry webhook, check no duplicate credit)
- [ ] Check CloudWatch logs for errors
- [ ] Run smoke tests
- [ ] Founder UAT validation (10,020 credits available)

After migration on production:

- [ ] All staging checklist items verified
- [ ] Production health endpoint returns 200
- [ ] Monitor first real Stripe webhook
- [ ] Check for any duplicate transaction errors
- [ ] Verify user credit balance is correct

---

## Alternative Execution Methods

### Option 1: AWS Systems Manager Session Manager

```bash
# Start session to EB instance
aws ssm start-session --target <instance-id>

# Install PostgreSQL client
sudo yum install postgresql -y

# Run migration
psql <database-url> -c "ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS external_transaction_id VARCHAR(255) UNIQUE;"
```

### Option 2: Bastion Host

If you have a bastion host with database access:

```bash
# SSH to bastion
ssh bastion-host

# Run migration
psql <database-url> -c "ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS external_transaction_id VARCHAR(255) UNIQUE;"
```

### Option 3: AWS RDS Query Editor (if enabled)

1. Navigate to RDS console
2. Select the database instance
3. Click "Query Editor"
4. Connect to the database
5. Run the migration SQL

---

## Impact Analysis

### Risk Level: **LOW**

- **Schema Change**: Adding a nullable column with unique constraint
- **Data Impact**: No existing data is modified (all values start as NULL)
- **Performance Impact**: Minimal (single column addition)
- **Downtime Required**: No downtime (online DDL operation)

### Backwards Compatibility: **YES**

- Existing code will continue to work (column is nullable)
- New code requires this column for Stripe idempotency
- Column can be safely rolled back if needed

---

## Related Documentation

- **Pull Request**: https://github.com/jevinbizelev8/P3-Interview-Academy/pull/16
- **Security Fix Commit**: `1089528b`
- **Phase 9 Report**: `/home/runner/workspace/PHASE_9_TESTING_COMPLETE.md`
- **Schema File**: `/home/runner/workspace/shared/schema.ts`

---

## Support

If you encounter any issues during migration:

1. Check database connection: `psql <database-url> -c "SELECT 1;"`
2. Verify RDS security groups allow your IP
3. Check CloudWatch logs for application errors
4. Contact maintainer with error details

---

**Migration Script**: `/home/runner/workspace/deployment-scripts/util/add-external-transaction-id-column.js`

**Status**: ⚠️ Awaiting execution on staging and production databases
