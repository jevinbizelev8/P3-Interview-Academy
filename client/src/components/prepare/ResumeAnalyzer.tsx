import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Loader2, TrendingUp, AlertCircle, CheckCircle2, Sparkles, Download, Copy, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import CreditCostBadge from "../shared/CreditCostBadge";

const RESUME_ANALYSIS_COST = 10;
const RESUME_GENERATION_COST = 10;

interface ResumeAnalysis {
  ats_score: number;
  jd_match_percentage: number | null;
  missing_keywords: string[];
  strengths: string[];
  gaps: string[];
  suggestions: {
    section: string;
    original: string;
    suggested: string;
    reason: string;
  }[];
  ai_feedback: string;
}

interface GeneratedResume {
  improved_resume: string;
  key_improvements: string[];
  ats_optimization_score: number;
}

export default function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type.includes('document'))) {
      setFile(selectedFile);
      toast({
        title: "File Selected",
        description: selectedFile.name,
      });
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF or DOC/DOCX file",
        variant: "destructive",
      });
    }
  };

  const analyzeResume = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    try {
      // Upload the resume file
      const formData = new FormData();
      formData.append('resume', file);
      if (jobDescription) {
        formData.append('jobDescription', jobDescription);
      }

      const response = await fetch('/api/prepare/resume/analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze resume');
      }

      const data = await response.json();
      setAnalysis(data.data.analysis);
      setResumeText(data.data.extracted_text || '');

      toast({
        title: "Analysis Complete",
        description: `ATS Score: ${Math.round(data.data.analysis.ats_score)}/100`,
      });
    } catch (error) {
      console.error("Error analyzing resume:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateRecommendedResume = async () => {
    if (!analysis || !resumeText) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/prepare/resume/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          analysis,
          jobDescription
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate resume');
      }

      const data = await response.json();
      setGeneratedResume(data.data);

      toast({
        title: "Resume Generated",
        description: `Estimated ATS Score: ${data.data.ats_optimization_score}/100`,
      });
    } catch (error) {
      console.error("Error generating resume:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred during generation",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedResume) return;

    try {
      await navigator.clipboard.writeText(generatedResume.improved_resume);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Resume copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy Failed",
        description: "Could not copy resume to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadResume = () => {
    if (!generatedResume) return;

    const element = document.createElement("a");
    const file = new Blob([generatedResume.improved_resume], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "improved_resume.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Downloaded",
      description: "Resume downloaded as improved_resume.txt",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                Upload Your Resume
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Get AI-powered insights and optimization suggestions for your resume
              </p>
            </div>
            <CreditCostBadge credits={RESUME_ANALYSIS_COST} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Resume File (PDF or DOC)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {file ? file.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, or DOCX</p>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Job Description (Optional)</label>
            <Textarea
              placeholder="Paste the job description here for tailored analysis..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-32"
            />
            <p className="text-xs text-gray-500 mt-1">
              Adding a job description helps us provide more targeted recommendations
            </p>
          </div>

          <Button
            onClick={analyzeResume}
            disabled={!file || isAnalyzing}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Resume...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Analyze Resume ({RESUME_ANALYSIS_COST} credits)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Resume Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">ATS Score</span>
                    <span className="text-2xl font-bold text-purple-600">{Math.round(analysis.ats_score)}/100</span>
                  </div>
                  <Progress value={analysis.ats_score} className="h-3 mb-2" />
                  <p className="text-xs text-gray-600">How well your resume passes automated screening</p>
                </div>
                {analysis.jd_match_percentage !== null && analysis.jd_match_percentage > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">JD Match</span>
                      <span className="text-2xl font-bold text-blue-600">{Math.round(analysis.jd_match_percentage)}%</span>
                    </div>
                    <Progress value={analysis.jd_match_percentage} className="h-3 mb-2" />
                    <p className="text-xs text-gray-600">Alignment with job requirements</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.missing_keywords?.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Missing Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missing_keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="bg-white">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Strengths
                </h3>
                <ul className="space-y-1">
                  {analysis.strengths?.map((strength, index) => (
                    <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Gaps to Address
                </h3>
                <ul className="space-y-1">
                  {analysis.gaps?.map((gap, index) => (
                    <li key={index} className="text-sm text-orange-800 flex items-start gap-2">
                      <span className="text-orange-600 mt-1">•</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3">Improvement Suggestions</h3>
                <div className="space-y-3">
                  {analysis.suggestions?.map((suggestion, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-purple-200">
                      <p className="text-xs font-semibold text-purple-600 mb-1">{suggestion.section}</p>
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="font-medium text-gray-700">Current:</span>
                          <p className="text-gray-600 italic">{suggestion.original}</p>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Suggested:</span>
                          <p className="text-green-600">{suggestion.suggested}</p>
                        </div>
                        <p className="text-xs text-gray-500">{suggestion.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Overall Feedback</h3>
                <p className="text-sm text-blue-800 leading-relaxed">{analysis.ai_feedback}</p>
              </div>
            </CardContent>
          </Card>

          {!generatedResume && (
            <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                      Generate Improved Resume
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Let AI create an optimized version incorporating all suggestions
                    </p>
                  </div>
                  <CreditCostBadge credits={RESUME_GENERATION_COST} />
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={generateRecommendedResume}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Your Improved Resume...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Improved Resume ({RESUME_GENERATION_COST} credits)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {generatedResume && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-none shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-green-900">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        Your Improved Resume
                      </CardTitle>
                      <p className="text-sm text-green-700 mt-1">
                        Estimated ATS Score: <span className="font-bold">{generatedResume.ats_optimization_score}/100</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        size="sm"
                        className="border-green-300 hover:bg-green-100"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={downloadResume}
                        variant="outline"
                        size="sm"
                        className="border-green-300 hover:bg-green-100"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download as TXT
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-100 rounded-lg border border-green-300">
                    <h3 className="font-semibold text-green-900 mb-2">Key Improvements Made:</h3>
                    <ul className="space-y-1">
                      {generatedResume.key_improvements?.map((improvement, index) => (
                        <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-6 border-2 border-green-300 shadow-sm max-h-[600px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                      {generatedResume.improved_resume}
                    </pre>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800">
                      <strong>💡 Pro Tip:</strong> Copy this content and paste it into Microsoft Word or Google Docs. You can then apply your preferred formatting, adjust fonts, and save as a .docx file for applications.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
