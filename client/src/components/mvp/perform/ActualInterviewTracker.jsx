import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, CheckCircle2, XCircle, Clock, Mail, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  useActualInterviews,
  useCreateActualInterview,
  useUpdateActualInterview
} from '@/hooks/useApi';

export default function ActualInterviewTracker() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    job_title: "",
    interview_date: "",
    interview_stage: "",
    outcome: "pending",
    self_rating: 50,
    notes: "",
    thank_you_sent: false
  });

  const { data: interviews = [] } = useActualInterviews();
  const createMutation = useCreateActualInterview({
    onSuccess: () => {
      setShowForm(false);
      setFormData({
        company_name: "",
        job_title: "",
        interview_date: "",
        interview_stage: "",
        outcome: "pending",
        self_rating: 50,
        notes: "",
        thank_you_sent: false
      });
    }
  });
  const updateMutation = useUpdateActualInterview();

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const toggleThankYou = (interview) => {
    updateMutation.mutate({
      id: interview.id,
      data: {
        ...interview,
        thank_you_sent: !interview.thank_you_sent,
        thank_you_date: !interview.thank_you_sent ? new Date().toISOString().split('T')[0] : null
      }
    });
  };

  const outcomeColors = {
    success: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    withdrew: "bg-gray-100 text-gray-800 border-gray-200"
  };

  const outcomeIcons = {
    success: CheckCircle2,
    rejected: XCircle,
    pending: Clock,
    withdrew: XCircle
  };

  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Actual Interview Tracker
          </CardTitle>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Interview
          </Button>
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
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Job Title *</Label>
                        <Input
                          value={formData.job_title}
                          onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Interview Date *</Label>
                        <Input
                          type="date"
                          value={formData.interview_date}
                          onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Interview Stage *</Label>
                        <Select
                          value={formData.interview_stage}
                          onValueChange={(value) => setFormData({ ...formData, interview_stage: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hr_screening">HR Screening</SelectItem>
                            <SelectItem value="functional_team">Functional/Team</SelectItem>
                            <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                            <SelectItem value="sme_technical">Technical/SME</SelectItem>
                            <SelectItem value="executive_final">Executive/Final</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Outcome</Label>
                        <Select
                          value={formData.outcome}
                          onValueChange={(value) => setFormData({ ...formData, outcome: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="withdrew">Withdrew</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Self Rating: {formData.self_rating}%</Label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formData.self_rating}
                          onChange={(e) => setFormData({ ...formData, self_rating: parseInt(e.target.value) })}
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
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.thank_you_sent}
                        onCheckedChange={(checked) => setFormData({ ...formData, thank_you_sent: checked })}
                      />
                      <Label>Thank you note sent</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        Save Interview
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

        {interviews.length > 0 ? (
          <div className="space-y-4">
            {interviews.map((interview) => {
              const OutcomeIcon = outcomeIcons[interview.outcome];
              return (
                <Card key={interview.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{interview.job_title}</h3>
                        <p className="text-gray-600">{interview.company_name}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(interview.interview_date), 'MMM d, yyyy')} • {interview.interview_stage?.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <Badge className={`${outcomeColors[interview.outcome]} border flex items-center gap-1`}>
                        <OutcomeIcon className="w-3 h-3" />
                        {interview.outcome}
                      </Badge>
                    </div>

                    {interview.notes && (
                      <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded-lg">
                        {interview.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-gray-600">Self Rating:</span>
                          <span className="font-bold text-purple-700 ml-2">{interview.self_rating}%</span>
                        </div>
                      </div>
                      <Button
                        variant={interview.thank_you_sent ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleThankYou(interview)}
                        className={interview.thank_you_sent ? "border-green-500 text-green-700" : ""}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {interview.thank_you_sent ? "Thank You Sent ✓" : "Send Thank You"}
                      </Button>
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