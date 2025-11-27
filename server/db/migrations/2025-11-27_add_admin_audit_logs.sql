-- Admin Audit Logging System
-- Phase 2: Security Improvements for Admin Console
-- Created: 2025-11-27

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON admin_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_logs(action);

-- Retention policy function (optional - 90 days)
CREATE OR REPLACE FUNCTION delete_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE admin_audit_logs IS 'Audit trail for all admin actions in the system';
COMMENT ON COLUMN admin_audit_logs.admin_id IS 'UUID of the admin who performed the action';
COMMENT ON COLUMN admin_audit_logs.action IS 'Type of action performed (e.g., ADD_CREDITS, BULK_USER_ACTION)';
COMMENT ON COLUMN admin_audit_logs.target_user_id IS 'UUID of the user affected by the action (if applicable)';
COMMENT ON COLUMN admin_audit_logs.details IS 'JSON object with request/response details and metadata';
COMMENT ON COLUMN admin_audit_logs.ip_address IS 'IP address of the admin at the time of action';
COMMENT ON COLUMN admin_audit_logs.user_agent IS 'Browser/client user agent string';
