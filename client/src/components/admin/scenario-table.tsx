import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Edit, Eye, Trash2, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { InterviewScenarioWithStats } from "@shared/schema";

const STAGE_COLORS = {
  'phone-screening': 'bg-blue-100 text-blue-800',
  'functional-team': 'bg-green-100 text-green-800',
  'hiring-manager': 'bg-yellow-100 text-yellow-800',
  'subject-matter': 'bg-purple-100 text-purple-800',
  'executive-final': 'bg-red-100 text-red-800',
};

const STAGE_NAMES = {
  'phone-screening': 'Phone Screening',
  'functional-team': 'Functional/Team',
  'hiring-manager': 'Hiring Manager',
  'subject-matter': 'Subject-Matter',
  'executive-final': 'Executive/Final',
};

interface ScenarioTableProps {
  scenarios: InterviewScenarioWithStats[];
  searchTerm: string;
  stageFilter: string;
  isLoading: boolean;
}

export default function ScenarioTable({ 
  scenarios, 
  searchTerm, 
  stageFilter, 
  isLoading 
}: ScenarioTableProps) {
  const [deleteScenario, setDeleteScenario] = useState<InterviewScenarioWithStats | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      const response = await fetch(`/api/practice/scenarios/${scenarioId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete scenario');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice/scenarios"] });
      toast({
        title: "Success",
        description: "Scenario deleted successfully.",
      });
      setDeleteScenario(null);
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete scenario. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter scenarios
  const filteredScenarios = scenarios.filter(scenario => {
    const matchesSearch = !searchTerm || 
      scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.jobRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = !stageFilter || scenario.interviewStage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  const handlePreview = (scenario: InterviewScenarioWithStats) => {
    // TODO: Implement preview functionality
    toast({
      title: "Coming Soon",
      description: "Scenario preview functionality will be available soon.",
    });
  };

  const handleEdit = (scenario: InterviewScenarioWithStats) => {
    // TODO: Implement edit functionality
    toast({
      title: "Coming Soon",
      description: "Scenario editing functionality will be available soon.",
    });
  };

  const handleDelete = (scenario: InterviewScenarioWithStats) => {
    setDeleteScenario(scenario);
  };

  const confirmDelete = () => {
    if (deleteScenario) {
      deleteMutation.mutate(deleteScenario.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <div className="animate-pulse flex space-x-4 flex-1">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredScenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Eye className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No scenarios found</h3>
        <p className="text-gray-600">
          {searchTerm || stageFilter 
            ? "Try adjusting your search or filter criteria."
            : "Create your first interview scenario to get started."
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Scenario</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredScenarios.map((scenario) => (
            <TableRow key={scenario.id}>
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">
                    {scenario.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {scenario.jobRole}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={STAGE_COLORS[scenario.interviewStage as keyof typeof STAGE_COLORS]}
                >
                  {STAGE_NAMES[scenario.interviewStage as keyof typeof STAGE_NAMES]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-900">
                {scenario.industry}
              </TableCell>
              <TableCell className="text-sm text-gray-900">
                {scenario.sessionCount || 0} sessions
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">
                    {scenario.averageRating ? Number(scenario.averageRating).toFixed(1) : '—'}
                  </span>
                  {scenario.averageRating && (
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-xs ${
                            star <= Number(scenario.averageRating) 
                              ? 'text-yellow-400' 
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={scenario.status === 'active' ? 'default' : 'secondary'}
                  className={
                    scenario.status === 'active' 
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : scenario.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }
                >
                  {scenario.status === 'active' && '●'} {scenario.status}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handlePreview(scenario)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(scenario)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(scenario)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination would go here */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {filteredScenarios.length} of {scenarios.length} scenarios
          </p>
          {/* TODO: Implement pagination if needed */}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteScenario} onOpenChange={() => setDeleteScenario(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scenario</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteScenario?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
