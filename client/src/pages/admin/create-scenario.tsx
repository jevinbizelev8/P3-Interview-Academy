import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createScenarioSchema = z.object({
  title: z.string().min(1, "Title is required"),
  interviewStage: z.string().min(1, "Interview stage is required"),
  industry: z.string().min(1, "Industry is required"),
  jobRole: z.string().min(1, "Job role is required"),
  companyBackground: z.string().min(1, "Company background is required"),
  roleDescription: z.string().min(1, "Role description is required"),
  candidateBackground: z.string().min(1, "Candidate background is required"),
  keyObjectives: z.string().min(1, "Key objectives are required"),
  interviewerName: z.string().min(1, "Interviewer name is required"),
  interviewerTitle: z.string().min(1, "Interviewer title is required"),
  interviewerStyle: z.string().min(1, "Interview style is required"),
  personalityTraits: z.string().min(1, "Personality traits are required"),
  status: z.enum(['active', 'draft']).default('active'),
});

type CreateScenarioForm = z.infer<typeof createScenarioSchema>;

const INTERVIEW_STAGES = [
  { value: 'phone-screening', label: 'Phone/Initial Screening' },
  { value: 'functional-team', label: 'Functional/Team' },
  { value: 'hiring-manager', label: 'Hiring Manager' },
  { value: 'subject-matter', label: 'Subject-Matter Expertise' },
  { value: 'executive-final', label: 'Executive/Final Round' },
];

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Education',
  'Consulting',
  'Marketing',
  'Sales',
  'Human Resources',
];

const INTERVIEW_STYLES = [
  'Conversational and friendly',
  'Formal and structured',
  'Technical and detail-oriented',
  'Strategic and big-picture',
  'Challenging and pressure-testing',
];

export default function CreateScenario() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreateScenarioForm>({
    resolver: zodResolver(createScenarioSchema),
    defaultValues: {
      status: 'active',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateScenarioForm) => {
      const response = await fetch('/api/practice/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create scenario');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice/scenarios"] });
      toast({
        title: "Success",
        description: "Scenario created successfully!",
      });
      setLocation("/admin");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create scenario. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateScenarioForm) => {
    createMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation("/admin");
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Create New Interview Scenario</h2>
              <p className="text-gray-600">Set up a new practice scenario for learners</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Scenario Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Marketing Manager - TechStart Solutions"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="interviewStage">Interview Stage *</Label>
                <Select onValueChange={(value) => setValue('interviewStage', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interview stage..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_STAGES.map(stage => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.interviewStage && (
                  <p className="text-sm text-red-600 mt-1">{errors.interviewStage.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select onValueChange={(value) => setValue('industry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(industry => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.industry && (
                  <p className="text-sm text-red-600 mt-1">{errors.industry.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="jobRole">Job Role *</Label>
                <Input
                  id="jobRole"
                  placeholder="e.g., Marketing Manager"
                  {...register('jobRole')}
                />
                {errors.jobRole && (
                  <p className="text-sm text-red-600 mt-1">{errors.jobRole.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Interviewer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Interviewer Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="interviewerName">Interviewer Name *</Label>
                <Input
                  id="interviewerName"
                  placeholder="e.g., Sarah Johnson"
                  {...register('interviewerName')}
                />
                {errors.interviewerName && (
                  <p className="text-sm text-red-600 mt-1">{errors.interviewerName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="interviewerTitle">Interviewer Title *</Label>
                <Input
                  id="interviewerTitle"
                  placeholder="e.g., HR Manager"
                  {...register('interviewerTitle')}
                />
                {errors.interviewerTitle && (
                  <p className="text-sm text-red-600 mt-1">{errors.interviewerTitle.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="interviewerStyle">Interview Style *</Label>
                <Select onValueChange={(value) => setValue('interviewerStyle', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interview style..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_STYLES.map(style => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.interviewerStyle && (
                  <p className="text-sm text-red-600 mt-1">{errors.interviewerStyle.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="personalityTraits">Personality Traits *</Label>
                <Textarea
                  id="personalityTraits"
                  rows={3}
                  placeholder="e.g., Approachable, thorough, values authenticity..."
                  {...register('personalityTraits')}
                />
                {errors.personalityTraits && (
                  <p className="text-sm text-red-600 mt-1">{errors.personalityTraits.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scenario Context */}
        <Card>
          <CardHeader>
            <CardTitle>Scenario Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyBackground">Company Background *</Label>
              <Textarea
                id="companyBackground"
                rows={3}
                placeholder="Describe the company, its industry, size, and current situation..."
                {...register('companyBackground')}
              />
              {errors.companyBackground && (
                <p className="text-sm text-red-600 mt-1">{errors.companyBackground.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="roleDescription">Role Description *</Label>
              <Textarea
                id="roleDescription"
                rows={3}
                placeholder="Describe the role, key responsibilities, and what the company is looking for..."
                {...register('roleDescription')}
              />
              {errors.roleDescription && (
                <p className="text-sm text-red-600 mt-1">{errors.roleDescription.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="candidateBackground">Candidate Background *</Label>
              <Textarea
                id="candidateBackground"
                rows={3}
                placeholder="Describe the candidate's background, experience, and motivation for applying..."
                {...register('candidateBackground')}
              />
              {errors.candidateBackground && (
                <p className="text-sm text-red-600 mt-1">{errors.candidateBackground.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="keyObjectives">Key Objectives *</Label>
              <Textarea
                id="keyObjectives"
                rows={3}
                placeholder="List the main objectives for this interview stage..."
                {...register('keyObjectives')}
              />
              {errors.keyObjectives && (
                <p className="text-sm text-red-600 mt-1">{errors.keyObjectives.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setValue('status', 'draft');
              handleSubmit(onSubmit)();
            }}
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Scenario"}
          </Button>
        </div>
      </form>
    </main>
  );
}
