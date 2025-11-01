# Statusline Documentation Index

**Quick navigation for all statusline documentation**

---

## 🚀 Start Here

**New to the statusline?** Read these first:

1. **[README.md](README.md)** - Quick overview (5 min read)
2. **[USAGE_INSTRUCTIONS.md](../../.claude/USAGE_INSTRUCTIONS.md)** - Daily usage guide (10 min read)
3. **Container restart?** Run: `~/workspace/.claude/restore-config.sh`

---

## 📚 Documentation Structure

### Essential (Read First)

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[README.md](README.md)** | Overview and quick links | First time setup |
| **[GUIDE.md](GUIDE.md)** | Complete user guide | Learning the system |
| **[MASTER_KNOWLEDGE_BASE.md](MASTER_KNOWLEDGE_BASE.md)** | Consolidated reference | Everything in one place |

### Daily Reference

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[USAGE_INSTRUCTIONS.md](../../.claude/USAGE_INSTRUCTIONS.md)** | Quick command reference | Daily operations |
| **[QUICK_FIX_INSTRUCTIONS.md](../../.claude/QUICK_FIX_INSTRUCTIONS.md)** | Copy-paste troubleshooting | When something breaks |
| **[.claude/README.md](../../.claude/README.md)** | Quick file map | Finding files |

### Technical Deep Dive

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md](REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md)** | 36KB technical analysis | Understanding persistence |
| **[REPLIT_PERSISTENCE_ANALYSIS.md](REPLIT_PERSISTENCE_ANALYSIS.md)** | Filesystem architecture | DevOps troubleshooting |
| **[PRICING_REFERENCE.md](PRICING_REFERENCE.md)** | AWS cost breakdown | Budget planning |

### Implementation History

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** | Research findings | Understanding decisions |
| **[INVESTIGATION_SUMMARY.md](INVESTIGATION_SUMMARY.md)** | Problem analysis | Learning from issues |
| **[FIX_COMPLETE.md](FIX_COMPLETE.md)** | User-friendly summary | Quick status check |
| **[VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)** | Testing procedures | QA validation |
| **[REPLIT_QUICK_FIX.md](REPLIT_QUICK_FIX.md)** | Quick troubleshooting | Common issues |

---

## 🎯 By Use Case

### "I just want to use it"
1. [README.md](README.md) - Overview
2. [USAGE_INSTRUCTIONS.md](../../.claude/USAGE_INSTRUCTIONS.md) - Commands
3. Done! Run `~/workspace/.claude/restore-config.sh` after restarts

### "I need to troubleshoot"
1. [QUICK_FIX_INSTRUCTIONS.md](../../.claude/QUICK_FIX_INSTRUCTIONS.md) - Common fixes
2. [GUIDE.md](GUIDE.md) - Detailed troubleshooting section
3. [REPLIT_QUICK_FIX.md](REPLIT_QUICK_FIX.md) - Replit-specific issues

