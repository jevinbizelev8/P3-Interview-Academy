#!/bin/bash

##############################################################################
# RDS Snapshot Backup Script
#
# Creates a timestamped snapshot of the RDS database instance before
# applying migrations or major changes.
#
# Usage:
#   ./deployment-scripts/backup-rds.sh [environment]
#
# Arguments:
#   environment - Optional: staging|production (default: production)
#
# Environment Variables:
#   AWS_REGION - AWS region (default: ap-southeast-1)
#   DB_INSTANCE_ID - RDS instance identifier
#
# Exit codes:
#   0 - Snapshot created successfully
#   1 - Snapshot creation failed
#   2 - Invalid arguments or configuration
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
AWS_REGION="${AWS_REGION:-ap-southeast-1}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Determine DB instance ID based on environment
case "$ENVIRONMENT" in
  staging|stg)
    DB_INSTANCE_ID="${DB_INSTANCE_ID:-p3-interview-academy-staging-db}"
    SNAPSHOT_PREFIX="p3-staging"
    ;;
  production|prod)
    DB_INSTANCE_ID="${DB_INSTANCE_ID:-p3-rds-production}"
    SNAPSHOT_PREFIX="p3-prod"
    ;;
  *)
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "   Usage: $0 [staging|production]"
    exit 2
    ;;
esac

SNAPSHOT_ID="${SNAPSHOT_PREFIX}-migration-backup-${TIMESTAMP}"

# Function to print colored output
print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Function to check if AWS CLI is installed
check_aws_cli() {
  if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    echo "   Install it from: https://aws.amazon.com/cli/"
    exit 2
  fi
}

# Function to check AWS credentials
check_aws_credentials() {
  if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured or invalid"
    echo "   Run: aws configure"
    exit 2
  fi
}

# Function to verify DB instance exists
verify_db_instance() {
  print_info "Verifying DB instance: $DB_INSTANCE_ID"

  if ! aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --region "$AWS_REGION" \
    --output json &> /dev/null; then
    print_error "DB instance not found: $DB_INSTANCE_ID"
    exit 2
  fi

  print_success "DB instance verified"
}

# Function to get DB instance status
get_db_status() {
  aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text
}

# Function to create snapshot
create_snapshot() {
  local status
  status=$(get_db_status)

  print_info "Current DB status: $status"

  if [ "$status" != "available" ]; then
    print_warning "DB instance is not in 'available' state"
    print_warning "Current state: $status"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_info "Snapshot creation cancelled"
      exit 0
    fi
  fi

  print_info "Creating snapshot: $SNAPSHOT_ID"
  print_info "This may take several minutes..."

  aws rds create-db-snapshot \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --db-snapshot-identifier "$SNAPSHOT_ID" \
    --region "$AWS_REGION" \
    --tags "Key=Environment,Value=$ENVIRONMENT" \
           "Key=Purpose,Value=pre-migration-backup" \
           "Key=CreatedBy,Value=backup-rds-script" \
           "Key=Timestamp,Value=$TIMESTAMP" \
    --output json > /dev/null

  print_success "Snapshot creation initiated"
}

# Function to wait for snapshot completion
wait_for_snapshot() {
  print_info "Waiting for snapshot to complete..."

  local max_wait=1800  # 30 minutes
  local elapsed=0
  local interval=15

  while [ $elapsed -lt $max_wait ]; do
    local snapshot_status
    snapshot_status=$(aws rds describe-db-snapshots \
      --db-snapshot-identifier "$SNAPSHOT_ID" \
      --region "$AWS_REGION" \
      --query 'DBSnapshots[0].Status' \
      --output text 2>/dev/null || echo "not-found")

    case "$snapshot_status" in
      available)
        print_success "Snapshot completed successfully!"
        return 0
        ;;
      creating)
        local progress
        progress=$(aws rds describe-db-snapshots \
          --db-snapshot-identifier "$SNAPSHOT_ID" \
          --region "$AWS_REGION" \
          --query 'DBSnapshots[0].PercentProgress' \
          --output text 2>/dev/null || echo "0")
        echo -ne "\r${BLUE}⏳ Progress: ${progress}%${NC}"
        ;;
      failed|deleting)
        echo ""
        print_error "Snapshot creation failed with status: $snapshot_status"
        return 1
        ;;
      not-found)
        echo ""
        print_error "Snapshot not found. It may have been deleted."
        return 1
        ;;
    esac

    sleep $interval
    elapsed=$((elapsed + interval))
  done

  echo ""
  print_error "Snapshot creation timed out after ${max_wait} seconds"
  return 1
}

