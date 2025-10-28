import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  Download,
  CreditCard,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export default function AdminPaymentsPage() {
  const [, setLocation] = useLocation();

  // Fetch revenue analytics (mock data)
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin-analytics-revenue"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/analytics/revenue");
      if (!response.ok) throw new Error("Failed to fetch revenue analytics");
      const result = await response.json();
      return result.data;
    },
  });

  // Fetch payment transactions (mock data)
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/payments");
      if (!response.ok) throw new Error("Failed to fetch payments");
      const result = await response.json();
      return result.data;
    },
  });

  const isLoading = revenueLoading || paymentsLoading;

  const handleExportCSV = () => {
    if (!paymentsData?.transactions) return;

    const csvContent = [
      ["Date", "User", "Email", "Type", "Amount", "Status", "Description"].join(","),
      ...paymentsData.transactions.map((t: any) =>
        [
          format(new Date(t.date), "yyyy-MM-dd"),
          t.userName,
          t.userEmail,
          t.type,
          t.amount,
          t.status,
          t.description,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Payment Analytics</h1>
              <p className="text-gray-600 mt-2">
                Revenue metrics and payment transaction history
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* Mock Data Warning */}
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <Info className="w-5 h-5 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <strong>Mock Data</strong>: Payment metrics are calculated from current user distribution.
            Real transaction data will be available after Stripe integration (Phase 6).
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Loading payment analytics...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Revenue Metrics Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                Revenue Metrics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card className="border-2 border-green-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Monthly Recurring Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      ${revenueData?.mrr?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Per month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Top-Up Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      ${revenueData?.topupRevenue?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      ${revenueData?.totalRevenue?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">MRR + Top-ups</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Active Subscriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {revenueData?.activeSubscriptions?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {revenueData?.proSubscriptions || 0} Pro, {revenueData?.advancedSubscriptions || 0} Advanced
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>MRR growth over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueData?.revenueTrend && revenueData.revenueTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData.revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: any) => `$${value.toLocaleString()}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="mrr"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: "#10b981" }}
                          name="MRR"
                        />
                        <Line
                          type="monotone"
                          dataKey="topups"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ fill: "#f59e0b" }}
                          name="Top-Ups"
                        />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: "#3b82f6" }}
                          name="Total"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      No revenue trend data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Payment Transactions Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  Payment Transactions
                </h2>
                <Button onClick={handleExportCSV} disabled={!paymentsData?.transactions}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    Mock transaction data based on current user subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentsData?.transactions && paymentsData.transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentsData.transactions.map((transaction: any) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="text-sm">
                                {format(new Date(transaction.date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {transaction.userName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {transaction.userEmail}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    transaction.type === "subscription"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {transaction.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {transaction.description}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                ${transaction.amount}
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-green-100 text-green-800">
                                  {transaction.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No payment transactions found</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Transactions will appear here once users upgrade to paid plans
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Information Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  About Payment Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>Current Status:</strong> Payment metrics are calculated from current
                    user distribution. MRR is based on actual Pro and Advanced user counts.
                  </p>
                  <p>
                    <strong>After Stripe Integration (Phase 6):</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Real-time Stripe webhook integration</li>
                    <li>Actual payment transaction history</li>
                    <li>Failed payment tracking and retry logic</li>
                    <li>Invoice generation and PDF downloads</li>
                    <li>Subscription upgrade/downgrade analytics</li>
                    <li>Top-up purchase tracking with real data</li>
                    <li>Revenue forecasting and churn analytics</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
