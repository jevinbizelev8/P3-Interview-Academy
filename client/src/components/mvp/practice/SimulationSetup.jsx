
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Play, AlertCircle, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CreditCostBadge from "../shared/CreditCostBadge";

const STAGES = [
  { value: "hr_screening", label: "HR/Recruiter Screening" },
  { value: "functional_team", label: "Functional/Team Round" },
  { value: "hiring_manager", label: "Hiring Manager Round" },
  { value: "sme_technical", label: "SME/Technical Round" },
  { value: "executive_final", label: "Executive/Final Round" }
];

const SIMULATION_COST = 15; // Credits required per simulation

export default function SimulationSetup({ onStart, onCancel }) {
  const [config, setConfig] = useState({
    stage: "",
    jobTitle: "",
    companyName: "",
    resumeId: ""
  });
  const [currentCredits, setCurrentCredits] = useState(null);

  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => base44.entities.Resume.list('-created_date')
  });

  // Fetch user's credit balance
  useQuery({
    queryKey: ['creditBalance'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      if (subs.length > 0) {
        setCurrentCredits(subs[0].current_credits);
        return subs[0].current_credits;
      }
      return 0;
    }
  });

  const handleStart = () => {
    if (config.stage && config.jobTitle) {
      if (currentCredits !== null && currentCredits < SIMULATION_COST) {
        alert(`Insufficient credits! You need ${SIMULATION_COST} credits for an AI interview simulation. You have ${currentCredits} credits. Please purchase more credits.`);
        return;
      }
      onStart(config);
    }
  };

  const hasInsufficientCredits = currentCredits !== null && currentCredits < SIMULATION_COST;

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="outline"
          onClick={onCancel}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Setup Your Interview Simulation</CardTitle>
                <p className="text-gray-600 mt-1">Configure the details for your practice session</p>
              </div>
              <CreditCostBadge credits={SIMULATION_COST} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {hasInsufficientCredits && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <AlertDescription className="text-red-900">
                  <strong>Insufficient Credits!</strong> You need {SIMULATION_COST} credits but only have {currentCredits}. 
                  <a href="/billing" className="underline ml-1">Purchase more credits</a>
                </AlertDescription>
              </Alert>
            )}

            {currentCredits !== null && !hasInsufficientCredits && (
              <Alert className="bg-blue-50 border-blue-200">
                <Zap className="w-5 h-5 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  You have <strong>{currentCredits} credits</strong>. This simulation will use {SIMULATION_COST} credits.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="stage">Interview Stage *</Label>
              <Select value={config.stage} onValueChange={(value) => setConfig({...config, stage: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interview stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Senior Software Engineer"
                value={config.jobTitle}
                onChange={(e) => setConfig({...config, jobTitle: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input
                id="companyName"
                placeholder="e.g., Tech Corp"
                value={config.companyName}
                onChange={(e) => setConfig({...config, companyName: e.target.value})}
              />
            </div>

            {resumes.length > 0 && (
              <div>
                <Label htmlFor="resume">Select Resume (Optional)</Label>
                <Select value={config.resumeId} onValueChange={(value) => setConfig({...config, resumeId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.file_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Using a resume helps the AI ask more personalized questions
                </p>
              </div>
            )}

            <Button
              onClick={handleStart}
              disabled={!config.stage || !config.jobTitle || hasInsufficientCredits}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Simulation ({SIMULATION_COST} credits)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
