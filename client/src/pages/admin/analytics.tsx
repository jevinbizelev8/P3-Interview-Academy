import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Users,
  Zap,
  TrendingUp,
  Activity,
  AlertTriangle,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  FREE: "#6b7280",
  PRO: "#a855f7",
  ADVANCED: "#f97316",
};

const TIER_COLORS = ["#6b7280", "#a855f7", "#f97316"];

export default function AdminAnalyticsPage() {
  const [, setLocation] = useLocation();

  // Fetch user analytics
  const { data: userMetrics, isLoading: userLoading } = useQuery({
    queryKey: ["admin-analytics-users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/analytics/users");
      if (!response.ok) throw new Error("Failed to fetch user analytics");
      const result = await response.json();
      return result.data;
    },
  });

  // Fetch usage analytics
  const { data: usageMetrics, isLoading: usageLoading } = useQuery({
    queryKey: ["admin-analytics-usage"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/analytics/usage");
      if (!response.ok) throw new Error("Failed to fetch usage analytics");
      const result = await response.json();
      return result.data;
    },
  });

  // Fetch platform health
  const { data: platformMetrics, isLoading: platformLoading } = useQuery({
    queryKey: ["admin-analytics-platform"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/analytics/platform");
      if (!response.ok) throw new Error("Failed to fetch platform health");
      const result = await response.json();
      return result.data;
    },
  });

  const isLoading = userLoading || usageLoading || platformLoading;

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
              <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
              <p className="text-gray-600 mt-2">
                Real-time insights and metrics from your platform
              </p>
            </div>
            <Activity className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* User Metrics Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                User Metrics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {userMetrics?.totalUsers || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">All-time signups</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Active Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {userMetrics?.activeUsers || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      New Signups
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {userMetrics?.newSignups || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Paid Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {userMetrics?.tierDistribution?.filter((t: any) => t.tier !== "FREE")
                        .reduce((sum: number, t: any) => sum + t.count, 0) || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Pro + Advanced</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tier Distribution Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution by Tier</CardTitle>
                    <CardDescription>Breakdown of users across plan tiers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userMetrics?.tierDistribution && userMetrics.tierDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={userMetrics.tierDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry: any) => `${entry.tier}: ${entry.count}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {userMetrics.tierDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No tier data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* User Growth Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth Trend</CardTitle>
                    <CardDescription>New signups over the last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userMetrics?.growthTrend && userMetrics.growthTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={userMetrics.growthTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="signups"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={{ fill: "#8b5cf6" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No growth data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Usage Metrics Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-600" />
                Credit Usage Analytics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Credits Used
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {usageMetrics?.totalCreditsConsumed?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">All-time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Credits This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">
                      {usageMetrics?.creditsThisMonth?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Practice Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {usageMetrics?.practiceSessionsCount?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Total sessions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Prepare Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {usageMetrics?.prepareSessionsCount?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Total sessions</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Feature Usage Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Usage</CardTitle>
                    <CardDescription>Credits consumed by feature</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {usageMetrics?.featureUsage && usageMetrics.featureUsage.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={usageMetrics.featureUsage}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="feature" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total" fill="#f59e0b" name="Credits Used" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No feature usage data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Users */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Active Users</CardTitle>
                    <CardDescription>Users with highest credit consumption</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {usageMetrics?.topUsers && usageMetrics.topUsers.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {usageMetrics.topUsers.map((user: any, index: number) => (
                          <div
                            key={user.userId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                #{index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {user.name || "Unknown"}
                                </p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Zap className="w-3 h-3 mr-1" />
                              {user.totalCredits}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No user data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Platform Health Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                Platform Health
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Credit Users */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Users with Low Credits
                    </CardTitle>
                    <CardDescription>Users with less than 10 credits remaining</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {platformMetrics?.lowCreditUsers && platformMetrics.lowCreditUsers.length > 0 ? (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {platformMetrics.lowCreditUsers.map((user: any) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-2 border border-orange-200 bg-orange-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-sm text-gray-900">
                                {user.firstName || user.lastName
                                  ? `${user.firstName || ""} ${user.lastName || ""}`
                                  : "Unknown User"}
                              </p>
                              <p className="text-xs text-gray-600">{user.email}</p>
                            </div>
                            <Badge className="bg-orange-100 text-orange-800">
                              {user.creditBalance} left
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No users with low credits
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Credit Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Credit Distribution</CardTitle>
                    <CardDescription>How credits are distributed across users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {platformMetrics?.creditDistribution && platformMetrics.creditDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={platformMetrics.creditDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="bucket" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#10b981" name="Number of Users" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No distribution data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Renewals */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Upcoming Renewals
                    </CardTitle>
                    <CardDescription>Subscriptions renewing in the next 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {platformMetrics?.upcomingRenewals && platformMetrics.upcomingRenewals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {platformMetrics.upcomingRenewals.map((renewal: any) => (
                          <div
                            key={renewal.userId}
                            className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-sm text-gray-900">
                                {renewal.firstName || renewal.lastName
                                  ? `${renewal.firstName || ""} ${renewal.lastName || ""}`
                                  : "Unknown User"}
                              </p>
                              <p className="text-xs text-gray-600">{renewal.email}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Renews: {new Date(renewal.currentPeriodEnd).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={
                              renewal.planType === "PRO"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gradient-to-r from-pink-500 to-orange-600 text-white"
                            }>
                              {renewal.planType}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-gray-500">
                        No upcoming renewals in the next 30 days
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
