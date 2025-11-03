# Cron Setup Guide for Telegram Maintenance

This guide shows how to set up automated cleanup using cron.

## 📅 Quick Setup

### 1. Edit Crontab
```bash
crontab -e
```

### 2. Add Cleanup Job
Add this line to run cleanup hourly:
```bash
# Telegram cleanup - runs every hour at minute 0
0 * * * * /home/runner/workspace/scripts/telegram/tools/cleanup.sh >> /tmp/telegram_cron.log 2>&1
```

### 3. Save and Exit
- **vim**: Press `ESC`, type `:wq`, press `Enter`
- **nano**: Press `Ctrl+X`, then `Y`, then `Enter`

### 4. Verify Cron Job
```bash
crontab -l
```

You should see your new job listed.

---

## 🕐 Cron Schedule Examples

### Basic Schedules
```bash
# Every hour at minute 0
0 * * * * /path/to/cleanup.sh

# Every 2 hours
0 */2 * * * /path/to/cleanup.sh

# Every 6 hours
0 */6 * * * /path/to/cleanup.sh

# Daily at 3am
0 3 * * * /path/to/cleanup.sh

# Every day at midnight
0 0 * * * /path/to/cleanup.sh

# Every Sunday at 2am
0 2 * * 0 /path/to/cleanup.sh

# First day of every month at midnight
0 0 1 * * /path/to/cleanup.sh
```

### Advanced Schedules
```bash
# Weekdays at 9am
0 9 * * 1-5 /path/to/cleanup.sh

# Every 30 minutes
*/30 * * * * /path/to/cleanup.sh

# Multiple times per day
0 8,12,16,20 * * * /path/to/cleanup.sh
```

---

## 📊 Recommended Schedule

For production use, we recommend:

```bash
# Hourly cleanup (keeps directories lean)
0 * * * * /home/runner/workspace/scripts/telegram/tools/cleanup.sh >> /tmp/telegram_cron.log 2>&1

# Daily status report (sent to email or log)
0 8 * * * /home/runner/workspace/scripts/telegram/tools/monitor.sh --no-color >> /tmp/telegram_daily_status.log 2>&1

# Weekly webhook health check
0 0 * * 0 /home/runner/workspace/scripts/telegram/tools/webhook_info.sh >> /tmp/telegram_webhook_check.log 2>&1
```

---

## 🔍 Testing Cron Jobs

### Test Before Scheduling
Always test scripts manually first:
```bash
# Test cleanup in dry-run mode
./scripts/telegram/tools/cleanup.sh --dry-run

# Test monitor
./scripts/telegram/tools/monitor.sh

# Check webhook
./scripts/telegram/tools/webhook_info.sh
```

### Test Cron Execution
Run your cron command manually to verify:
```bash
# This is exactly what cron will run
/home/runner/workspace/scripts/telegram/tools/cleanup.sh >> /tmp/telegram_cron.log 2>&1

# Check the log
tail -20 /tmp/telegram_cron.log
```

---

## 🐛 Troubleshooting Cron

### Problem: Cron job doesn't run
**Solutions**:
1. Check cron service is running:
   ```bash
   sudo service cron status
   # Or on systemd:
   sudo systemctl status cron
   ```

2. Check cron logs:
   ```bash
   grep CRON /var/log/syslog
   # Or:
   sudo tail -f /var/log/cron
   ```

3. Verify crontab syntax:
   ```bash
   crontab -l
   ```

### Problem: Script runs but does nothing
**Solutions**:
1. Check script has execute permissions:
   ```bash
   ls -l /home/runner/workspace/scripts/telegram/tools/cleanup.sh
   # Should show: -rwxr-xr-x
   ```

2. Check environment variables:
   ```bash
   # Cron has minimal environment
   # Add to crontab before your job:
   SHELL=/bin/bash
   PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
   ```

3. Use absolute paths:
   ```bash
   # Good
   0 * * * * /home/runner/workspace/scripts/telegram/tools/cleanup.sh

   # Bad (might not work in cron)
   0 * * * * ./cleanup.sh
   ```

