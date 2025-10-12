Security Group Admin Access Review

Context
- SG: sg-001f27516b6d736bf (RDS ingress 5432)
- Current admin IP: 121.7.122.45/32
- EB SG access preserved (sg-0e84d19aee0533fa1)

Action (by 2025-12-12)
- Confirm the admin /32 still needed. If not, remove it.
- If the admin IP changed, replace the rule rather than adding duplicates.
- Ensure no 0.0.0.0/0 rules exist on 5432.

Commands
- List rules:
  aws ec2 describe-security-group-rules --filters Name=group-id,Values=sg-001f27516b6d736bf
- Remove old IP:
  aws ec2 revoke-security-group-ingress --group-id sg-001f27516b6d736bf --protocol tcp --port 5432 --cidr <old_ip>/32

Notes
- Consider migrating RDS to private subnets (PubliclyAccessible=false) as a follow-up.
