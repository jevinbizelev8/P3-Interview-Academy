import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
import type {
  CreditLedgerSnapshot,
  UsageEventSnapshot,
  UserCreditSummary,
} from "@shared/types";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarCheck,
  Coins,
  History,
  RefreshCw,
  ShieldCheck,
  Users2,
} from "lucide-react";

type SerializedLedgerEntry = Omit<CreditLedgerSnapshot, "createdAt"> & {
  createdAt: string;
};

type SerializedUsageEvent = Omit<UsageEventSnapshot, "occurredAt"> & {
  occurredAt: string;
};

type SerializedUserCreditSummary = Omit<
  UserCreditSummary,
  "billingCycleStart" | "billingCycleEnd" | "recentLedger" | "recentUsageEvents"
> & {
  billingCycleStart: string | null;
  billingCycleEnd: string | null;
  recentLedger: SerializedLedgerEntry[];
  recentUsageEvents: SerializedUsageEvent[];
};

interface CreditSummaryResponse {
  success: boolean;
  data: SerializedUserCreditSummary;
}

function deserializeCreditSummary(
  payload: SerializedUserCreditSummary,
): UserCreditSummary {
  const {
    billingCycleStart,
    billingCycleEnd,
    recentLedger,
    recentUsageEvents,
    ...rest
  } = payload;

  return {
    ...rest,
    billingCycleStart: billingCycleStart ? new Date(billingCycleStart) : null,
    billingCycleEnd: billingCycleEnd ? new Date(billingCycleEnd) : null,
    recentLedger: recentLedger.map((entry) => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
    })),
    recentUsageEvents: recentUsageEvents.map((event) => ({
      ...event,
      occurredAt: new Date(event.occurredAt),
    })),
  };
}

