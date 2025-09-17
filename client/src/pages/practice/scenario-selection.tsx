import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ScenarioCard from "@/components/practice/scenario-card";
import { Clock, Eye, Globe, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InterviewScenario, InterviewSession } from "@shared/schema";
import { SUPPORTED_LANGUAGES } from "@shared/schema";

const INTERVIEW_STAGES = [
  {
    id: 'phone-screening',
    title: 'Phone/Initial Screening',
    description: 'First contact interview',
    icon: 'phone',
    color: 'bg-blue-500',
    points: [
      'Background verification',
      'Basic qualification check',
      'Cultural fit assessment'
    ]
  },
  {
    id: 'functional-team',
    title: 'Functional/Team',
    description: 'Team integration focus',
    icon: 'users',
    color: 'bg-green-500',
    points: [
      'Team collaboration skills',
      'Working style assessment',
      'Communication abilities'
    ]
  },
  {
    id: 'hiring-manager',
    title: 'Hiring Manager',
    description: 'Direct supervisor interview',
    icon: 'user-tie',
    color: 'bg-yellow-500',
    points: [
      'Role-specific competencies',
      'Performance expectations',
      'Management style fit'
    ]
  },
  {
    id: 'subject-matter',
    title: 'Subject-Matter Expertise',
    description: 'Technical/specialist knowledge',
    icon: 'cogs',
    color: 'bg-purple-500',
    points: [
      'Technical competencies',
      'Industry-specific knowledge',
      'Problem-solving skills'
    ]
  },
  {
    id: 'executive',
    title: 'Executive/Final Round',
    description: 'Senior leadership interview',
    icon: 'crown',
    color: 'bg-red-500',
    points: [
      'Strategic thinking',
      'Leadership potential',
      'Cultural alignment'
    ]
  }
];

export default function ScenarioSelection() {
  const [jobPosition, setJobPosition] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof SUPPORTED_LANGUAGES>("en");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scenarios = [], isLoading } = useQuery<InterviewScenario[]>({
    queryKey: ["/api/practice/scenarios", jobPosition, companyName],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (jobPosition.trim()) params.append('jobPosition', jobPosition.trim());
      if (companyName.trim()) params.append('companyName', companyName.trim());
      
      const response = await fetch(`/api/practice/scenarios?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
  });

  const { data: sessionsResponse } = useQuery<{ success: boolean; data: InterviewSession[] }>({
    queryKey: ["/api/practice/sessions"],
  });

  const sessions = sessionsResponse?.data || [];
  const recentSessions = sessions.slice(0, 2);

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest("DELETE", `/api/practice/sessions/${sessionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice/sessions"] });
      toast({
        title: "Success",
        description: "Practice session deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete practice session.",
        variant: "destructive",
      });
    },
  });

  const handleReviewSession = (session: InterviewSession) => {
    if (session.status === 'completed') {
      // Navigate to assessment page for completed sessions
      setLocation(`/practice/assessment/${session.id}`);
    } else {
      // Navigate to continue the session for in-progress sessions
      setLocation(`/practice/interview/${session.id}`);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSessionMutation.mutate(sessionId);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Start Your Interview Practice</h2>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Choose Your Interview Stage</h3>
            <p className="text-gray-600 mb-6">
              Select the interview stage you'd like to practise. Each scenario includes 25 tailored questions.
            </p>
            
            {/* Job Context Form */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-md font-medium text-blue-900 mb-3">Personalise Your Interview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="jobPosition" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Position
                  </label>
                  <input
                    type="text"
                    id="jobPosition"
                    value={jobPosition}
                    onChange={(e) => setJobPosition(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google, Meta, Microsoft"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Interview Language
                  </label>
                  <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as keyof typeof SUPPORTED_LANGUAGES)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-sm text-blue-600 mt-2">
                <strong>✨ Dynamic Generation:</strong> These details help our AI create completely unique interview scenarios and questions tailored specifically for your role and company. Each interview will be different!
              </p>
            </div>
            
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {INTERVIEW_STAGES.map((stage) => (
                  <ScenarioCard
                    key={stage.id}
                    stage={stage}
                    jobContext={{ jobPosition, companyName, interviewLanguage: selectedLanguage }}
                    scenarios={scenarios
                      .filter((s: InterviewScenario) => s.interviewStage === stage.id)
                      .map((s: InterviewScenario) => ({
                        id: s.id,
                        title: s.title,
                        sessionCount: 0, // TODO: Get from API
                        averageRating: 0, // TODO: Get from API
                      }))
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {recentSessions.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Practice Sessions</h3>
              <div className="space-y-3">
                {recentSessions.map((session: InterviewSession) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    data-testid={`session-${session.id}`}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 ${session.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center mr-3`}>
                        <div className={`w-3 h-3 ${session.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'} rounded-full`}></div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.status === 'completed' ? 'Completed' : 'In Progress'} - {session.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Started {session.createdAt ? new Date(session.createdAt).toLocaleDateString('en-GB') : 'Unknown'}
                          {session.overallScore && <span> • {session.overallScore}/5 stars</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReviewSession(session)}
                        className="text-primary hover:text-primary/80 text-sm font-medium"
                        data-testid={`button-review-${session.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {session.status === 'completed' ? 'Review' : 'Continue'}
                      </Button>
                      {session.status !== 'completed' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-${session.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Practice Session</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this incomplete practice session? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSession(session.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteSessionMutation.isPending}
                              >
                                {deleteSessionMutation.isPending ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Interview Practice</h3>
                <p className="text-sm text-gray-600">Select an interview scenario to practise</p>
              </div>
              <div className="text-sm text-gray-500 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                15-20 minutes per session
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
