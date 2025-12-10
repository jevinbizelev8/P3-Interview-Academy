# Admin Dashboard Integration Guide

**Last Updated**: 2025-11-26
**Source Repository**: https://github.com/base44dev/admin-p3interview
**Target**: P3 Interview Academy (`/home/runner/workspace`)

---

## Executive Summary

This guide explains how to integrate the admin dashboard from `admin-p3interview` into P3's existing project structure. The integration leverages P3's robust backend API (already 90% complete) while porting the modern UI components from the founder's admin repository.

**Key Insight**: P3 already has comprehensive admin routes (`server/routes/admin.ts` - 834 lines) with user management, credit operations, and analytics. We only need to port the UI layer.

---

## Architecture Overview

### Current State

**P3 Backend** (`server/routes/admin.ts`):
```typescript
// Already implemented in P3
router.get("/users", ...);              // List users with search/filter
router.get("/users/:id", ...);          // User details
router.post("/users/:id/credits/add", ...); // Add credits (individual)
router.get("/analytics/users", ...);    // User analytics
router.get("/analytics/usage", ...);    // Credit usage analytics
```

**Admin Dashboard Repository** (`/tmp/admin-p3interview`):
```javascript
// Uses Base44 SDK
const users = await base44.entities.User.list();
const profile = await base44.entities.UserProfile.get(userId);
```

### Target State

**P3 Frontend** (`client/src/pages/admin/`):
```typescript
// Will use P3 custom hooks
const { data: users } = useAdminUsers({ search, page });
const { data: analytics } = useAdminAnalytics();
const addCredits = useAddCredits();
```

---

## Component Mapping

### Admin Dashboard Components to Port

| Admin Repo Component | P3 Target Location | P3 Backend Endpoint | Status |
|---------------------|-------------------|---------------------|---------|
| `UserManagement.jsx` | `client/src/pages/admin/users.tsx` | `GET /api/admin/users` | ✅ API exists |
| `UserDetails.jsx` | `client/src/components/admin/UserDetails.tsx` | `GET /api/admin/users/:id` | ✅ API exists |
| `CreditManagement.jsx` | `client/src/components/admin/CreditManagement.tsx` | `POST /api/admin/users/:id/credits/add` | ✅ API exists |
| `Analytics.jsx` | `client/src/pages/admin/analytics.tsx` | `GET /api/admin/analytics/*` | ✅ API exists |
| `BulkOperations.jsx` | `client/src/components/admin/BulkOperations.tsx` | `POST /api/admin/users/bulk/*` | ❌ API needs creation |
| `AdminLayout.jsx` | `client/src/components/admin/AdminLayout.tsx` | N/A (UI only) | N/A |
| `AdminSidebar.jsx` | `client/src/components/admin/AdminSidebar.tsx` | N/A (UI only) | N/A |

---

## Integration Steps

### Step 1: Create Admin Page Structure

**File**: `client/src/pages/admin/index.tsx`

```typescript
// New file to create
import { Route, Switch } from "wouter";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { UsersPage } from "./users";
import { AnalyticsPage } from "./analytics";
import { SettingsPage } from "./settings";
import { useRequireAdmin } from "@/hooks/useAuth";

export default function AdminDashboard() {
  const { isAdmin, loading } = useRequireAdmin();

  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return <div>Access Denied</div>;

  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/users" component={UsersPage} />
        <Route path="/admin/analytics" component={AnalyticsPage} />
        <Route path="/admin/settings" component={SettingsPage} />
        <Route path="/admin">
          {/* Default redirect to users */}
          <UsersPage />
        </Route>
      </Switch>
    </AdminLayout>
  );
}
```

**Routing Integration**: Add to main app router (`client/src/App.tsx`):
```typescript
import AdminDashboard from "@/pages/admin";

// In main router
<Route path="/admin/*" component={AdminDashboard} />
```

---

### Step 2: Port User Management Component

**Source**: `/tmp/admin-p3interview/src/components/admin/UserManagement.jsx`
**Target**: `client/src/pages/admin/users.tsx`