### "I want to understand how it works"
1. [MASTER_KNOWLEDGE_BASE.md](MASTER_KNOWLEDGE_BASE.md) - Complete reference
2. [REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md](REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md) - Technical deep dive
3. [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Design decisions

### "I need to modify it"
1. [MASTER_KNOWLEDGE_BASE.md](MASTER_KNOWLEDGE_BASE.md) - Architecture section
2. [GUIDE.md](GUIDE.md) - Customization guide
3. Source code: `~/.claude/statusline-command.sh`

### "I'm managing costs"
1. [PRICING_REFERENCE.md](PRICING_REFERENCE.md) - AWS pricing
2. [MASTER_KNOWLEDGE_BASE.md](MASTER_KNOWLEDGE_BASE.md) - Cost analysis section
3. State file: `~/workspace/.claude/data/usage-stats.json`

---

## 📊 Documentation Stats

| Category | Files | Total Size | Status |
|----------|-------|------------|--------|
| Essential | 3 | ~45KB | ✅ Complete |
| Daily Reference | 3 | ~15KB | ✅ Complete |
| Technical | 3 | ~60KB | ✅ Complete |
| Historical | 5 | ~50KB | ✅ Complete |
| **Total** | **14 files** | **~170KB** | **✅ Complete** |

---

## 🔍 Find Specific Information

### Commands
- Restoration: [USAGE_INSTRUCTIONS.md](../../.claude/USAGE_INSTRUCTIONS.md) → "After Container Restart"
- Health check: [QUICK_FIX_INSTRUCTIONS.md](../../.claude/QUICK_FIX_INSTRUCTIONS.md) → "Health Check"
- Cost viewing: [MASTER_KNOWLEDGE_BASE.md](MASTER_KNOWLEDGE_BASE.md) → "Command Reference"

### Concepts
- Replit persistence: [REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md](REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md) → "Replit's Two Filesystems"
- Token extraction: [MASTER_KNOWLEDGE_BASE.md](MASTER_KNOWLEDGE_BASE.md) → "Technical Implementation"
- Weekly calculation: [MASTER_KNOWLEDGE_BASE.md](MASTER_KNOWLEDGE_BASE.md) → "Weekly Aggregation"
- AWS pricing: [PRICING_REFERENCE.md](PRICING_REFERENCE.md) → "AWS Bedrock Pricing"

### Files
- Script location: [.claude/README.md](../../.claude/README.md) → "File Locations"
- State file format: [MASTER_KNOWLEDGE_BASE.md](MASTER_KNOWLEDGE_BASE.md) → "State File Format"
- Configuration: [GUIDE.md](GUIDE.md) → "Configuration"

### Troubleshooting
- All zeros: [QUICK_FIX_INSTRUCTIONS.md](../../.claude/QUICK_FIX_INSTRUCTIONS.md) → "Problem: All costs show $0.00"
- Version drift: [REPLIT_QUICK_FIX.md](REPLIT_QUICK_FIX.md) → "Version Sync"
- Weekly total wrong: [MASTER_KNOWLEDGE_BASE.md](MASTER_KNOWLEDGE_BASE.md) → "Problem History"

---

## 🛠️ Scripts & Tools

| Script | Location | Purpose |
|--------|----------|---------|
| `restore-config.sh` | `~/workspace/.claude/` | Restore after container restart |
| `check-health.sh` | `~/workspace/.claude/` | Verify configuration |
| `aliases.sh` | `~/workspace/.claude/` | Convenience aliases |
| `statusline-command.sh` | `~/.claude/` (active) | Main script |
| `statusline-command.sh` | `~/workspace/.claude/` (backup) | Persistent backup |

---

## 📅 Maintenance Schedule

### Daily
- No action required (automatic)
- If container restarts: Run `~/workspace/.claude/restore-config.sh`

### Weekly
- (Optional) Run `~/workspace/.claude/check-health.sh`
- Review costs: `cat ~/workspace/.claude/data/usage-stats.json | jq .`

### Monthly
- Review [ops-log/](../ops-log/) for updates
- Check for script updates in git
- Archive old cost data if needed

### After Editing Script
- Sync versions: `cp ~/.claude/statusline-command.sh ~/workspace/.claude/`
- Test: `~/workspace/.claude/check-health.sh`
- Commit: `git add .claude/ && git commit && git push`

---

## 🎓 Learning Path

### Beginner (15 minutes)
1. Read [README.md](README.md)
2. Bookmark `~/workspace/.claude/restore-config.sh` command
3. Run `~/workspace/.claude/check-health.sh` to see current status

### Intermediate (1 hour)
1. Read [GUIDE.md](GUIDE.md) sections 1-4
2. Read [USAGE_INSTRUCTIONS.md](../../.claude/USAGE_INSTRUCTIONS.md)
3. Practice restoration: `~/workspace/.claude/restore-config.sh`
4. Review state file: `cat ~/workspace/.claude/data/usage-stats.json | jq .`

### Advanced (3+ hours)
1. Read [MASTER_KNOWLEDGE_BASE.md](MASTER_KNOWLEDGE_BASE.md) completely
2. Read [REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md](REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md)
3. Study script source: `~/.claude/statusline-command.sh`
4. Review [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
5. Practice custom modifications

---

## 🔗 External Resources

- **AWS Bedrock Pricing**: https://aws.amazon.com/bedrock/pricing/
- **Claude Code Docs**: https://docs.claude.com/en/docs/claude-code/
- **Replit Docs**: https://docs.replit.com/
- **ISO 8601 Week**: https://en.wikipedia.org/wiki/ISO_week_date

---

## 📞 Support

**Quick Fixes**:
1. Run health check: `~/workspace/.claude/check-health.sh`
2. Check [QUICK_FIX_INSTRUCTIONS.md](../../.claude/QUICK_FIX_INSTRUCTIONS.md)
3. Review debug log: `tail -50 ~/workspace/.claude/data/statusline-debug.log`

**Still Stuck?**
- Check [GUIDE.md](GUIDE.md) → "Troubleshooting" section
- Review [REPLIT_QUICK_FIX.md](REPLIT_QUICK_FIX.md)
- Consult [MASTER_KNOWLEDGE_BASE.md](MASTER_KNOWLEDGE_BASE.md) → "Common Workflows"

---

**Index Version**: 1.0
**Last Updated**: 2025-11-01
**Status**: ✅ Complete
**Total Documentation**: 14 files, ~170KB
