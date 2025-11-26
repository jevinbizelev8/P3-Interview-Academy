import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Zap, Users as UsersIcon, AlertTriangle } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface BulkOperationsProps {
  selectedUsers: User[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkOperations({ selectedUsers, onClose, onSuccess }: BulkOperationsProps) {
  const [creditAmount, setCreditAmount] = useState<string>("");
  const [reason, setReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bulkCreditsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/users/bulk/credits", {
        userIds: selectedUsers.map(u => u.id),
        amount: parseInt(creditAmount),
        reason: reason || "Bulk admin credit adjustment"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add credits');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Credits Added",
        description: `Successfully added ${creditAmount} credits to ${data.updated} users`
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/users/bulk/action", {
        userIds: selectedUsers.map(u => u.id),
        action: "delete"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete users');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Users Deleted",
        description: `Successfully deleted ${data.updated} users`
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setShowDeleteConfirm(false);
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setShowDeleteConfirm(false);
    }
  });

  const handleAddCredits = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Credit amount must be a positive number",
        variant: "destructive"
      });
      return;
    }

    bulkCreditsMutation.mutate();
  };

  const handleDeleteUsers = () => {
    bulkDeleteMutation.mutate();
  };

  const userEmails = selectedUsers.map(u => u.email).join(", ");

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-purple-600" />
              Bulk Operations
            </DialogTitle>
            <DialogDescription>
              Manage {selectedUsers.length} selected user{selectedUsers.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="credits" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credits">Add Credits</TabsTrigger>
              <TabsTrigger value="actions">User Actions</TabsTrigger>
            </TabsList>

            {/* Add Credits Tab */}
            <TabsContent value="credits">
              <form onSubmit={handleAddCredits} className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="bulk-amount">Credits to Add *</Label>
                  <Input
                    id="bulk-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Enter amount..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This amount will be added to each selected user
                  </p>
                </div>

                <div>
                  <Label htmlFor="bulk-reason">Reason (optional)</Label>
                  <Textarea
                    id="bulk-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., UAT testing, promotional campaign"
                    rows={3}
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Affected users:</strong>
                  </p>
                  <p className="text-xs text-blue-800 mt-1 max-h-20 overflow-y-auto">
                    {userEmails}
                  </p>
                </div>

                {creditAmount && parseInt(creditAmount) > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-sm text-green-900">
                      <strong>Total credits to allocate:</strong> {parseInt(creditAmount)} × {selectedUsers.length} = <strong>{parseInt(creditAmount) * selectedUsers.length}</strong> credits
                    </p>
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={bulkCreditsMutation.isPending}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    {bulkCreditsMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
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
            </TabsContent>

            {/* User Actions Tab */}
            <TabsContent value="actions">
              <div className="space-y-4 pt-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Selected users:</strong>
                  </p>
                  <p className="text-xs text-blue-800 mt-1 max-h-20 overflow-y-auto">
                    {userEmails}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Delete {selectedUsers.length} User{selectedUsers.length > 1 ? 's' : ''}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    This action will soft-delete users and can be reversed by database admin
                  </p>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </DialogFooter>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirm Bulk User Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900 mb-2">
                      This action will soft-delete user accounts!
                    </p>
                    <p className="text-sm text-red-800">
                      You are about to delete <strong>{selectedUsers.length}</strong> user account{selectedUsers.length > 1 ? 's' : ''} and all associated data including:
                    </p>
                    <ul className="text-sm text-red-800 mt-2 space-y-1 list-disc list-inside">
                      <li>User profiles and settings</li>
                      <li>Interview simulations and results</li>
                      <li>Credit history and subscriptions</li>
                      <li>All personal data</li>
                    </ul>
                    <p className="text-sm text-red-800 mt-2">
                      Note: This is a soft delete and can be reversed by a database administrator.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-1">Users to be deleted:</p>
                <p className="text-sm text-gray-700 max-h-24 overflow-y-auto">{userEmails}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUsers}
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedUsers.length} User${selectedUsers.length > 1 ? 's' : ''}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