#### Base44 SDK Pattern (Admin Repo):
```javascript
// How admin-p3interview fetches users
const { data: users, isLoading } = useQuery({
  queryKey: ['admin-users', searchTerm, currentPage],
  queryFn: async () => {
    let query = base44.entities.User.filter({});

    if (searchTerm) {
      query = query.search(searchTerm);
    }

    return await query
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize)
      .list();
  }
});
```

#### P3 Custom Hook Pattern (Target):
```typescript
// How we'll fetch users in P3
const { data: users, isLoading } = useQuery({
  queryKey: ['admin-users', searchTerm, currentPage],
  queryFn: async () => {
    const params = new URLSearchParams({
      search: searchTerm,
      page: currentPage.toString(),
      limit: pageSize.toString()
    });

    const response = await fetch(`/api/admin/users?${params}`, {
      credentials: 'include' // Include session cookie
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  }
});
```

#### Complete Component Conversion:

**Key Changes**:
1. Replace `base44.entities.User` with `fetch('/api/admin/users')`
2. Replace `base44.entities.UserProfile` with nested user data
3. Convert JSX to TSX with proper TypeScript types
4. Use P3's existing UI components (Shadcn/ui)

**Example Conversion**:

```typescript
// client/src/pages/admin/users.tsx
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditManagement } from "@/components/admin/CreditManagement";

interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  credit_balance: number;
  monthly_credit_allocation: number;
  top_up_credits: number;
  is_admin: boolean;
}

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const pageSize = 20;

  // Fetch users
  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', searchTerm, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        page: currentPage.toString(),
        limit: pageSize.toString()
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  const users = usersData?.users || [];
  const totalPages = Math.ceil((usersData?.total || 0) / pageSize);

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search by email or username..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to page 1
              }}
            />
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div>Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.username || 'N/A'}</TableCell>
                    <TableCell>
                      {user.credit_balance + user.top_up_credits}
                      <span className="text-xs text-gray-500">
                        {" "}({user.monthly_credit_allocation} monthly)
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        Manage Credits
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credit Management Modal */}
      {selectedUser && (
        <CreditManagement
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSuccess={() => {
            refetch();
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
```

---

### Step 3: Port Credit Management Component

**Source**: `/tmp/admin-p3interview/src/components/admin/CreditManagement.jsx`
**Target**: `client/src/components/admin/CreditManagement.tsx`

#### Base44 SDK Pattern (Admin Repo):
```javascript
// Add credits in admin-p3interview
await base44.entities.UserProfile.update(userId, {
  top_up_credits: currentCredits + amount
});
```

#### P3 API Pattern (Target):
```typescript
// Add credits in P3
const response = await fetch(`/api/admin/users/${userId}/credits/add`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    amount: creditAmount,
    reason: "Admin adjustment"
  })
});
```

#### Complete Component:

```typescript
// client/src/components/admin/CreditManagement.tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  credit_balance: number;
  monthly_credit_allocation: number;
  top_up_credits: number;
}

interface CreditManagementProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreditManagement({ user, onClose, onSuccess }: CreditManagementProps) {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  const addCreditsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/users/${user.id}/credits/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount, reason })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add credits');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Credits Added",
        description: `Successfully added ${amount} credits to ${user.email}`
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Credit amount must be positive",
        variant: "destructive"
      });
      return;
    }

    addCreditsMutation.mutate();
  };

  const totalCredits = user.credit_balance + user.top_up_credits;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Credits - {user.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Credits Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Current Balance</p>
                <p className="font-semibold">{totalCredits} credits</p>
              </div>
              <div>
                <p className="text-gray-600">Monthly Allocation</p>
                <p className="font-semibold">{user.monthly_credit_allocation} credits</p>
              </div>
              <div>
                <p className="text-gray-600">Subscription Credits</p>
                <p className="font-semibold">{user.credit_balance} credits</p>
              </div>
              <div>
                <p className="text-gray-600">Top-up Credits</p>
                <p className="font-semibold">{user.top_up_credits} credits</p>
              </div>
            </div>
          </div>

          {/* Add Credits Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Credits to Add</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                value={amount || ""}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                placeholder="Enter amount..."
              />
            </div>

            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., UAT testing, compensation"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={addCreditsMutation.isPending}>
                {addCreditsMutation.isPending ? "Adding..." : "Add Credits"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step 4: Port Analytics Dashboard

**Source**: `/tmp/admin-p3interview/src/components/admin/Analytics.jsx`
**Target**: `client/src/pages/admin/analytics.tsx`

#### Key Differences:
1. Admin repo uses **Recharts** for visualizations
2. P3 doesn't have Recharts installed yet
3. Need to install: `npm install recharts`

#### Base44 SDK Pattern (Admin Repo):
```javascript
// Fetch analytics data
const userStats = await base44.entities.UserProfile.aggregate({
  _count: true,
  _avg: { xp_points: true, readiness_score: true }
});

