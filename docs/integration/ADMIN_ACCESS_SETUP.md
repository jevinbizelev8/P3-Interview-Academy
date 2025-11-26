# Admin Access Setup Guide

**Last Updated**: 2025-11-26
**Project**: P3 Interview Academy
**Purpose**: Configure admin authentication and dashboard access

---

## Executive Summary

P3 Interview Academy already has a **complete admin authentication system** using Passport.js and role-based access control. This guide documents the existing setup and explains how to:

1. Verify admin access for existing users
2. Grant admin access to new users
3. Configure admin routing
4. Test admin authentication flow

**Key Finding**: The founder's account (`founder@bizelev8.ai`) is already configured as an admin user in the database.

---

## Current Admin Authentication Architecture

### Backend Authentication Stack

**Session-Based Authentication**:
- **Framework**: Passport.js Local Strategy
- **Session Store**: Express-session with database-backed sessions
- **Password Hashing**: bcrypt (10 rounds)
- **Session Security**: Encrypted with `SESSION_SECRET` environment variable

**Files Involved**:
- `server/middleware/auth.ts` - Authentication middleware
- `server/routes/auth.ts` - Login/logout routes
- `server/index.ts` - Passport configuration

### Admin Role Check

**Middleware**: `requireAdmin` (defined in `server/middleware/auth.ts`)

```typescript
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (!req.user?.is_admin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}
```

**How It Works**:
1. Check if user is authenticated (has valid session)
2. Check if user has `is_admin = true` in database
3. Allow access if both conditions met
4. Return 401 (unauthorized) if not logged in
5. Return 403 (forbidden) if logged in but not admin

---

## Database Schema

### Users Table

The `users` table has an `is_admin` column that controls admin access:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  is_admin BOOLEAN DEFAULT FALSE,  -- Admin flag
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Checking Admin Status

**SQL Query**:
```sql
SELECT email, is_admin, is_verified
FROM users
WHERE email = 'founder@bizelev8.ai';
```

**Expected Result** (Founder account):
```
email                | is_admin | is_verified
---------------------|----------|------------
founder@bizelev8.ai  | true     | true
```

---

## Granting Admin Access

### Method 1: Database Update (RECOMMENDED)

**Use Case**: Grant admin access to existing user

**Command** (via psql):
```sql
-- Staging database
UPDATE users
SET is_admin = true, updated_at = NOW()
WHERE email = 'user@example.com';
```

**Verification**:
```sql
SELECT email, is_admin FROM users WHERE email = 'user@example.com';
```

### Method 2: AWS SSM (For Production RDS)

**Use Case**: Update production database from Replit (no direct RDS access)

**Script**: `server/scripts/grant-admin-access.ts`

```typescript
// New file to create
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function grantAdminAccess(email: string) {
  try {
    const result = await db
      .update(users)
      .set({
        is_admin: true,
        updated_at: new Date()
      })
      .where(eq(users.email, email))
      .returning();

    if (result.length === 0) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Admin access granted to: ${email}`);
    console.log(`User ID: ${result[0].id}`);
  } catch (error) {
    console.error('Failed to grant admin access:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: tsx grant-admin-access.ts <email>');
  process.exit(1);
}

grantAdminAccess(email);
```

**Usage**:
```bash
# Run on EC2 instance (has database access)
cd /var/app/current
npx tsx server/scripts/grant-admin-access.ts user@example.com
```

### Method 3: Admin API Endpoint (FUTURE)

**Status**: Not implemented yet (security consideration)

**Proposed Endpoint**: `POST /api/admin/users/:id/grant-admin`

**Security Requirements**:
- Only accessible by super-admin users
- Requires password re-authentication
- Logs all admin grant actions to audit trail
- Rate limited (1 request per minute)

**Implementation** (if needed):
```typescript
// server/routes/admin.ts
router.post("/users/:id/grant-admin", requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { confirm_password } = req.body;

  // Re-authenticate current admin
  const isValid = await bcrypt.compare(confirm_password, req.user!.password);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid password confirmation" });
  }

  // Grant admin access
  const result = await db.update(users)
    .set({ is_admin: true, updated_at: new Date() })
    .where(eq(users.id, id))
    .returning();

  // Audit log
  await db.insert(auditLogs).values({
    action: 'GRANT_ADMIN',
    user_id: id,
    performed_by: req.user!.id,
    timestamp: new Date()
  });

  res.json({ success: true, user: result[0] });
});
```

---

## Admin Routing Configuration

### Backend Routes (EXISTING)

All admin routes are already protected with `requireAdmin` middleware:

**File**: `server/routes/admin.ts`

```typescript
import { Router } from "express";
import { requireAdmin } from "../middleware/auth";

