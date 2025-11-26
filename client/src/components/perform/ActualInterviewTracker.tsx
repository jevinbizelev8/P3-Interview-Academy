import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ActualInterview {
  id: string;
  companyName: string;
  position: string;
  interviewDate: string;
  interviewType?: string;
  outcome: 'offer' | 'next_round' | 'rejected' | 'pending';
  confidenceLevel?: number;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
}

export default function ActualInterviewTracker() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    position: "",
    interviewDate: "",
    interviewType: "",
    outcome: "pending" as const,
    confidenceLevel: 5,
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch actual interviews
  const { data: interviews = [], isLoading } = useQuery<ActualInterview[]>({
    queryKey: ['actualInterviews'],
    queryFn: async () => {
      const response = await fetch('/api/perform/actual-interviews', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch interviews');
      }

      const result = await response.json();
      return result.data || [];
    },
  });

  // Create interview mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/perform/actual-interviews', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create interview');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actualInterviews'] });
      setShowForm(false);
      setFormData({
        companyName: "",
        position: "",
        interviewDate: "",
        interviewType: "",
        outcome: "pending",
        confidenceLevel: 5,
        notes: "",
      });

      toast({
        title: "Interview logged!",
        description: "Your interview has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating interview",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const outcomeColors = {
    offer: "bg-green-100 text-green-800 border-green-200",
    next_round: "bg-blue-100 text-blue-800 border-blue-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  const outcomeIcons = {
    offer: CheckCircle2,
    next_round: TrendingUp,
    rejected: XCircle,
    pending: Clock,
  };

  // Calculate success rate
  const totalInterviews = interviews.length;
  const offers = interviews.filter(i => i.outcome === 'offer').length;
  const successRate = totalInterviews > 0 ? Math.round((offers / totalInterviews) * 100) : 0;

  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Actual Interview Tracker
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Success Rate: <span className="font-bold text-green-600">{successRate}%</span>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Interview
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">Track real interviews and follow-up actions</p>
      </CardHeader>
      <CardContent>
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Company Name *</Label>
                        <Input
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Job Title *</Label>
                        <Input
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Interview Date *</Label>
                        <Input
                          type="date"
                          value={formData.interviewDate}
                          onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Interview Type</Label>
                        <Input
                          value={formData.interviewType}
                          onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })}
                          placeholder="e.g., Phone, Video, In-person"
                        />
                      </div>
                      <div>
                        <Label>Outcome</Label>
                        <Select
                          value={formData.outcome}
                          onValueChange={(value) => setFormData({ ...formData, outcome: value as typeof formData.outcome })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="offer">Offer</SelectItem>
                            <SelectItem value="next_round">Next Round</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Confidence Level: {formData.confidenceLevel}/10</Label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.confidenceLevel}
                          onChange={(e) => setFormData({ ...formData, confidenceLevel: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="How did it go? Key questions asked? Areas to improve?"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                        {createMutation.isPending ? 'Saving...' : 'Save Interview'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-20 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : interviews.length > 0 ? (
          <div className="space-y-4">
            {interviews.map((interview) => {
              const OutcomeIcon = outcomeIcons[interview.outcome];
              return (
                <Card key={interview.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{interview.position}</h3>
                        <p className="text-gray-600">{interview.companyName}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(interview.interviewDate), 'MMM d, yyyy')}
                          {interview.interviewType && ` • ${interview.interviewType}`}
                        </p>
                      </div>
                      <Badge className={`${outcomeColors[interview.outcome]} border flex items-center gap-1`}>
                        <OutcomeIcon className="w-3 h-3" />
                        {interview.outcome.replace('_', ' ')}
                      </Badge>
                    </div>

                    {interview.notes && (
                      <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded-lg">
                        {interview.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-bold text-purple-700 ml-2">
                          {interview.confidenceLevel}/10
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No interviews logged yet</p>
            <p className="text-sm text-gray-400 mt-2">Start tracking your real interview experiences</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
