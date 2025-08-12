import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Award, Building, Briefcase, Globe, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_LANGUAGES } from "@shared/schema";

export default function PerformSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    jobPosition: "",
    companyName: "",
    interviewLanguage: "en" as keyof typeof SUPPORTED_LANGUAGES,
    jobDescription: "",
    specificFocus: "",
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/perform/sessions", "POST", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Interview Session Created",
        description: "Your personalized AI interview is ready to begin.",
      });
      setLocation(`/perform/interview/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create interview session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jobPosition.trim() || !formData.companyName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both job position and company name.",
        variant: "destructive",
      });
      return;
    }
    createSessionMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
          <Award className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Perform: AI Interview Simulation
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience advanced AI-powered interview coaching with real-time evaluation, 
          personalized feedback, and comprehensive performance analysis across 10 key metrics.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
            Real-time AI Coaching
          </Badge>
          <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700">
            10-Point Evaluation
          </Badge>
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
            Multi-language Support
          </Badge>
        </div>
      </div>

      <Card className="shadow-xl border-0">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Set Up Your Interview Context
          </CardTitle>
          <CardDescription className="text-lg">
            Provide your target job details for personalized AI interview questions and evaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="jobPosition" className="text-base font-medium">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Target Job Position *
                </Label>
                <Input
                  id="jobPosition"
                  value={formData.jobPosition}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobPosition: e.target.value }))}
                  placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist"
                  className="mt-2"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Be specific to get tailored interview questions
                </p>
              </div>

              <div>
                <Label htmlFor="companyName" className="text-base font-medium">
                  <Building className="w-4 h-4 inline mr-2" />
                  Target Company *
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="e.g., Google, Meta, Microsoft, Grab, Sea Limited"
                  className="mt-2"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  AI will adapt questions to company culture and values
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="interviewLanguage" className="text-base font-medium">
                <Globe className="w-4 h-4 inline mr-2" />
                Interview Language
              </Label>
              <Select
                value={formData.interviewLanguage}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  interviewLanguage: value as keyof typeof SUPPORTED_LANGUAGES 
                }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select interview language" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                AI will conduct the interview and provide feedback in your chosen language
              </p>
            </div>

            <div>
              <Label htmlFor="jobDescription" className="text-base font-medium">
                Job Description (Optional)
              </Label>
              <Textarea
                id="jobDescription"
                value={formData.jobDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                placeholder="Paste the job description here for more accurate interview simulation..."
                className="mt-2 min-h-[100px]"
              />
              <p className="text-sm text-gray-500 mt-1">
                Helps AI understand specific requirements and skills to focus on
              </p>
            </div>

            <div>
              <Label htmlFor="specificFocus" className="text-base font-medium">
                Specific Areas to Focus On (Optional)
              </Label>
              <Input
                id="specificFocus"
                value={formData.specificFocus}
                onChange={(e) => setFormData(prev => ({ ...prev, specificFocus: e.target.value }))}
                placeholder="e.g., behavioral questions, technical deep-dive, leadership scenarios"
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Tell the AI what aspects you want to practice most
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-semibold text-purple-900 mb-3">
                What to Expect in Your AI Interview:
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-800">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Dynamic questions tailored to your role and company</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Real-time AI coaching and feedback</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Comprehensive 10-feature performance evaluation</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Personalized improvement recommendations</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <Button 
                type="submit" 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8"
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  "Creating Interview Session..."
                ) : (
                  <>
                    Start AI Interview Simulation
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}