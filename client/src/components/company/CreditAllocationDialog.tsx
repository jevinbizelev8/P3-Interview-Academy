import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Users, User, Coins } from "lucide-react";

const creditAllocationSchema = z.object({
  accountTier: z.enum(["free", "paid"]).optional(),
  monthlyCredits: z.coerce.number().min(0).optional(),
  creditBalance: z.coerce.number().min(0).optional(),
  reason: z.string().min(1, "Reason is required").max(500),
}).refine(
  (data) => data.accountTier || data.monthlyCredits !== undefined || data.creditBalance !== undefined,
  {
    message: "At least one field (Account Tier, Monthly Credits, or Credit Balance) must be provided",
    path: ["accountTier"],
  }
);

type CreditAllocationFormData = z.infer<typeof creditAllocationSchema>;

interface CreditAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: CreditAllocationFormData) => Promise<void>;
  targetType: "user" | "organization";
  targetName: string;
  targetEmail?: string;
  memberCount?: number;
  currentCredits?: number;
  currentTier?: string;
  currentMonthlyAllocation?: number;
}

export function CreditAllocationDialog({
  open,
  onOpenChange,
  onConfirm,
  targetType,
  targetName,
  targetEmail,
  memberCount,
  currentCredits,
  currentTier,
  currentMonthlyAllocation,
}: CreditAllocationDialogProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<CreditAllocationFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreditAllocationFormData>({
    resolver: zodResolver(creditAllocationSchema),
    defaultValues: {
      accountTier: undefined,
      monthlyCredits: undefined,
      creditBalance: undefined,
      reason: "",
    },
  });

  const handleFormSubmit = (data: CreditAllocationFormData) => {
    setPendingData(data);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (!pendingData) return;

    setIsSubmitting(true);
    try {
      await onConfirm(pendingData);
      setShowConfirmation(false);
      onOpenChange(false);
      form.reset();
      setPendingData(null);
    } catch (error) {
      console.error("Credit allocation failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setPendingData(null);
  };

  const handleDialogClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      form.reset();
      setPendingData(null);
      setShowConfirmation(false);
    }
  };

  // Calculate preview values
  const previewTier = pendingData?.accountTier || currentTier || "free";
  const previewMonthlyAllocation =
    pendingData?.monthlyCredits !== undefined
      ? pendingData.monthlyCredits
      : currentMonthlyAllocation;
  const previewBalance =
    pendingData?.creditBalance !== undefined
      ? pendingData.creditBalance
      : currentCredits;

  return (
    <>
      {/* Step 1: Credit Allocation Form */}
      <Dialog open={open && !showConfirmation} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {targetType === "organization" ? (
                <Users className="h-5 w-5 text-blue-500" />
              ) : (
                <User className="h-5 w-5 text-purple-500" />
              )}
              Allocate Credits
            </DialogTitle>
            <DialogDescription>
              {targetType === "organization"
                ? `Allocate credits to all ${memberCount} members of ${targetName}`
                : `Allocate credits to ${targetName}`}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              {/* Target Info Card */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Target:</span>
                    <span className="text-sm font-semibold text-slate-900">{targetName}</span>
                  </div>
                  {targetEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Email:</span>
                      <span className="text-sm text-slate-600">{targetEmail}</span>
                    </div>
                  )}
                  {targetType === "organization" && memberCount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Members:</span>
                      <Badge variant="secondary">{memberCount} users</Badge>
                    </div>
                  )}
                  {currentCredits !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Current Balance:</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {currentCredits.toLocaleString()} credits
                      </span>
                    </div>
                  )}
                  {currentTier && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Current Tier:</span>
                      <Badge variant={currentTier === "paid" ? "default" : "secondary"}>
                        {currentTier}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Tier */}
              <FormField
                control={form.control}
                name="accountTier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Tier (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier (no change)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Change the account tier for the target
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Monthly Credits */}
              <FormField
                control={form.control}
                name="monthlyCredits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Credit Allocation (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Leave empty for no change"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Set the monthly credit allocation amount
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Credit Balance */}
              <FormField
                control={form.control}
                name="creditBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Balance (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Leave empty for no change"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Set the current credit balance
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter reason for this credit allocation (required for audit trail)"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be recorded in the audit trail
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Review Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Step 2: Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Confirm Credit Allocation
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Please review the changes before confirming. This action will be recorded
                in the audit trail.
              </p>

              {/* Preview Card */}
              <div className="p-4 bg-slate-50 rounded-lg border-2 border-amber-200 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-slate-900">
                    Changes Preview
                  </span>
                </div>

                {targetType === "organization" && memberCount && (
                  <div className="p-2 bg-amber-50 rounded border border-amber-200">
                    <p className="text-sm font-medium text-amber-900">
                      ⚠️ This will affect {memberCount} users
                    </p>
                  </div>
                )}

                {pendingData?.accountTier && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Account Tier:</span>
                    <div className="flex items-center gap-2">
                      {currentTier && (
                        <>
                          <Badge variant="outline">{currentTier}</Badge>
                          <span className="text-slate-400">→</span>
                        </>
                      )}
                      <Badge variant={pendingData.accountTier === "paid" ? "default" : "secondary"}>
                        {pendingData.accountTier}
                      </Badge>
                    </div>
                  </div>
                )}

                {pendingData?.monthlyCredits !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Monthly Allocation:</span>
                    <div className="flex items-center gap-2">
                      {currentMonthlyAllocation !== undefined && (
                        <>
                          <span className="text-sm font-medium text-slate-500">
                            {currentMonthlyAllocation.toLocaleString()}
                          </span>
                          <span className="text-slate-400">→</span>
                        </>
                      )}
                      <span className="text-sm font-semibold text-slate-900">
                        {pendingData.monthlyCredits.toLocaleString()} credits
                      </span>
                    </div>
                  </div>
                )}

                {pendingData?.creditBalance !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Credit Balance:</span>
                    <div className="flex items-center gap-2">
                      {currentCredits !== undefined && (
                        <>
                          <span className="text-sm font-medium text-slate-500">
                            {currentCredits.toLocaleString()}
                          </span>
                          <span className="text-slate-400">→</span>
                        </>
                      )}
                      <span className="text-sm font-semibold text-slate-900">
                        {pendingData.creditBalance.toLocaleString()} credits
                      </span>
                    </div>
                  </div>
                )}

                {pendingData?.reason && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Reason:</p>
                    <p className="text-sm text-slate-900 italic">"{pendingData.reason}"</p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} disabled={isSubmitting}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? "Allocating..." : "Confirm Allocation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
