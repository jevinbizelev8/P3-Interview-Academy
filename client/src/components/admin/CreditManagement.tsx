import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Zap } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  creditBalance: number;
  monthlyCreditAllocation: number;
  topUpCredits: number;
}

interface CreditManagementProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreditManagement({ user, onClose, onSuccess }: CreditManagementProps) {
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addCreditsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/users/${user.id}/credits/add`, {
        amount: parseInt(amount),
        reason: reason || "Admin credit adjustment"
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
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", user.id] });
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

    const creditAmount = parseInt(amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Credit amount must be a positive number",
        variant: "destructive"
      });
      return;
    }

    addCreditsMutation.mutate();
  };

  const totalCredits = user.creditBalance + user.topUpCredits;
  const userName = user.firstName || user.lastName
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : user.email;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Manage Credits - {userName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Credits Display */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">{totalCredits}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Monthly Allocation</p>
                <p className="text-2xl font-bold text-purple-600">{user.monthlyCreditAllocation}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Subscription Credits</p>
                <p className="text-lg font-semibold text-gray-700">{user.creditBalance}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Top-up Credits</p>
                <p className="text-lg font-semibold text-gray-700">{user.topUpCredits}</p>
              </div>
            </div>
          </div>

          {/* Add Credits Form */}
          <div>
            <Label htmlFor="amount">Credits to Add *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a positive number to add credits
            </p>
          </div>

          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., UAT testing, compensation, promotional credits"
              rows={3}
            />
          </div>

          {/* Preview */}
          {amount && parseInt(amount) > 0 && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-900">
                <strong>New balance:</strong> {totalCredits} + {amount} = <strong>{totalCredits + parseInt(amount)}</strong> credits
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addCreditsMutation.isPending}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              {addCreditsMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Add Credits
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
