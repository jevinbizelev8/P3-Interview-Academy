# Database Migration Approval Script

## Overview

`db-migrate-p3.sh` wraps Drizzle Kit migrations with Telegram approval for safety.

This script provides a secure approval workflow for database schema changes, preventing accidental or unauthorized modifications to staging and production databases.

## Usage

### Staging Migration
```bash
./scripts/telegram/integrations/db-migrate-p3.sh --staging
```

### Production Migration
```bash
./scripts/telegram/integrations/db-migrate-p3.sh --production
```

### Default (Staging)
```bash
./scripts/telegram/integrations/db-migrate-p3.sh
```

## Workflow

1. **Schema Diff**: Shows preview of database changes using `drizzle-kit push --print`
2. **Approval Request**: Sends notification to Telegram with diff and secure token
3. **Wait for Reply**: 5-minute timeout for human review
4. **Apply Changes**: Only if explicitly approved with correct token
5. **Confirmation**: Success/failure notification sent to Telegram

```
┌─────────────────────┐
│  Run db-migrate-p3  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Fetch Schema Diff  │
└──────────┬──────────┘
           │
           ▼
      Any changes?
           │
    No ────┴──── Yes
    │              │
    ▼              ▼
  Exit   ┌─────────────────────┐
         │ Send Telegram Alert │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Await Reply (5min) │
         └──────────┬──────────┘
                    │
            ┌───────┴───────┐
            │               │
        Approve          Reject
            │               │
            ▼               ▼
    ┌──────────────┐   ┌────────┐
    │ npm db:push  │   │  Exit  │
    └──────┬───────┘   └────────┘
           │
           ▼
    ┌──────────────┐
    │  Notify Done │
    └──────────────┘
```

## Silent Mode

If notifications are disabled (`notifyctl off`):
- Script runs migration immediately without approval
- Useful for local development
- **Never use in production**

## Examples

### Example 1: Adding New Table

```bash
$ ./scripts/telegram/integrations/db-migrate-p3.sh --staging

🗄️  Database Migration - Staging
════════════════════════════════════════════
Fetching schema changes...
📱 Approval request sent to Telegram
Waiting for response...
✅ Migration APPROVED - proceeding...
✅ Migration completed successfully
```

**Telegram Notification:**
```
🗄️ Database Migration Approval Required

Environment: Staging (p3_staging)
Timestamp: 2025-11-01 10:30:45

Schema Changes:
```
CREATE TABLE user_badges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW()
);
```

⚠️ WARNING: These changes will be applied to Staging database.

To approve, reply:
`approve a1b2c3d4e5f6g7h8`

To reject, reply:
`reject a1b2c3d4e5f6g7h8`

Timeout: 5 minutes
```

### Example 2: Rejection

```bash
$ ./scripts/telegram/integrations/db-migrate-p3.sh --production

🗄️  Database Migration - Production
════════════════════════════════════════════
Fetching schema changes...
📱 Approval request sent to Telegram
Waiting for response...
❌ Migration REJECTED by user
```

### Example 3: No Changes

```bash
$ ./scripts/telegram/integrations/db-migrate-p3.sh --staging

🗄️  Database Migration - Staging
════════════════════════════════════════════
Fetching schema changes...
✅ No schema changes detected
```

### Example 4: Timeout

```bash
$ ./scripts/telegram/integrations/db-migrate-p3.sh --production

🗄️  Database Migration - Production
════════════════════════════════════════════
Fetching schema changes...
📱 Approval request sent to Telegram
Waiting for response...
⏰ Approval timeout (5 minutes)
```

## Rollback Procedures

If migration causes issues, you have several options:

### Option 1: Schema Reversion (Recommended)
1. **Revert schema changes** in `shared/schema.ts`
2. **Run migration again** to apply reverted schema:
   ```bash
   ./scripts/telegram/integrations/db-migrate-p3.sh --staging
   ```
3. **Test thoroughly** before applying to production

### Option 2: Manual SQL Rollback
If schema reversion isn't feasible:

1. **Connect to database:**
   ```bash
   psql $DATABASE_URL
   ```

2. **Execute rollback SQL** (example for dropping table):
   ```sql
   DROP TABLE IF EXISTS user_badges;
   ```

3. **Update schema.ts** to match database state

### Option 3: Database Restore (Last Resort)
For production emergencies:

1. **Identify backup snapshot:**
   ```bash
   aws rds describe-db-snapshots --db-instance-identifier p3-interview-rds
   ```

2. **Restore from snapshot** (see DEPLOYMENT.md)

3. **Notify team** of data loss window

## Best Practices

### ✅ DO:
- **Always test in staging first**
- **Review schema diff carefully before approving**
- **Keep backups** of production database (7-day retention active)
- **Test rollback procedure** in staging environment
- **Document migration** in ops-log with timestamp and changes
- **Coordinate with team** for production migrations

### ❌ DON'T:
- **Never skip approval** for production migrations
- **Never run with notifications off** in production
- **Never approve without reading diff**
- **Never migrate production without staging test**
- **Never forget to update ops-log**

## Security Features

1. **Secure Tokens**: 16-character random hex tokens (128-bit entropy)
2. **Time-Limited**: 5-minute approval window
3. **One-Time Use**: Tokens expire after single use
4. **Environment Separation**: Explicit staging/production flags
5. **Audit Trail**: All actions logged to Telegram

## Troubleshooting

### "Approval timeout (5 minutes)"
- Check Telegram bot is running
- Verify `.notify.enabled` file exists
- Check network connectivity

### "Migration command failed"
- Review database logs
- Check DATABASE_URL environment variable
- Verify database connectivity
- Review schema diff for syntax errors

### "No schema changes detected"
- Schema already matches database state
- Previous migration already applied
- Check if you're targeting correct environment

## Integration with CI/CD

This script is designed for **manual migrations only**. For CI/CD:
- Staging migrations can be automated in PR workflow
- Production migrations require manual approval
- Consider adding to `deploy-main.yml` workflow with manual trigger

## Related Documentation

- **CLAUDE.md**: Database commands and architecture
- **DEPLOYMENT.md**: Deployment procedures and database setup
- **shared/schema.ts**: Drizzle ORM schema definitions
- **scripts/telegram/core/**: Core notification infrastructure