function formatDateTime(value: Date | null, fallback = "Not set") {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

const COMPANY_ROLES = new Set(["admin", "manager"]);

export default function CompanyDashboard() {
  const { user } = useAuth();
  const canAccessCompanyTools = useMemo(
    () => (user?.role ? COMPANY_ROLES.has(user.role) : false),
    [user?.role],
  );

  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<UserCreditSummary>({
    queryKey: ["/api/company/credits/me"],
    enabled: canAccessCompanyTools,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/company/credits/me");
      const json = (await response.json()) as CreditSummaryResponse;

      if (!json.success) {
        throw new Error("Unable to load credit summary");
      }

      return deserializeCreditSummary(json.data);
    },
  });

  if (!user) {
    return null;
  }

  if (!canAccessCompanyTools) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <CardTitle>Company dashboard restricted</CardTitle>
            <CardDescription>
              Only company administrators or organization managers can view this
              area.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Please contact your company administrator if you believe you
              should have access to provisioning tools and usage insights.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierLabel = summary?.accountTier === "paid" ? "Paid" : "Free";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Company workspace</p>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    Company dashboard
                  </h1>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm text-slate-600">
                You can reach this space by signing in through the standard
                login page and using the new <strong>Company</strong> link in
                the top navigation. From here you can monitor credit balances,
                track usage, and provision members.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-slate-700">
                {tierLabel} tier
              </Badge>
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Main dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-slate-600">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Loading company credits…</span>
              </div>
            </CardContent>
          </Card>
        )}

        {isError && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Unable to load credit summary
              </CardTitle>
              <CardDescription className="text-red-800">
                {(error as Error)?.message ?? "Please try again."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => refetch()} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {summary && !isLoading && !isError && (
          <>
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-500" />
                    Current balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-slate-900">
                    {summary.creditBalance.toLocaleString()} credits
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    {summary.totalCreditsConsumed.toLocaleString()} consumed this
                    cycle
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-sky-500" />
                    Monthly allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-slate-900">
                    {summary.monthlyCreditAllocation.toLocaleString()} credits
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Allocated based on the active plan tier
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-emerald-500" />
                    Billing cycle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <div>
                    <span className="font-medium text-slate-800">Start:</span>
                    <span className="ml-2">
                      {formatDateTime(summary.billingCycleStart)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-800">Ends:</span>
                    <span className="ml-2">
                      {formatDateTime(summary.billingCycleEnd)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-purple-500" />
                    Team access
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 space-y-2">
                  <p>
                    Share this dashboard with fellow administrators or managers
                    by assigning them the relevant role when provisioning a
                    user.
                  </p>
                  <p className="text-slate-500">
                    Organization managers can review credits for members of the
                    teams they oversee.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <History className="h-5 w-5 text-slate-500" />
                    Recent credit ledger
                  </CardTitle>
                  <CardDescription>
                    The most recent adjustments, refills, and consumptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.recentLedger.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No ledger entries yet. Credits will appear here as soon as
                      users start using the Prepare or Practice modules.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {summary.recentLedger.map((entry) => (
                        <div
                          key={entry.id}
                          className="border border-slate-200 rounded-lg p-4 bg-white"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-slate-900">
                                {entry.reason || "Credit update"}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatDateTime(entry.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-lg font-semibold ${
                                  entry.amount < 0
                                    ? "text-rose-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {entry.amount > 0 ? "+" : ""}
                                {entry.amount}
                              </p>
                              {entry.balanceAfter !== null && (
                                <p className="text-xs text-slate-500">
                                  Balance: {entry.balanceAfter}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                            {entry.module && (
                              <span className="px-2 py-1 bg-slate-100 rounded-full">
                                Module: {entry.module}
                              </span>
                            )}
                            {entry.sessionId && (
                              <span className="px-2 py-1 bg-slate-100 rounded-full">
                                Session: {entry.sessionId}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Activity className="h-5 w-5 text-slate-500" />
                    Module breakdown
                  </CardTitle>
                  <CardDescription>
                    Credits consumed by module across this billing cycle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.breakdown.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No usage recorded yet. Launch a Prepare or Practice session
                      to see credit consumption here.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {summary.breakdown.map((item) => (
                        <div
                          key={item.module}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white"
                        >
                          <div>
                            <p className="font-medium text-slate-900 capitalize">
                              {item.module}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {item.sessionCount} session{item.sessionCount === 1 ? "" : "s"}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-slate-700">
                            {item.creditsConsumed} credits
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <ShieldCheck className="h-5 w-5 text-slate-500" />
                    Administrator quick actions
                  </CardTitle>
                  <CardDescription>
                    Use the dashboard APIs to provision accounts, assign roles,
                    and update credit balances.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-600">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-900 mb-1">
                      Provision or update an account
                    </p>
                    <p>
                      Send a <code className="px-1 py-0.5 bg-slate-100 rounded">
                        POST /api/company/users
                      </code>{" "}
                      request with the user details, tier, and monthly credits.
                      If an email already exists it will update their plan and
                      reset the billing cycle.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-900 mb-1">
                      Adjust credits later
                    </p>
                    <p>
                      Issue a <code className="px-1 py-0.5 bg-slate-100 rounded">
                        PATCH /api/company/users/:userId/credits
                      </code>{" "}
                      call to change a user&rsquo;s tier, monthly allocation, or live
                      balance. All adjustments are recorded in the credit
                      ledger.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-900 mb-1">
                      Monitor organizations
                    </p>
                    <p>
                      Use <code className="px-1 py-0.5 bg-slate-100 rounded">
                        GET /api/company/organizations/:orgId/usage
                      </code>{" "}
                      to view every member&rsquo;s balance and session history for the
                      teams you oversee.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <History className="h-5 w-5 text-slate-500" />
                    Recent usage events
                  </CardTitle>
                  <CardDescription>
                    Session-level deductions captured when credits are consumed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.recentUsageEvents.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No usage yet. When a Prepare or Practice session starts the
                      consumption event will be displayed here.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {summary.recentUsageEvents.map((event) => (
                        <div
                          key={event.id}
                          className="border border-slate-200 rounded-lg p-4 bg-white"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-slate-900 capitalize">
                                {event.module}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatDateTime(event.occurredAt)}
                              </p>
                            </div>
                            <p className="text-lg font-semibold text-rose-600">
                              -{event.creditsConsumed}
                            </p>
                          </div>
                          {event.sessionId && (
                            <p className="text-xs text-slate-500 mt-3">
                              Session reference: {event.sessionId}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