# Function to get snapshot details
get_snapshot_details() {
  print_info "Snapshot Details:"

  local details
  details=$(aws rds describe-db-snapshots \
    --db-snapshot-identifier "$SNAPSHOT_ID" \
    --region "$AWS_REGION" \
    --output json)

  local size
  local create_time

  size=$(echo "$details" | grep -o '"AllocatedStorage": [0-9]*' | grep -o '[0-9]*')
  create_time=$(echo "$details" | grep -o '"SnapshotCreateTime": "[^"]*"' | cut -d'"' -f4)

  echo "   Snapshot ID: $SNAPSHOT_ID"
  echo "   DB Instance: $DB_INSTANCE_ID"
  echo "   Region: $AWS_REGION"
  echo "   Size: ${size:-Unknown} GB"
  echo "   Created: ${create_time:-Unknown}"
  echo "   Environment: $ENVIRONMENT"
}

# Function to output restore command
print_restore_instructions() {
  echo ""
  print_info "To restore from this snapshot in the future:"
  echo ""
  echo "   aws rds restore-db-instance-from-db-snapshot \\"
  echo "     --db-instance-identifier ${DB_INSTANCE_ID}-restored \\"
  echo "     --db-snapshot-identifier $SNAPSHOT_ID \\"
  echo "     --region $AWS_REGION"
  echo ""
  print_warning "Note: Restore creates a new instance. You'll need to:"
  echo "   1. Wait for the new instance to become available"
  echo "   2. Update your application's DATABASE_URL"
  echo "   3. Optionally delete the old instance"
}

# Function to save snapshot info to file
save_snapshot_info() {
  local info_file="deployment-scripts/snapshots/${ENVIRONMENT}-latest-snapshot.txt"
  mkdir -p "deployment-scripts/snapshots"

  cat > "$info_file" <<EOF
# Latest RDS Snapshot - $ENVIRONMENT
# Created: $(date)

SNAPSHOT_ID=$SNAPSHOT_ID
DB_INSTANCE_ID=$DB_INSTANCE_ID
AWS_REGION=$AWS_REGION
TIMESTAMP=$TIMESTAMP
ENVIRONMENT=$ENVIRONMENT

# Restore command:
aws rds restore-db-instance-from-db-snapshot \\
  --db-instance-identifier ${DB_INSTANCE_ID}-restored \\
  --db-snapshot-identifier $SNAPSHOT_ID \\
  --region $AWS_REGION
EOF

  print_success "Snapshot info saved to: $info_file"
}

# Main execution
main() {
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║        P3 Interview Academy - RDS Backup Script            ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""

  print_info "Environment: $ENVIRONMENT"
  print_info "DB Instance: $DB_INSTANCE_ID"
  print_info "AWS Region: $AWS_REGION"
  print_info "Snapshot ID: $SNAPSHOT_ID"
  echo ""

  # Pre-flight checks
  check_aws_cli
  check_aws_credentials
  verify_db_instance

  echo ""
  print_warning "This will create a snapshot of the RDS database."
  print_warning "The database will remain online and operational."
  read -p "Continue? (y/N): " -n 1 -r
  echo ""

  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Backup cancelled"
    exit 0
  fi

  # Create snapshot
  create_snapshot

  # Wait for completion (optional - can be skipped with --no-wait flag)
  if [[ "${NO_WAIT:-false}" != "true" ]]; then
    wait_for_snapshot

    if [ $? -eq 0 ]; then
      get_snapshot_details
      save_snapshot_info
      print_restore_instructions

      echo ""
      echo "╔════════════════════════════════════════════════════════════╗"
      echo "║              ✅ SNAPSHOT CREATED SUCCESSFULLY              ║"
      echo "╚════════════════════════════════════════════════════════════╝"
      exit 0
    else
      exit 1
    fi
  else
    print_info "Snapshot creation initiated. Not waiting for completion."
    print_info "Check status with: aws rds describe-db-snapshots --db-snapshot-identifier $SNAPSHOT_ID"
    exit 0
  fi
}

# Run main function
main
