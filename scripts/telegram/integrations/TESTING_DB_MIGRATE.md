# Testing Guide: Database Migration Approval Script

## Overview

This guide provides comprehensive testing instructions for the `db-migrate-p3.sh` script to ensure safe database migrations with Telegram approval.

## Prerequisites

Before testing:
- ✅ Telegram bot configured (`./scripts/telegram/core/init.sh`)
- ✅ Notifications enabled (`notifyctl on`)
- ✅ Staging database accessible
- ✅ Drizzle Kit installed (`npm install`)
- ✅ Test Telegram chat available

## Test Environment Setup

### 1. Create Test Schema Change

Add a test table to `shared/schema.ts`:

```typescript
// Add after existing tables
export const testMigration = pgTable("test_migration", {
  id: uuid("id").defaultRandom().primaryKey(),
  testData: text("test_data"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Important**: This is a safe test change that won't affect existing tables.

### 2. Verify Current Schema

Check current database state:
```bash
npx drizzle-kit push --print
```

You should see SQL statements to create the `test_migration` table.

## Test Cases

### Test Case 1: Approval Flow (Happy Path)

**Objective**: Verify successful migration with approval

**Steps**:
1. Run migration script:
   ```bash
   ./scripts/telegram/integrations/db-migrate-p3.sh --staging
   ```

2. **Expected Output**:
   ```
   🗄️  Database Migration - Staging
   ════════════════════════════════════════════
   Fetching schema changes...
   📱 Approval request sent to Telegram
   Waiting for response...
   ```

3. **Check Telegram**: You should receive notification with:
   - Environment name (Staging)
   - Timestamp
   - Schema diff showing CREATE TABLE statement
   - Approval token (e.g., `a1b2c3d4e5f6g7h8`)
   - Instructions for approve/reject

4. **Approve in Telegram**:
   Reply with: `approve a1b2c3d4e5f6g7h8` (use actual token from message)

5. **Expected Script Output**:
   ```
   ✅ Migration APPROVED - proceeding...
   [Drizzle Kit output]
   ✅ Migration completed successfully
   ```

6. **Check Telegram**: Success notification should arrive

7. **Verify Database**:
   ```bash
   psql $DATABASE_URL -c "\dt test_migration"
   ```
   Table should exist.

**✅ Pass Criteria**:
- Notification received with correct schema diff
- Approval processed successfully
- Migration applied to database
- Success notification sent
- Table exists in database

---

### Test Case 2: Rejection Flow

**Objective**: Verify migration cancellation

**Steps**:
1. Revert previous test (remove table from schema.ts)
2. Run migration script again:
   ```bash
   ./scripts/telegram/integrations/db-migrate-p3.sh --staging
   ```

3. **Expected Output**: Same as Test Case 1

4. **Reject in Telegram**:
   Reply with: `reject a1b2c3d4e5f6g7h8` (use actual token)

5. **Expected Script Output**:
   ```
   ❌ Migration REJECTED by user
   ```

6. **Check Telegram**: Cancellation notification received

7. **Verify Database**:
   ```bash
   psql $DATABASE_URL -c "\dt test_migration"
   ```
   Table should NOT exist (or still exist if reverting creation).

**✅ Pass Criteria**:
- Rejection processed correctly
- Migration NOT applied
- Cancellation notification sent
- Database unchanged

---

### Test Case 3: Timeout Flow

**Objective**: Verify timeout handling

**Steps**:
1. Add test table back to schema.ts
2. Run migration script:
   ```bash
   ./scripts/telegram/integrations/db-migrate-p3.sh --staging
   ```

3. **DO NOT RESPOND** to Telegram notification

4. **Wait 5 minutes**

5. **Expected Script Output**:
   ```
   ⏰ Approval timeout (5 minutes)
   ```

6. **Check Telegram**: Timeout notification received

7. **Verify Database**: Migration NOT applied

**✅ Pass Criteria**:
- Script waits exactly 5 minutes
- Timeout message displayed
- Timeout notification sent
- Migration NOT applied
- Token cleaned up from `.pending/`

---

### Test Case 4: No Changes Scenario

**Objective**: Verify handling when schema matches database

**Steps**:
1. Ensure test table exists in both schema.ts and database (from Test Case 1)
2. Run migration script:
   ```bash
   ./scripts/telegram/integrations/db-migrate-p3.sh --staging
   ```

3. **Expected Output**:
   ```
   🗄️  Database Migration - Staging
   ════════════════════════════════════════════
   Fetching schema changes...
   ✅ No schema changes detected
   ```

4. **Check Telegram**: No notification should be sent

**✅ Pass Criteria**:
- Script exits immediately
- No approval request sent
- Clean exit (exit code 0)

---

### Test Case 5: Silent Mode (Notifications Off)

**Objective**: Verify bypass behavior for local development

**Steps**:
1. Disable notifications:
   ```bash
   notifyctl off
   ```

2. Add new field to test table in schema.ts:
   ```typescript
   export const testMigration = pgTable("test_migration", {
     id: uuid("id").defaultRandom().primaryKey(),
     testData: text("test_data"),
     newField: text("new_field"), // NEW
     createdAt: timestamp("created_at").defaultNow(),
   });
   ```

3. Run migration script:
   ```bash
   ./scripts/telegram/integrations/db-migrate-p3.sh --staging
   ```

4. **Expected Output**:
   ```
   🗄️  Database Migration - Staging
   ════════════════════════════════════════════
   ⚠️  Notifications disabled (notifyctl off)
   Running migration without approval...
   [Drizzle Kit output]
   ```

5. **Verify**: Migration applied immediately without approval

6. **Re-enable notifications**:
   ```bash
   notifyctl on
   ```

**✅ Pass Criteria**:
- Warning displayed about disabled notifications
- Migration runs immediately
- No Telegram notification sent
- Database updated successfully

---

### Test Case 6: Migration Failure Handling

**Objective**: Verify error handling when migration fails

**Steps**:
1. Create invalid schema change in schema.ts:
   ```typescript
   // Add constraint that will fail
   export const invalidTable = pgTable("invalid_table", {
     id: uuid("id").primaryKey(),
     userId: uuid("user_id").references(() => nonExistentTable.id), // References non-existent table
   });
   ```

2. Run migration script:
   ```bash
   ./scripts/telegram/integrations/db-migrate-p3.sh --staging
   ```

3. Approve in Telegram

4. **Expected Script Output**:
   ```
   ✅ Migration APPROVED - proceeding...
   [Drizzle Kit error output]
   ❌ Migration failed
   ```

5. **Check Telegram**: Failure notification with error details

6. **Clean up**: Remove invalid table from schema.ts

**✅ Pass Criteria**:
- Approval processed normally
- Migration attempt made
- Error caught and reported
- Failure notification sent
- Script exits with non-zero code

---

### Test Case 7: Production Environment

**Objective**: Verify production flag handling

**Steps**:
1. Run script with production flag:
   ```bash
   ./scripts/telegram/integrations/db-migrate-p3.sh --production
   ```

2. **Expected Output**:
   ```
   🗄️  Database Migration - Production
   ════════════════════════════════════════════
   ```

3. **Check Telegram**: Notification should show "Production (postgres)"

4. **IMPORTANT**: Reject this migration (test purposes only)

**✅ Pass Criteria**:
- Production environment detected correctly
- Database name displayed as "postgres"
- Warning emphasizes production environment

---

## Verification Checklist

After all tests:

### Database Verification
```bash
# Check staging database
psql $DATABASE_URL -c "\dt"

