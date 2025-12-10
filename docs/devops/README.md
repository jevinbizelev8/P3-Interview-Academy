# DevOps Documentation

This directory contains comprehensive DevOps documentation for infrastructure handoff and candidate evaluation.

---

## Documents Overview

### Internal Documentation (Confidential)

**DEVOPS_HANDOFF_REPORT.md**
- **Purpose**: Complete infrastructure handoff for internal DevOps team/contractors
- **Audience**: Hired DevOps engineers with full access
- **Content**: Full technical details, environment specifics, credentials locations
- **Sensitivity**: HIGH - Contains RDS hostnames, database usernames, environment names
- **Usage**: Share only after hiring/NDA

**STAGING_ARCHITECTURE_DIAGRAM.md**
- **Purpose**: Detailed technical architecture diagrams and specifications
- **Audience**: Internal team and hired DevOps engineers
- **Content**: Complete system architecture, API structure, deployment flows
- **Sensitivity**: HIGH - Full infrastructure details
- **Usage**: Reference for internal team and contractors with access

**DEVOPS_CANDIDATE_PACKAGE.md**
- **Purpose**: Candidate assessment and interview preparation
- **Audience**: DevOps engineer candidates during interview process
- **Content**: Redacted architecture, role expectations, technical scenarios
- **Sensitivity**: MEDIUM - Infrastructure details redacted
- **Usage**: Share during technical interviews (requires confidentiality agreement)

### External/Root Documents

**DEVOPS_PROPOSAL_BRIEF.md** (kept in root directory)
- **Purpose**: High-level brief for consultant proposals
- **Audience**: External consultants preparing proposals (e.g., VJ)
- **Content**: Business challenges, priorities, scope, questions to address
- **Sensitivity**: LOW - High-level only, no sensitive technical details
- **Usage**: Share freely with potential DevOps consultants/contractors

---

## Document Selection Guide

**When hiring a full-time DevOps engineer:**
1. Share `DEVOPS_CANDIDATE_PACKAGE.md` during interviews
2. After hiring, provide `DEVOPS_HANDOFF_REPORT.md` and `STAGING_ARCHITECTURE_DIAGRAM.md`

**When engaging a consultant/contractor:**
1. Share `DEVOPS_PROPOSAL_BRIEF.md` for proposal development
2. After engagement agreement, provide full internal documentation

**When onboarding internal team:**
- All documents available
- Reference `STAGING_ARCHITECTURE_DIAGRAM.md` for architecture understanding
- Use `DEVOPS_HANDOFF_REPORT.md` for operational procedures

---

## Maintenance

**Document Owners**: AI Engineering Team

**Update Frequency**:
- Internal docs: Update after major infrastructure changes
- Candidate package: Update quarterly or when role requirements change
- Proposal brief: Update as priorities shift

**Related Documentation**:
- `/DEPLOYMENT.md` - Deployment procedures and workflows
- `/SECURITY.md` - Security best practices and incident history
- `/CLAUDE.md` - Project overview and current status
- `/docs/ops-log/` - Monthly operational logs

---

**Last Updated**: December 2025
**Version**: 1.0
