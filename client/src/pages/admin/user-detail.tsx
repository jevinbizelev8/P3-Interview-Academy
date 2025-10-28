import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Zap,
  CreditCard,
  AlertCircle,
  Plus,
  RefreshCw,
  Trash2,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { TransactionHistory } from "@/components/billing/TransactionHistory";

export default function UserDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showAddCreditsDialog, setShowAddCreditsDialog] = useState(false);
  const [showChangeTierDialog, setShowChangeTierDialog] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [newTier, setNewTier] = useState("");

  // Fetch user details
  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-detail", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/users/${id}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
  });

  // Add credits mutation
  const addCreditsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/credits/add`, {
        amount: parseInt(creditAmount),
        reason: creditReason,
      });
      if (!response.ok) throw new Error("Failed to add credits");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", id] });
      setShowAddCreditsDialog(false);
      setCreditAmount("");
      setCreditReason("");
    },
  });

  // Change tier mutation
  const changeTierMutation = useMutation({
    mutationFn: async () => {
      const monthlyCredits = newTier === "FREE" ? 50 : newTier === "PRO" ? 100 : 280;
      const response = await apiRequest("PUT", `/api/admin/users/${id}/tier`, {
        planType: newTier,
        monthlyCredits,
      });
      if (!response.ok) throw new Error("Failed to change tier");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", id] });
      setShowChangeTierDialog(false);
      setNewTier("");
    },
  });

  // Reset credits mutation
  const resetCreditsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/credits/reset`, {});
      if (!response.ok) throw new Error("Failed to reset credits");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", id] });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/admin/users/${id}`, {});
      if (!response.ok) throw new Error("Failed to delete user");
      return response.json();
    },
    onSuccess: () => {
      setLocation("/admin/users");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">User Not Found</h2>
            <p className="text-gray-600 mb-4">The requested user could not be found.</p>
            <Button onClick={() => setLocation("/admin/users")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = data.user;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/admin/users")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user.firstName || user.lastName
                ? `${user.firstName || ""} ${user.lastName || ""}`
                : "Unknown User"}
            </h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
                deleteUserMutation.mutate();
              }
            }}
            disabled={deleteUserMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete User
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">User ID</span>
                <p className="font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email Verified</span>
                <p>
                  <Badge className={user.emailVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {user.emailVerified ? "Verified" : "Unverified"}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Role</span>
                <p className="font-semibold">{user.role}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Joined</span>
                <p className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {format(new Date(user.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Plan Type</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={
                    user.planType === "FREE" ? "bg-gray-100 text-gray-800" :
                    user.planType === "PRO" ? "bg-purple-100 text-purple-800" :
                    "bg-gradient-to-r from-pink-500 to-orange-600 text-white"
                  }>
                    {user.planType}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowChangeTierDialog(true)}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Change
                  </Button>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <p>
                  <Badge className={
                    user.subscriptionStatus === "active" ? "bg-green-100 text-green-800" :
                    user.subscriptionStatus === "canceled" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }>
                    {user.subscriptionStatus}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Monthly Allocation</span>
                <p className="font-semibold">{user.monthlyCreditAllocation} credits</p>
              </div>
              {user.currentPeriodEnd && (
                <div>
                  <span className="text-sm text-gray-500">Period End</span>
                  <p>{format(new Date(user.currentPeriodEnd), "MMM d, yyyy")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credits Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Credit Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Total Balance</span>
                <p className="text-3xl font-bold text-yellow-700">{user.creditBalance}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Monthly Credits</span>
                <p className="font-semibold">{user.monthlyCreditAllocation}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Top-Up Credits</span>
                <p className="font-semibold">{user.topUpCredits}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowAddCreditsDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (confirm("Reset monthly credits to tier default?")) {
                      resetCreditsMutation.mutate();
                    }
                  }}
                  disabled={resetCreditsMutation.isPending}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Transaction History</CardTitle>
            <CardDescription>Last 50 transactions for this user</CardDescription>
          </CardHeader>
          <CardContent>
            {data.transactions && data.transactions.length > 0 ? (
              <TransactionHistory transactions={data.transactions.map((t: any) => ({
                id: t.id,
                type: t.type,
                amount: t.amount,
                balanceAfter: t.balanceAfter,
                description: t.description,
                feature: t.feature,
                timestamp: t.createdAt,
              }))} />
            ) : (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Credits Dialog */}
        <Dialog open={showAddCreditsDialog} onOpenChange={setShowAddCreditsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Credits</DialogTitle>
              <DialogDescription>
                Add top-up credits to this user's account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Credit Amount</label>
                <Input
                  type="number"
                  placeholder="Enter number of credits"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reason (Optional)</label>
                <Textarea
                  placeholder="Reason for adding credits..."
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddCreditsDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => addCreditsMutation.mutate()}
                disabled={!creditAmount || addCreditsMutation.isPending}
              >
                {addCreditsMutation.isPending ? "Adding..." : "Add Credits"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Tier Dialog */}
        <Dialog open={showChangeTierDialog} onOpenChange={setShowChangeTierDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Tier</DialogTitle>
              <DialogDescription>
                Change this user's subscription tier
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">New Tier</label>
                <Select value={newTier} onValueChange={setNewTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free (50 credits/month)</SelectItem>
                    <SelectItem value="PRO">Pro (100 credits/month)</SelectItem>
                    <SelectItem value="ADVANCED">Advanced (280 credits/month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowChangeTierDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => changeTierMutation.mutate()}
                disabled={!newTier || changeTierMutation.isPending}
              >
                {changeTierMutation.isPending ? "Changing..." : "Change Tier"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