# Verify test_migration table exists
psql $DATABASE_URL -c "SELECT * FROM test_migration;"

# Check for orphaned data
psql $DATABASE_URL -c "\d+ test_migration"
```

### File System Verification
```bash
# Verify no pending requests
ls -la .pending/

# Verify no orphaned inbox files
ls -la .inbox/
```

### Telegram Bot Verification
```bash
# Check notification status
cat .notify.enabled

# Verify bot configuration
cat .telegram-bot.conf
```

## Rollback Testing

### Test Rollback Procedure

1. **Create rollback scenario**: Apply migration with test table
2. **Revert schema.ts**: Remove test_migration table
3. **Run migration again**:
   ```bash
   ./scripts/telegram/integrations/db-migrate-p3.sh --staging
   ```
4. **Approve**: Should drop the table
5. **Verify**:
   ```bash
   psql $DATABASE_URL -c "\dt test_migration"
   # Should return: "Did not find any relation"
   ```

### Manual Rollback Test

1. **Apply test migration**
2. **Connect to database**:
   ```bash
   psql $DATABASE_URL
   ```
3. **Manual rollback**:
   ```sql
   DROP TABLE IF EXISTS test_migration;
   ```
4. **Update schema.ts** to match
5. **Verify consistency**:
   ```bash
   npx drizzle-kit push --print
   # Should show "No schema changes"
   ```

## Cleanup After Testing

```bash
# Remove test table from schema.ts
# (Delete the testMigration export)

# Run migration to clean up database
./scripts/telegram/integrations/db-migrate-p3.sh --staging
# Approve to drop test table

# Verify cleanup
npx drizzle-kit push --print
# Should show "No schema changes"

# Clean up file system
rm -f .pending/*
rm -f .inbox/*
```

## Common Issues & Solutions

### Issue: "Token not found in inbox"
**Cause**: Token expired or wrong token used
**Solution**: Generate new migration request, use fresh token

### Issue: "Permission denied"
**Cause**: Script not executable
**Solution**: `chmod +x scripts/telegram/integrations/db-migrate-p3.sh`

### Issue: "Telegram notification not received"
**Cause**: Bot not configured or notifications disabled
**Solution**:
- Check `notifyctl on`
- Verify `.notify.enabled` exists
- Check `.telegram-bot.conf`

### Issue: "Database connection failed"
**Cause**: Invalid DATABASE_URL or network issue
**Solution**:
- Verify environment variable: `echo $DATABASE_URL`
- Test connection: `psql $DATABASE_URL -c "SELECT 1;"`

### Issue: "Schema diff too long"
**Cause**: Many changes exceeding Telegram message limit
**Solution**: Script automatically truncates to 3000 chars

## Success Criteria Summary

All tests should pass with:
- ✅ Approval flow works correctly
- ✅ Rejection cancels migration
- ✅ Timeout handled gracefully
- ✅ No-changes scenario exits cleanly
- ✅ Silent mode bypasses approval
- ✅ Failure notifications sent correctly
- ✅ Production environment recognized
- ✅ Rollback procedures work
- ✅ No orphaned tokens or files
- ✅ Database state matches schema

## Continuous Testing

Add to your workflow:
```bash
# Before committing schema changes
npm run db:push  # Direct Drizzle command

# For staging deployments
./scripts/telegram/integrations/db-migrate-p3.sh --staging

# For production deployments
./scripts/telegram/integrations/db-migrate-p3.sh --production
```

## Related Documentation

- `README_DB_MIGRATE.md` - Usage documentation
- `CLAUDE.md` - Database architecture
- `shared/schema.ts` - Schema definitions
- `scripts/telegram/core/test-suite.sh` - Core system tests