const router = Router();

// Apply admin middleware to ALL routes in this router
router.use(requireAdmin);

// Admin routes
router.get("/users", async (req, res) => { /* ... */ });
router.get("/users/:id", async (req, res) => { /* ... */ });
router.post("/users/:id/credits/add", async (req, res) => { /* ... */ });
router.get("/analytics/users", async (req, res) => { /* ... */ });
router.get("/analytics/usage", async (req, res) => { /* ... */ });

export default router;
```

**Mounted in**: `server/routes.ts`

```typescript
import adminRoutes from "./routes/admin";

// Mount admin routes
app.use("/api/admin", adminRoutes);
```

### Frontend Routes (TO BE CREATED)

**File**: `client/src/App.tsx` (add to existing router)

```typescript
import { Route, Switch } from "wouter";
import AdminDashboard from "@/pages/admin";
import { useAuth } from "@/hooks/useAuth";

function App() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />

      {/* Protected routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/prepare/*" component={PrepareModule} />
      <Route path="/practice/*" component={PracticeModule} />
      <Route path="/perform/*" component={PerformModule} />

      {/* Admin routes (protected) */}
      <Route path="/admin/*">
        {(params) => <AdminDashboard />}
      </Route>
    </Switch>
  );
}
```

### Client-Side Admin Guard

**File**: `client/src/hooks/useAuth.ts` (extend existing hook)

```typescript
import { useQuery } from '@tanstack/react-query';

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin === true
  };
}
```

**Usage in Admin Pages**:

```typescript
// client/src/pages/admin/index.tsx
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";

export default function AdminDashboard() {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login?redirect=/admin" />;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  // Render admin dashboard
  return (
    <AdminLayout>
      {/* Admin content */}
    </AdminLayout>
  );
}
```

---

## Authentication Flow

### Admin Login Flow

```
1. User visits /login
   ↓
2. Enters email + password
   ↓
3. POST /api/auth/login
   ↓
4. Backend verifies credentials (Passport.js)
   ↓
5. Check is_admin flag in database
   ↓
6. Create session (express-session)
   ↓
7. Return user object { id, email, is_admin: true }
   ↓
8. Frontend stores in React Query cache
   ↓
9. Redirect to /admin/dashboard
   ↓
10. AdminDashboard checks isAdmin
    ↓
11. Render admin interface
```

### Admin Access Check Flow

```
Frontend Request: GET /api/admin/users
   ↓
Middleware: requireAdmin()
   ├─ Check req.isAuthenticated() → Session valid?
   │  ├─ NO → Return 401 Unauthorized
   │  └─ YES → Continue
   ├─ Check req.user.is_admin → Admin flag true?
   │  ├─ NO → Return 403 Forbidden
   │  └─ YES → Continue
   ↓
Route Handler: Fetch users from database
   ↓
Response: 200 OK with user data
```

### Session Persistence

**Session Lifetime**:
- Default: 24 hours
- Configurable in `server/index.ts`

**Session Storage**:
- Development: In-memory (MemoryStore)
- Production: Database-backed (PostgreSQL via connect-pg-simple)

**Session Cookie**:
```javascript
{
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}
```

---

## Testing Admin Access

### Test 1: Verify Admin User in Database

**Staging Database**:
```bash
# Connect to staging database
STAGING_DB="postgresql://app_user:PASSWORD@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/p3_staging"

# Check admin status
psql "$STAGING_DB" -c "SELECT email, is_admin, is_verified FROM users WHERE email = 'founder@bizelev8.ai';"
```

**Expected Output**:
```
email                | is_admin | is_verified
---------------------|----------|------------
founder@bizelev8.ai  | t        | t
```

### Test 2: Login as Admin

**Manual Test**:
1. Go to staging URL: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/login`
2. Enter credentials:
   - Email: `founder@bizelev8.ai`
   - Password: `[founder's password]`