### Problem: Script errors in cron but works manually
**Solutions**:
1. Add environment loading to crontab:
   ```bash
   # Load environment before running
   0 * * * * cd /home/runner/workspace && source scripts/telegram/.env && scripts/telegram/tools/cleanup.sh
   ```

2. Capture stderr to debug:
   ```bash
   # Redirect both stdout and stderr to log
   0 * * * * /path/to/script.sh >> /tmp/cron.log 2>&1
   ```

3. Check script's working directory:
   ```bash
   # Ensure script changes to correct directory
   # cleanup.sh already does this:
   cd "$(dirname "$0")/../../.." || exit 1
   ```

---

## 📧 Email Notifications

### Enable Email Alerts
Cron can email you when jobs run:

```bash
# Add at top of crontab
MAILTO=your-email@example.com

# Now any output from cron jobs will be emailed
0 * * * * /path/to/cleanup.sh
```

### Disable Email Notifications
```bash
# Redirect all output to /dev/null
0 * * * * /path/to/cleanup.sh > /dev/null 2>&1
```

### Conditional Email (only on errors)
```bash
# Only email if exit code != 0
0 * * * * /path/to/cleanup.sh || echo "Cleanup failed at $(date)"
```

---

## 📊 Monitoring Cron Jobs

### Check Last Run Time
```bash
# View cleanup log
tail -20 /tmp/telegram_cleanup.log

# View cron execution log
tail -20 /tmp/telegram_cron.log

# Search for specific date
grep "2025-11-01" /tmp/telegram_cleanup.log
```

### Count Executions
```bash
# Count how many times cleanup ran today
grep "$(date +%Y-%m-%d)" /tmp/telegram_cleanup.log | grep "Cleanup started" | wc -l
```

### Monitor Disk Space Savings
```bash
# Check directory sizes
du -sh /home/runner/workspace/.telegram_messages
du -sh /home/runner/workspace/.inbox

# Track over time
echo "$(date): $(du -sh .telegram_messages)" >> /tmp/disk_usage.log
```

---

## 🔒 Security Considerations

### File Permissions
```bash
# Crontab should be readable only by you
chmod 600 ~/.crontab

# Scripts should be executable but not writable by others
chmod 755 scripts/telegram/tools/*.sh
```

### Environment Variables
```bash
# Don't put secrets directly in crontab
# Bad:
0 * * * * export SECRET=abc123 && /path/to/script.sh

# Good: Load from secure .env file
0 * * * * cd /path && source .env && ./script.sh
```

### Log File Permissions
```bash
# Ensure logs are not world-readable if they contain sensitive data
chmod 600 /tmp/telegram_cleanup.log
```

---

## 📚 Additional Resources

### Cron Syntax Reference
```
* * * * * command
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday=0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Online Tools
- **Crontab Generator**: https://crontab-generator.org/
- **Cron Expression Parser**: https://crontab.guru/

### Man Pages
```bash
# Crontab manual
man crontab

# Cron manual
man cron

# Cron format
man 5 crontab
```

---

## ✅ Quick Checklist

Before setting up cron:

- [ ] Tested script manually with `--dry-run`
- [ ] Tested script without dry-run
- [ ] Verified script has execute permissions (`chmod +x`)
- [ ] Tested with absolute path from any directory
- [ ] Checked logs are writable
- [ ] Verified environment variables are loaded
- [ ] Tested script output redirection works
- [ ] Confirmed disk space for logs
- [ ] Set appropriate log rotation (logrotate)

After setting up cron:

- [ ] Verified cron job added with `crontab -l`
- [ ] Waited for first run (or manually triggered)
- [ ] Checked log file for output
- [ ] Verified cleanup actually removed files
- [ ] Monitored for several cycles
- [ ] Set up log rotation if needed

---

**Last Updated**: 2025-11-01
**Related**: `scripts/telegram/tools/README.md`
