import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Settings,
  Zap,
  Edit,
  Plus,
} from "lucide-react";

interface CreditCost {
  id: string;
  featureName: string;
  creditCost: number;
  description: string;
  isActive: boolean;
  updatedBy: string | null;
  updatedAt: string;
}

export default function CreditCostsPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCost, setEditingCost] = useState<CreditCost | null>(null);
  const [formData, setFormData] = useState({
    featureName: "",
    creditCost: "",
    description: "",
    isActive: true,
  });

  // Fetch credit costs
  const { data, isLoading } = useQuery({
    queryKey: ["admin-credit-costs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/credit-costs");
      if (!response.ok) throw new Error("Failed to fetch credit costs");
      const result = await response.json();
      return result.data.costs as CreditCost[];
    },
  });

  // Update credit cost mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PUT", `/api/admin/credit-costs/${id}`, updates);
      if (!response.ok) throw new Error("Failed to update credit cost");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-credit-costs"] });
      setShowEditDialog(false);
      setEditingCost(null);
    },
  });

  // Create credit cost mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/credit-costs", data);
      if (!response.ok) throw new Error("Failed to create credit cost");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-credit-costs"] });
      setShowCreateDialog(false);
      setFormData({
        featureName: "",
        creditCost: "",
        description: "",
        isActive: true,
      });
    },
  });

  const handleEdit = (cost: CreditCost) => {
    setEditingCost(cost);
    setFormData({
      featureName: cost.featureName,
      creditCost: cost.creditCost.toString(),
      description: cost.description,
      isActive: cost.isActive,
    });
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    if (editingCost) {
      updateMutation.mutate({
        id: editingCost.id,
        updates: {
          creditCost: parseInt(formData.creditCost),
          description: formData.description,
          isActive: formData.isActive,
        },
      });
    }
  };

  const handleCreate = () => {
    createMutation.mutate({
      featureName: formData.featureName,
      creditCost: parseInt(formData.creditCost),
      description: formData.description,
    });
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
              <h1 className="text-3xl font-bold text-gray-900">Credit Cost Configuration</h1>
              <p className="text-gray-600 mt-2">
                Manage credit costs for different features
              </p>
            </div>
            <Button onClick={() => {
              setFormData({
                featureName: "",
                creditCost: "",
                description: "",
                isActive: true,
              });
              setShowCreateDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Feature
            </Button>
          </div>
        </div>

        {/* Credit Costs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Feature Credit Costs
            </CardTitle>
            <CardDescription>
              Configure how many credits each feature requires
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-gray-600">Loading credit costs...</p>
              </div>
            ) : !data || data.length === 0 ? (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No credit cost configurations found</p>
                <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Configuration
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Credit Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-600" />
                            <span className="font-medium">{cost.featureName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-gray-600 truncate">{cost.description}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-lg">{cost.creditCost}</span>
                          <span className="text-sm text-gray-500 ml-1">credits</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cost.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {cost.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(cost.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(cost)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Credit Cost</DialogTitle>
              <DialogDescription>
                Update the credit cost and settings for {editingCost?.featureName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Feature Name</label>
                <Input
                  value={formData.featureName}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Credit Cost</label>
                <Input
                  type="number"
                  placeholder="Enter credit cost"
                  value={formData.creditCost}
                  onChange={(e) => setFormData({ ...formData, creditCost: e.target.value })}
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Description of this feature..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Active</label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={!formData.creditCost || updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Feature Cost</DialogTitle>
              <DialogDescription>
                Create a new credit cost configuration for a feature
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Feature Name</label>
                <Input
                  placeholder="e.g., practice-session, prepare-session"
                  value={formData.featureName}
                  onChange={(e) => setFormData({ ...formData, featureName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Credit Cost</label>
                <Input
                  type="number"
                  placeholder="Enter credit cost"
                  value={formData.creditCost}
                  onChange={(e) => setFormData({ ...formData, creditCost: e.target.value })}
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Description of this feature..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.featureName || !formData.creditCost || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
