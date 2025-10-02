import { useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { OrganizationAnalytics, MemberAnalytics } from "@shared/types";
import {
  ArrowLeft,
  Building2,
  Users2,
  Coins,
  Clock,
  RefreshCw,
  AlertCircle,
  Calendar,
  TrendingUp,
  Activity,
  Wallet,
  Settings,
} from "lucide-react";
import { TimeTrackingCard, formatDuration } from "@/components/company/TimeTrackingCard";
import { ModuleBreakdownChart } from "@/components/company/ModuleBreakdownChart";
import { CreditAllocationDialog } from "@/components/company/CreditAllocationDialog";
import { useToast } from "@/hooks/use-toast";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getActivityStatus(lastActivity: Date | null): {
  label: string;
  color: string;
} {
  if (!lastActivity) {
    return { label: "No Activity", color: "text-slate-400" };
  }

  const now = new Date();
  const diffHours = (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return { label: "Active Today", color: "text-green-600" };
  } else if (diffHours < 168) {
    return { label: "Active This Week", color: "text-blue-600" };
  } else if (diffHours < 720) {
    return { label: "Active This Month", color: "text-amber-600" };
  } else {
    return { label: "Inactive", color: "text-slate-400" };
  }
}

export default function OrganizationDetail() {
  const { id: organizationId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for credit allocation dialogs
  const [userCreditDialogOpen, setUserCreditDialogOpen] = useState(false);
  const [orgCreditDialogOpen, setOrgCreditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberAnalytics | null>(null);

  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useQuery<OrganizationAnalytics>({
    queryKey: [`/api/company/organizations/${organizationId}/analytics`],
    enabled: !!organizationId && !!user,
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/company/organizations/${organizationId}/analytics`
      );
      const json = await response.json();
      if (!json.success) {
        throw new Error("Unable to load organization analytics");
      }
      return {
        ...json.data,
        createdAt: new Date(json.data.createdAt),
        members: json.data.members.map((m: any) => ({
          ...m,
          lastActivity: m.lastActivity ? new Date(m.lastActivity) : null,
        })),
      };
    },
  });

  // Sort members by most active
  const sortedMembers = useMemo(() => {
    if (!analytics?.members) return [];
    return [...analytics.members].sort((a, b) => {
      // Sort by last activity (most recent first)
      if (!a.lastActivity && !b.lastActivity) return 0;
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });
  }, [analytics?.members]);

  // Calculate module credits breakdown
  const creditsBreakdown = useMemo(() => {
    if (!analytics?.members) return { prepare: 0, practice: 0, perform: 0 };

    // This is a simplified calculation - in a real scenario, you'd want to track
    // credits per module in the database
    const totalCredits = analytics.totalCreditsConsumed;
    const totalTime = analytics.totalTimeSpent;

    if (totalTime === 0) return { prepare: 0, practice: 0, perform: 0 };

    return {
      prepare: Math.round((analytics.timeByModule.prepare / totalTime) * totalCredits),
      practice: Math.round((analytics.timeByModule.practice / totalTime) * totalCredits),
      perform: Math.round((analytics.timeByModule.perform / totalTime) * totalCredits),
    };
  }, [analytics]);

  // Mutation for user credit allocation
  const allocateUserCreditsMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedMember) throw new Error("No member selected");

      const response = await apiRequest(
        "PATCH",
        `/api/company/users/${selectedMember.userId}/credits`,
        data
      );
      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to allocate credits");
      }
      return json.data;
    },
    onSuccess: () => {
      toast({
        title: "Credits Allocated",
        description: `Successfully allocated credits to ${selectedMember?.firstName || selectedMember?.email}`,
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/company/organizations/${organizationId}/analytics`],
      });
      setUserCreditDialogOpen(false);
      setSelectedMember(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Allocation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for organization credit allocation
  const allocateOrgCreditsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "PATCH",
        `/api/company/organizations/${organizationId}/credits`,
        data
      );
      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to allocate credits");
      }
      return json.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Credits Allocated",
        description: `Successfully allocated credits to ${data.successful} of ${data.totalMembers} members`,
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/company/organizations/${organizationId}/analytics`],
      });
      setOrgCreditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Allocation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler for opening user credit dialog
  const handleAllocateUserCredits = (member: MemberAnalytics) => {
    setSelectedMember(member);
    setUserCreditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          <span className="text-slate-600">Loading organization analytics...</span>
        </div>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/company">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-rose-500" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    Organization Not Found
                  </h2>
                  <p className="text-slate-600">
                    Unable to load organization analytics. Please check your permissions or try again.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/company">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="h-8 w-px bg-slate-300" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-slate-500" />
                <h1 className="text-2xl font-bold text-slate-900">{analytics.name}</h1>
                <Badge variant="outline">{analytics.type}</Badge>
              </div>
              <p className="text-sm text-slate-600">
                Created {formatDateTime(analytics.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setOrgCreditDialogOpen(true)} size="sm">
              <Coins className="mr-2 h-4 w-4" />
              Allocate to All Members
            </Button>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <TimeTrackingCard
            title="Total Time Spent"
            totalSeconds={analytics.totalTimeSpent}
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            subtitle="Across all modules"
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                Total Credits Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">
                {analytics.totalCreditsConsumed.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 mt-2">Lifetime consumption</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users2 className="h-4 w-4 text-purple-500" />
                Active Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">
                {analytics.memberCount}
              </p>
              <p className="text-sm text-slate-500 mt-2">Total members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">
                {analytics.members.reduce((sum, m) => sum + m.sessionCount, 0)}
              </p>
              <p className="text-sm text-slate-500 mt-2">Total sessions</p>
            </CardContent>
          </Card>
        </section>

        {/* Module Breakdown */}
        <section className="grid gap-6 lg:grid-cols-2">
          <ModuleBreakdownChart
            timeByModule={analytics.timeByModule}
            showCredits={true}
            creditsData={creditsBreakdown}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800">
                Organization Insights
              </CardTitle>
              <CardDescription>
                Key metrics and activity overview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">
                  Average Time per Member
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatDuration(
                    analytics.memberCount > 0
                      ? Math.round(analytics.totalTimeSpent / analytics.memberCount)
                      : 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">
                  Average Credits per Member
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {analytics.memberCount > 0
                    ? Math.round(analytics.totalCreditsConsumed / analytics.memberCount)
                    : 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">
                  Most Used Module
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {analytics.timeByModule.prepare >= analytics.timeByModule.practice
                    ? analytics.timeByModule.prepare >= analytics.timeByModule.perform
                      ? "Prepare"
                      : "Perform"
                    : analytics.timeByModule.practice >= analytics.timeByModule.perform
                    ? "Practice"
                    : "Perform"}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Members Table */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Users2 className="h-5 w-5 text-slate-500" />
                Member Analytics
              </CardTitle>
              <CardDescription>
                Individual member usage and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedMembers.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">
                  No members found in this organization.
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedMembers.map((member) => {
                    const activityStatus = getActivityStatus(member.lastActivity);
                    return (
                      <div
                        key={member.userId}
                        className="border border-slate-200 rounded-lg p-4 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-slate-900">
                                {member.firstName && member.lastName
                                  ? `${member.firstName} ${member.lastName}`
                                  : member.email}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                {member.role}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600">{member.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <p className="text-xs text-slate-500">
                                Last activity:{" "}
                                {member.lastActivity
                                  ? formatDateTime(member.lastActivity)
                                  : "Never"}
                              </p>
                              <TrendingUp
                                className={`h-3 w-3 ${activityStatus.color}`}
                              />
                              <span className={`text-xs ${activityStatus.color}`}>
                                {activityStatus.label}
                              </span>
                            </div>
                          </div>
                          <div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAllocateUserCredits(member)}
                              className="mt-2"
                            >
                              <Wallet className="h-3 w-3 mr-1" />
                              Allocate Credits
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-xs text-slate-500">Total Time</p>
                              <p className="text-sm font-medium text-slate-900">
                                {formatDuration(member.totalTimeSpent)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-amber-500" />
                            <div>
                              <p className="text-xs text-slate-500">Credits</p>
                              <p className="text-sm font-medium text-slate-900">
                                {member.creditsConsumed.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="text-xs text-slate-500">Sessions</p>
                              <p className="text-sm font-medium text-slate-900">
                                {member.sessionCount}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Module Time</p>
                            <div className="flex gap-1">
                              <Badge
                                variant="outline"
                                className="text-xs px-1 py-0 bg-blue-50"
                              >
                                P: {formatDuration(member.timeByModule.prepare)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs px-1 py-0 bg-green-50"
                              >
                                Pr: {formatDuration(member.timeByModule.practice)}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-end">
                            <Badge
                              variant={
                                member.sessionCount > 0 ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {member.sessionCount > 0 ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* User Credit Allocation Dialog */}
      {selectedMember && (
        <CreditAllocationDialog
          open={userCreditDialogOpen}
          onOpenChange={setUserCreditDialogOpen}
          onConfirm={(data) => allocateUserCreditsMutation.mutateAsync(data)}
          targetType="user"
          targetName={
            selectedMember.firstName && selectedMember.lastName
              ? `${selectedMember.firstName} ${selectedMember.lastName}`
              : selectedMember.email
          }
          targetEmail={selectedMember.email}
          currentCredits={selectedMember.creditsConsumed}
        />
      )}

      {/* Organization Credit Allocation Dialog */}
      <CreditAllocationDialog
        open={orgCreditDialogOpen}
        onOpenChange={setOrgCreditDialogOpen}
        onConfirm={(data) => allocateOrgCreditsMutation.mutateAsync(data)}
        targetType="organization"
        targetName={analytics.name}
        memberCount={analytics.memberCount}
      />
    </div>
  );
}