const creditUsage = await base44.entities.CreditTransaction.aggregate({
  _sum: { amount: true },
  groupBy: ['created_date']
});
```

#### P3 API Pattern (Target):
```typescript
// Fetch from P3 endpoints
const userStats = await fetch('/api/admin/analytics/users', {
  credentials: 'include'
}).then(r => r.json());

const creditUsage = await fetch('/api/admin/analytics/usage', {
  credentials: 'include'
}).then(r => r.json());
```

#### Complete Component:

```typescript
// client/src/pages/admin/analytics.tsx
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function AnalyticsPage() {
  // User stats
  const { data: userStats } = useQuery({
    queryKey: ['admin-analytics-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics/users', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch user stats');
      return response.json();
    }
  });

  // Credit usage
  const { data: creditUsage } = useQuery({
    queryKey: ['admin-analytics-usage'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics/usage', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch credit usage');
      return response.json();
    }
  });

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{userStats?.totalUsers || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Users (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{userStats?.activeUsers7d || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Readiness Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Math.round(userStats?.avgReadinessScore || 0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Credits Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {creditUsage?.totalCreditsUsed?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Usage (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={creditUsage?.dailyUsage || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="credits" stroke="#8884d8" name="Credits Used" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userStats?.userGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="newUsers" fill="#82ca9d" name="New Users" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Step 5: Implement Bulk Operations (NEW FEATURE)

**Note**: This feature exists in admin-p3interview but NOT in P3 backend yet. We need to create the API first.

#### Backend Implementation Needed

**File**: `server/routes/admin.ts` (add to existing file)

```typescript
// POST /api/admin/users/bulk/credits - Add credits to multiple users
router.post("/users/bulk/credits", requireAdmin, async (req, res) => {
  const { userIds, amount, reason } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: "userIds array is required" });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "amount must be positive" });
  }

  try {
    // Use transaction for atomicity
    const results = await db.transaction(async (tx) => {
      const updated = [];

      for (const userId of userIds) {
        const result = await creditService.addCredits(
          tx,
          userId,
          amount,
          reason || "Bulk admin adjustment",
          req.user!.id // admin user ID
        );

        updated.push(result);
      }

      return updated;
    });

    res.json({
      success: true,
      updated: results.length,
      results
    });
  } catch (error) {
    console.error("Bulk credit addition failed:", error);
    res.status(500).json({ message: "Failed to add credits" });
  }
});

// POST /api/admin/users/bulk/action - Bulk user actions (suspend, activate, delete)
router.post("/users/bulk/action", requireAdmin, async (req, res) => {
  const { userIds, action } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: "userIds array is required" });
  }

  if (!['suspend', 'activate', 'delete'].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }

  try {
    const results = await db.transaction(async (tx) => {
      const updated = [];

      for (const userId of userIds) {
        let result;

        switch (action) {
          case 'suspend':
            result = await tx.update(users)
              .set({ is_active: false, updated_at: new Date() })
              .where(eq(users.id, userId))
              .returning();
            break;

          case 'activate':
            result = await tx.update(users)
              .set({ is_active: true, updated_at: new Date() })
              .where(eq(users.id, userId))
              .returning();
            break;

          case 'delete':
            // Soft delete
            result = await tx.update(users)
              .set({ deleted_at: new Date(), is_active: false })
              .where(eq(users.id, userId))
              .returning();
            break;
        }

        updated.push(result[0]);
      }

      return updated;
    });

    res.json({
      success: true,
      updated: results.length,
      action,
      results
    });
  } catch (error) {
    console.error("Bulk action failed:", error);
    res.status(500).json({ message: "Failed to perform bulk action" });
  }
});
```

#### Frontend Component

**File**: `client/src/components/admin/BulkOperations.tsx`

```typescript
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface BulkOperationsProps {
  selectedUserIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkOperations({ selectedUserIds, onClose, onSuccess }: BulkOperationsProps) {
  const [mode, setMode] = useState<'credits' | 'action'>('credits');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<'suspend' | 'activate' | 'delete'>('suspend');
  const { toast } = useToast();

  const bulkCreditsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/users/bulk/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userIds: selectedUserIds,
          amount,
          reason
        })
      });

      if (!response.ok) throw new Error('Failed to add credits');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Credits Added",
        description: `Added ${amount} credits to ${data.updated} users`
      });
      onSuccess();
    }
  });

  const bulkActionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/users/bulk/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userIds: selectedUserIds,
          action
        })
      });

      if (!response.ok) throw new Error('Failed to perform action');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Action Complete",
        description: `${action} applied to ${data.updated} users`
      });
      onSuccess();
    }
  });

  const handleSubmit = () => {
    if (mode === 'credits') {
      bulkCreditsMutation.mutate();
    } else {
      bulkActionMutation.mutate();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Operations ({selectedUserIds.length} users)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'credits' ? 'default' : 'outline'}
              onClick={() => setMode('credits')}
            >
              Add Credits
            </Button>
            <Button
              variant={mode === 'action' ? 'default' : 'outline'}
              onClick={() => setMode('action')}
            >
              User Action
            </Button>
          </div>

          {/* Credits Mode */}
          {mode === 'credits' && (
            <div className="space-y-4">
              <div>
                <Label>Credits to Add</Label>
                <Input
                  type="number"
                  min="1"
                  value={amount || ""}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Reason</Label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., UAT testing"
                />
              </div>
            </div>
          )}

          {/* Action Mode */}
          {mode === 'action' && (
            <div className="space-y-4">
              <div>
                <Label>Action</Label>
                <select
                  className="w-full border rounded p-2"
                  value={action}
                  onChange={(e) => setAction(e.target.value as any)}
                >
                  <option value="suspend">Suspend Users</option>
                  <option value="activate">Activate Users</option>
                  <option value="delete">Delete Users</option>
                </select>
              </div>

              {action === 'delete' && (
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <p className="text-red-700 text-sm">
                    ⚠️ This will soft-delete {selectedUserIds.length} users. This action can be reversed by database admin.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={bulkCreditsMutation.isPending || bulkActionMutation.isPending}>
              {mode === 'credits' ? 'Add Credits' : 'Apply Action'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Routing Strategy

### Option 1: Wouter (Current P3 Router) - RECOMMENDED

**Pros**:
- No migration needed
- Lightweight (1.2KB)
- Already integrated

**Cons**:
- Less features than React Router

**Implementation**:
```typescript
// client/src/App.tsx
import { Route, Switch } from "wouter";
import AdminDashboard from "@/pages/admin";

<Switch>
  {/* Existing routes */}
  <Route path="/" component={Home} />
  <Route path="/dashboard" component={Dashboard} />

  {/* Admin routes */}
  <Route path="/admin/*">
    {(params) => <AdminDashboard />}
  </Route>
</Switch>
```

### Option 2: React Router DOM (Admin Repo Uses This)

**Pros**:
- Full feature parity with admin repo
- Better nested routing

**Cons**:
- Requires migration (+28KB bundle)
- Breaking changes

**NOT RECOMMENDED** - Defer until Phase 10

---

## Testing Strategy

### Unit Tests

```typescript
// client/src/components/admin/__tests__/CreditManagement.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreditManagement } from '../CreditManagement';

describe('CreditManagement', () => {
  it('adds credits successfully', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      credit_balance: 100,
      monthly_credit_allocation: 50,
      top_up_credits: 0
    };

    render(
      <QueryClientProvider client={new QueryClient()}>
        <CreditManagement user={mockUser} onClose={jest.fn()} onSuccess={jest.fn()} />
      </QueryClientProvider>
    );

    // Test implementation
    const amountInput = screen.getByLabelText(/credits to add/i);
    fireEvent.change(amountInput, { target: { value: '500' } });

    const submitButton = screen.getByText(/add credits/i);
    fireEvent.click(submitButton);

    // Assert API call made
    // Assert success message
  });
});
```

### Integration Tests

```typescript
// client/src/pages/admin/__tests__/users.integration.test.tsx
describe('Admin Users Page', () => {
  it('fetches and displays users', async () => {
    // Mock API response
    // Render component
    // Assert users displayed
  });

  it('searches users by email', async () => {
    // Test search functionality
  });

  it('opens credit management modal', async () => {
    // Click manage credits button
    // Assert modal opens
  });
});
```

---

## Migration Checklist

### Phase 1: Setup (1 day)
- [ ] Create `client/src/pages/admin/` directory
- [ ] Create `client/src/components/admin/` directory
- [ ] Install Recharts: `npm install recharts`
- [ ] Add admin routes to main router

### Phase 2: Core Components (2-3 days)
- [ ] Port AdminLayout and AdminSidebar
- [ ] Port UsersPage with search/pagination
- [ ] Port CreditManagement component
- [ ] Test with existing P3 API endpoints

### Phase 3: Analytics (1 day)
- [ ] Port Analytics page
- [ ] Connect to P3 analytics endpoints
- [ ] Test charts render correctly

### Phase 4: Bulk Operations (2 days)
- [ ] Create bulk credit endpoint (backend)
- [ ] Create bulk action endpoint (backend)
- [ ] Port BulkOperations component (frontend)
- [ ] Test with 10+ users

### Phase 5: Testing & Polish (1-2 days)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test on staging environment
- [ ] Fix any bugs found

**Total Estimated Time**: 7-9 days

---

## Common Pitfalls & Solutions

### Pitfall 1: Authentication Differences

**Problem**: Admin repo uses Base44's built-in auth, P3 uses Passport.js

**Solution**: Ensure `requireAdmin` middleware is applied to all admin routes. Check `server/middleware/auth.ts`:

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

### Pitfall 2: Data Structure Differences

**Problem**: Base44 returns different field names than P3

**Mapping**:
| Base44 Field | P3 Field |
|-------------|----------|
| `top_up_credits` | `top_up_credits` ✅ Same |
| `credit_balance` | `credit_balance` ✅ Same |
| `monthly_credits` | `monthly_credit_allocation` ❌ Different |

**Solution**: Use TypeScript interfaces to enforce correct field names.

### Pitfall 3: Bundle Size

**Problem**: Adding Recharts increases bundle by ~50KB

**Solution**: Lazy load analytics page:
```typescript
const AnalyticsPage = lazy(() => import('./pages/admin/analytics'));
```

---

## Performance Considerations

### Pagination

Always paginate user lists:
- Default: 20 users per page
- Max: 100 users per page
- Backend endpoint already supports this

### Bulk Operations

For operations on 100+ users:
- Show progress indicator
- Use batch processing (50 users at a time)
- Implement timeout handling (10s per batch)

### Analytics Caching

Cache analytics data:
```typescript
const { data } = useQuery({
  queryKey: ['admin-analytics'],
  queryFn: fetchAnalytics,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000  // 10 minutes
});
```

---

## Security Checklist

- [ ] All admin routes require authentication
- [ ] All admin routes require `is_admin = true`
- [ ] Validate all user inputs (credit amounts, user IDs)
- [ ] Prevent SQL injection (use parameterized queries)
- [ ] Audit log all admin actions
- [ ] Rate limit bulk operations
- [ ] Test with non-admin users (expect 403)

---

## Next Steps

1. Review this guide with team
2. Create GitHub issue for admin dashboard integration
3. Start with Phase 1 (setup)
4. Deploy to staging for testing
5. Get founder approval before production deployment

---

**Document Version**: 1.0
**Last Updated**: 2025-11-26
**Maintained By**: Development Team