3. Click "Login"
4. Verify redirect to dashboard
5. Navigate to `/admin` route
6. Verify admin dashboard loads

**cURL Test**:
```bash
# Login and save session cookie
curl -c cookies.txt -X POST http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"founder@bizelev8.ai","password":"PASSWORD"}'

# Test admin endpoint with session
curl -b cookies.txt http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/admin/users

# Expected: 200 OK with user list
```

### Test 3: Non-Admin Access Denial

**Test with Regular User**:
```bash
# Login as non-admin user
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Try to access admin endpoint
curl -b cookies.txt http://localhost:5000/api/admin/users

# Expected: 403 Forbidden
# {"message":"Admin access required"}
```

### Test 4: Unauthenticated Access Denial

```bash
# No login - access admin endpoint directly
curl http://localhost:5000/api/admin/users

# Expected: 401 Unauthorized
# {"message":"Not authenticated"}
```

---

## Admin Navigation

### Navigation Menu (UI Component)

**File**: `client/src/components/admin/AdminSidebar.tsx`

```typescript
import { Link } from "wouter";
import { Users, BarChart3, Settings, Home } from "lucide-react";

export function AdminSidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">P3 Admin</h1>
      </div>

      <nav className="space-y-2">
        <Link href="/admin/users">
          <a className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-800">
            <Users size={20} />
            <span>User Management</span>
          </a>
        </Link>

        <Link href="/admin/analytics">
          <a className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-800">
            <BarChart3 size={20} />
            <span>Analytics</span>
          </a>
        </Link>

        <Link href="/admin/settings">
          <a className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-800">
            <Settings size={20} />
            <span>Settings</span>
          </a>
        </Link>

        <div className="border-t border-gray-700 my-4"></div>

        <Link href="/dashboard">
          <a className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-800">
            <Home size={20} />
            <span>Back to Dashboard</span>
          </a>
        </Link>
      </nav>
    </aside>
  );
}
```

### Admin Header

**File**: `client/src/components/admin/AdminHeader.tsx`

```typescript
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AdminHeader() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    window.location.href = '/login';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
          <p className="text-sm text-gray-600">Logged in as {user?.email}</p>
        </div>

        <Button variant="outline" onClick={handleLogout}>
          <LogOut size={16} className="mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
```

---

## Security Considerations

### 1. Password Confirmation for Sensitive Actions

**Recommended**: Require password re-authentication for:
- Granting admin access
- Bulk user deletions
- Changing critical settings

**Implementation**:
```typescript
// Before performing sensitive action
router.post("/sensitive-action", requireAdmin, async (req, res) => {
  const { confirm_password } = req.body;

  // Verify current admin's password
  const isValid = await bcrypt.compare(confirm_password, req.user!.password);

  if (!isValid) {
    return res.status(401).json({ message: "Password confirmation failed" });
  }

  // Perform sensitive action
  // ...
});
```

### 2. Session Timeout

**Current**: 24 hours

**Recommendation**: Reduce to 1 hour for admin sessions

```typescript
// server/index.ts
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: req.user?.is_admin
      ? 1 * 60 * 60 * 1000   // 1 hour for admins
      : 24 * 60 * 60 * 1000  // 24 hours for regular users
  }
}));
```

### 3. IP Allowlisting

**Recommendation**: Restrict admin access to known IP addresses

```typescript
// server/middleware/auth.ts
const ALLOWED_ADMIN_IPS = process.env.ADMIN_IPS?.split(',') || [];

export function requireAdminWithIPCheck(req: Request, res: Response, next: NextFunction) {
  // First check admin status
  requireAdmin(req, res, () => {
    // Then check IP
    const clientIP = req.ip || req.connection.remoteAddress;

    if (ALLOWED_ADMIN_IPS.length > 0 && !ALLOWED_ADMIN_IPS.includes(clientIP)) {
      return res.status(403).json({ message: "IP not allowlisted" });
    }

    next();
  });
}
```

### 4. Audit Logging

**Create Audit Log Table**:
```sql
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  target_user_id UUID REFERENCES users(id),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Log All Admin Actions**:
```typescript
async function logAdminAction(
  adminId: string,
  action: string,
  targetUserId?: string,
  details?: any,
  ipAddress?: string
) {
  await db.insert(adminAuditLogs).values({
    admin_id: adminId,
    action,
    target_user_id: targetUserId,
    details,
    ip_address: ipAddress,
    created_at: new Date()
  });
}

