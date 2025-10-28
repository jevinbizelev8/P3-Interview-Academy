import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import {
  Users,
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Zap,
  Mail,
  Calendar,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  planType: string;
  subscriptionStatus: string;
  creditBalance: number;
  monthlyCreditAllocation: number;
  topUpCredits: number;
  createdAt: string;
  emailVerified: boolean;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const queryClient = useQueryClient();

  // Fetch users with filters
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users", page, search, tierFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (search) params.append("search", search);
      if (tierFilter) params.append("tier", tierFilter);
      if (statusFilter) params.append("status", statusFilter);

      const response = await apiRequest("GET", `/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const result = await response.json();
      return result.data as UsersResponse;
    },
  });

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "FREE":
        return "bg-gray-100 text-gray-800";
      case "PRO":
        return "bg-purple-100 text-purple-800";
      case "ADVANCED":
        return "bg-gradient-to-r from-pink-500 to-orange-600 text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => setLocation("/admin")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">
              Manage user accounts, subscriptions, and credits
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tier Filter */}
              <Select
                value={tierFilter}
                onValueChange={(value) => {
                  setTierFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Tiers</SelectItem>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {data?.pagination.total || 0} Users
              </CardTitle>
              {data && (
                <span className="text-sm text-gray-500">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">Failed to load users</p>
              </div>
            ) : !data || data.users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Credits</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {user.firstName || user.lastName
                                    ? `${user.firstName || ""} ${user.lastName || ""}`
                                    : "Unknown User"}
                                </span>
                                {!user.emailVerified && (
                                  <Badge variant="outline" className="text-xs">
                                    <Mail className="w-3 h-3 mr-1" />
                                    Unverified
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-gray-500">
                                {user.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPlanBadgeColor(user.planType)}>
                              {user.planType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(user.subscriptionStatus)}>
                              {user.subscriptionStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1 font-semibold">
                                <Zap className="w-4 h-4 text-yellow-600" />
                                {user.creditBalance}
                              </div>
                              <span className="text-xs text-gray-500">
                                {user.monthlyCreditAllocation} monthly + {user.topUpCredits} top-up
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(user.createdAt), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/admin/users/${user.id}`)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Showing {((page - 1) * 50) + 1} - {Math.min(page * 50, data.pagination.total)} of {data.pagination.total}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= data.pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
