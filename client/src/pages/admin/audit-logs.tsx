import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import {
  Shield,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

// Type definitions for audit logs
interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetUserId: string | null;
  targetUserEmail: string | null;
  details: Record<string, any>;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AdminUser {
  id: string;
  email: string;
}

// Common action types for the filter dropdown
const ACTION_TYPES = [
  "ADD_CREDITS",
  "REMOVE_CREDITS",
  "BULK_CREDITS",
  "BULK_USER_ACTION",
  "SUSPEND_USER",
  "ACTIVATE_USER",
  "DELETE_USER",
  "UPDATE_USER",
  "CREATE_SCENARIO",
  "UPDATE_SCENARIO",
  "DELETE_SCENARIO",
  "UPDATE_CREDIT_COSTS",
  "VIEW_USER_DETAILS",
];

export default function AdminAuditLogsPage() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [adminFilter, setAdminFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [targetUserSearch, setTargetUserSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Fetch audit logs with filters
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-audit-logs", page, adminFilter, actionFilter, targetUserSearch, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (adminFilter) params.append("adminId", adminFilter);
      if (actionFilter) params.append("action", actionFilter);
      if (targetUserSearch) params.append("targetUserId", targetUserSearch);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await apiRequest("GET", `/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      const result = await response.json();
      return result.data as AuditLogsResponse;
    },
  });

  // Fetch admin users for the filter dropdown
  const { data: adminsData } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/audit-logs/admins");
      if (!response.ok) throw new Error("Failed to fetch admin users");
      const result = await response.json();
      return result.admins as AdminUser[];
    },
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes("ADD") || action.includes("ACTIVATE") || action.includes("CREATE")) {
      return "bg-green-100 text-green-800";
    }
    if (action.includes("DELETE") || action.includes("REMOVE") || action.includes("SUSPEND")) {
      return "bg-red-100 text-red-800";
    }
    if (action.includes("UPDATE") || action.includes("BULK")) {
      return "bg-blue-100 text-blue-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const getActionIcon = (action: string) => {
    if (action.includes("ADD") || action.includes("ACTIVATE") || action.includes("CREATE")) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (action.includes("DELETE") || action.includes("REMOVE") || action.includes("SUSPEND")) {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-blue-600" />;
  };

  const clearFilters = () => {
    setAdminFilter("");
    setActionFilter("");
    setTargetUserSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasActiveFilters = adminFilter || actionFilter || targetUserSearch || dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-gray-600 mt-2">
                Track all administrative actions and changes
              </p>
            </div>
            <Shield className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Admin Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Admin User
                </label>
                <Select
                  value={adminFilter}
                  onValueChange={(value) => {
                    setAdminFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Admins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Admins</SelectItem>
                    {adminsData?.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Type Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Action Type
                </label>
                <Select
                  value={actionFilter}
                  onValueChange={(value) => {
                    setActionFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Actions</SelectItem>
                    {ACTION_TYPES.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target User Search */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Target User
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by email..."
                    value={targetUserSearch}
                    onChange={(e) => {
                      setTargetUserSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date From */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Date From
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date To */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Date To
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {data?.pagination.total || 0} Audit Logs
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
                <p className="mt-4 text-gray-600">Loading audit logs...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                <p className="text-red-600">Failed to load audit logs</p>
              </div>
            ) : !data || data.logs.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No audit logs found</p>
                <p className="text-sm text-gray-500">
                  {hasActiveFilters
                    ? "Try adjusting your filters to see more results"
                    : "Administrative actions will appear here"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Target User</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead className="text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.logs.map((log) => (
                        <React.Fragment key={log.id}>
                          <TableRow className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {log.adminEmail}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getActionIcon(log.action)}
                                <Badge className={getActionBadgeColor(log.action)}>
                                  {log.action.replace(/_/g, " ")}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {log.targetUserEmail ? (
                                <span className="text-sm text-gray-700">
                                  {log.targetUserEmail}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400 italic">
                                  N/A
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600 font-mono">
                                {log.ipAddress || "Unknown"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Collapsible
                                open={expandedLogId === log.id}
                                onOpenChange={(open) =>
                                  setExpandedLogId(open ? log.id : null)
                                }
                              >
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    {expandedLogId === log.id ? (
                                      <>
                                        <ChevronUp className="w-4 h-4 mr-1" />
                                        Hide
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-4 h-4 mr-1" />
                                        View
                                      </>
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                              </Collapsible>
                            </TableCell>
                          </TableRow>
                          {expandedLogId === log.id && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-gray-50">
                                <div className="p-4">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                    Action Details
                                  </h4>
                                  <pre className="bg-white p-3 rounded-md border border-gray-200 text-xs overflow-x-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
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