// Use in admin routes
router.post("/users/:id/credits/add", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;

  // Add credits
  await creditService.addCredits(id, amount, reason);

  // Log action
  await logAdminAction(
    req.user!.id,
    'ADD_CREDITS',
    id,
    { amount, reason },
    req.ip
  );

  res.json({ success: true });
});
```

---

## Troubleshooting

### Issue 1: "Not authenticated" Error

**Symptoms**: Admin API returns 401 Unauthorized

**Possible Causes**:
1. Session expired (24 hours)
2. Session cookie not sent
3. Session secret changed (invalidates all sessions)

**Solutions**:
```bash
# Check session validity
curl -b cookies.txt http://localhost:5000/api/auth/me

# If invalid, re-login
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### Issue 2: "Admin access required" Error

**Symptoms**: Authenticated user gets 403 Forbidden on admin routes

**Possible Causes**:
1. User's `is_admin` flag is false
2. Database query failed

**Solutions**:
```sql
-- Check admin status
SELECT id, email, is_admin FROM users WHERE email = 'user@example.com';

-- Grant admin access if needed
UPDATE users SET is_admin = true WHERE email = 'user@example.com';
```

### Issue 3: Admin Route Not Found

**Symptoms**: 404 Not Found on `/admin/*` routes

**Possible Causes**:
1. Admin routes not mounted in main router
2. Typo in route path
3. Frontend route not configured

**Solutions**:
```typescript
// Verify backend routes mounted
// server/routes.ts
app.use("/api/admin", adminRoutes); // ✅ Correct

// Verify frontend routes configured
// client/src/App.tsx
<Route path="/admin/*" component={AdminDashboard} /> // ✅ Correct
```

---

## Maintenance Tasks

### Regular Security Audits

**Monthly**:
- [ ] Review admin audit logs
- [ ] Check for unauthorized admin access attempts
- [ ] Verify admin user list (should be 1-3 users max)

**Quarterly**:
- [ ] Rotate session secrets
- [ ] Review and update IP allowlist
- [ ] Test admin authentication flow end-to-end

### Admin User Management

**Adding New Admin**:
```bash
# Step 1: User creates normal account via signup
# Step 2: Super-admin grants admin access via database
psql "$DATABASE_URL" -c "UPDATE users SET is_admin = true WHERE email = 'new_admin@example.com';"

# Step 3: Verify
psql "$DATABASE_URL" -c "SELECT email, is_admin FROM users WHERE email = 'new_admin@example.com';"

# Step 4: Log action in ops-log
echo "$(date): Granted admin access to new_admin@example.com" >> docs/ops-log/$(date +%Y-%m).md
```

**Removing Admin Access**:
```bash
# Step 1: Revoke admin flag
psql "$DATABASE_URL" -c "UPDATE users SET is_admin = false WHERE email = 'old_admin@example.com';"

# Step 2: Invalidate sessions (optional)
# Force user to re-login
```

---

## Quick Reference

### Key Files
- **Backend Auth**: `server/middleware/auth.ts`
- **Admin Routes**: `server/routes/admin.ts`
- **Frontend Auth Hook**: `client/src/hooks/useAuth.ts`
- **Admin Pages**: `client/src/pages/admin/`

### Key Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/admin/users` - List users (admin only)
- `POST /api/admin/users/:id/credits/add` - Add credits (admin only)

### Database Columns
- `users.is_admin` (BOOLEAN) - Admin flag
- `users.is_verified` (BOOLEAN) - Email verified
- `users.password` (VARCHAR) - Bcrypt hashed password

### Admin Users (Staging)
- `founder@bizelev8.ai` - Super Admin ✅

---

## Next Steps

1. **Create Admin Frontend Pages** (see ADMIN_DASHBOARD_INTEGRATION.md)
2. **Add Admin Navigation** to main app
3. **Implement Audit Logging** for sensitive actions
4. **Test Admin Flow** on staging environment
5. **Deploy to Production** after founder approval

---

**Document Version**: 1.0
**Last Updated**: 2025-11-26
**Maintained By**: Development Team
