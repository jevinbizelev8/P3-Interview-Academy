# Database Migration - Quick Reference Card

## One-Line Commands

```bash
# Staging migration (with approval)
./scripts/telegram/integrations/db-migrate-p3.sh --staging

# Production migration (with approval)
./scripts/telegram/integrations/db-migrate-p3.sh --production

# Direct migration (no approval - dev only)
npm run db:push
```

## Telegram Reply Format

When you receive approval request:

```
# Approve migration
approve a1b2c3d4e5f6g7h8

# Reject migration
reject a1b2c3d4e5f6g7h8
```

Replace `a1b2c3d4e5f6g7h8` with actual token from notification.

## Workflow Overview

```
1. Developer modifies shared/schema.ts
2. Run: ./scripts/telegram/integrations/db-migrate-p3.sh --staging
3. Review schema diff in Telegram
4. Reply: approve <token>
5. Script applies migration
6. Success notification sent
```

## Safety Checklist

Before approving migration:

- [ ] Schema diff reviewed and understood
- [ ] Changes tested locally first
- [ ] Rollback procedure known
- [ ] Team notified (for production)
- [ ] Backup confirmed (for production)

## Emergency Rollback

```bash
# Option 1: Schema reversion (preferred)
# 1. Revert changes in shared/schema.ts
# 2. Run migration script again

# Option 2: Manual SQL (emergency)
psql $DATABASE_URL
# Then execute rollback SQL

# Option 3: Database restore (last resort)
aws rds describe-db-snapshots --db-instance-identifier p3-interview-rds
# Contact DevOps for snapshot restore
```

## Troubleshooting

| Issue | Quick Fix |
|-------|-----------|
| Timeout | Check bot is running, retry migration |
| No notification | Run `notifyctl on` |
| Script not executable | `chmod +x db-migrate-p3.sh` |
| Database connection failed | Check `$DATABASE_URL` |

## Files & Directories

```
scripts/telegram/integrations/
├── db-migrate-p3.sh           # Main migration script
├── README_DB_MIGRATE.md       # Full documentation
├── TESTING_DB_MIGRATE.md      # Testing guide
└── QUICK_REFERENCE_DB_MIGRATE.md  # This file

Project root:
├── .pending/                  # Active approval tokens
├── .inbox/                    # User responses
└── .notify.enabled            # Notification status
```

## Exit Codes

- `0` - Success or no changes
- `1` - Migration failed or rejected
- `2` - Invalid arguments

## Tips

- **Always test in staging first**
- **Never skip approval in production**
- **Keep schema.ts changes atomic** (one logical change per migration)
- **Document migrations in ops-log**
- **Coordinate with team for production changes**

## Related Commands

```bash
# Preview schema diff without applying
npx drizzle-kit push --print

# Check current database schema
psql $DATABASE_URL -c "\dt"

# Enable/disable notifications
notifyctl on   # Enable
notifyctl off  # Disable (silent mode)

# Check notification status
ls -la .notify.enabled
```
