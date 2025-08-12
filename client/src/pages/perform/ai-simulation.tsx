import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Bot, Sparkles, Target, Clock, Shuffle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SimulationQuestion {
  id: string;
  jobRole: string;
  companyName: string;
  questionType: string;
  question: string;
  context?: string;
  expectedOutcomes?: string[];
  difficultyLevel: number;
}

export default function AISimulation() {
  const queryClient = useQueryClient();
  const [simulationConfig, setSimulationConfig] = useState({
    jobRole: '',
    companyName: '',
    questionCount: 5,
    difficultyLevel: 3,
    questionTypes: ['behavioral', 'situational']
  });

  // Generate simulation questions mutation
  const generateQuestionsMutation = useMutation({
    mutationFn: async (config: typeof simulationConfig) => {
      return await apiRequest('/api/perform/simulation/generate', {
        method: 'POST',
        body: JSON.stringify(config)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/perform/simulation/questions'] });
    }
  });

  const handleGenerateQuestions = () => {
    if (simulationConfig.jobRole && simulationConfig.companyName) {
      generateQuestionsMutation.mutate(simulationConfig);
    }
  };

  const getDifficultyColor = (level: number) => {
    if (level >= 4) return 'text-red-600 bg-red-100';
    if (level >= 3) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getDifficultyLabel = (level: number) => {
    if (level >= 4) return 'Advanced';
    if (level >= 3) return 'Intermediate';
    return 'Beginner';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link href="/perform">
          <Button size="sm" className="mr-4 bg-blue-600 hover:bg-blue-700 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Simulation Generator</h1>
          <p className="text-gray-600">Advanced evaluation simulation - Generate executive-level questions based on your target role and company</p>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Questions</TabsTrigger>
          <TabsTrigger value="results">Generated Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="w-6 h-6 mr-2 text-purple-600" />
                AI Question Generation
              </CardTitle>
              <CardDescription>
                Enter your target job details to generate personalized interview simulation questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="jobRole">Job Role *</Label>
                  <Input
                    id="jobRole"
                    placeholder="e.g., Senior Software Engineer, Product Manager"
                    value={simulationConfig.jobRole}
                    onChange={(e) => setSimulationConfig(prev => ({
                      ...prev,
                      jobRole: e.target.value
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., Meta, Google, Startup X"
                    value={simulationConfig.companyName}
                    onChange={(e) => setSimulationConfig(prev => ({
                      ...prev,
                      companyName: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="questionCount">Number of Questions</Label>
                  <Select
                    value={simulationConfig.questionCount.toString()}
                    onValueChange={(value) => setSimulationConfig(prev => ({
                      ...prev,
                      questionCount: parseInt(value)
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="8">8 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={simulationConfig.difficultyLevel.toString()}
                    onValueChange={(value) => setSimulationConfig(prev => ({
                      ...prev,
                      difficultyLevel: parseInt(value)
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Beginner</SelectItem>
                      <SelectItem value="3">Intermediate</SelectItem>
                      <SelectItem value="4">Advanced</SelectItem>
                      <SelectItem value="5">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Question Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {['behavioral', 'situational', 'technical'].map((type) => (
                      <Badge
                        key={type}
                        variant={simulationConfig.questionTypes.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSimulationConfig(prev => ({
                            ...prev,
                            questionTypes: prev.questionTypes.includes(type)
                              ? prev.questionTypes.filter(t => t !== type)
                              : [...prev.questionTypes, type]
                          }));
                        }}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  AI will generate contextual questions tailored to your specific role and company
                </div>
                <Button
                  onClick={handleGenerateQuestions}
                  disabled={!simulationConfig.jobRole || !simulationConfig.companyName || generateQuestionsMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {generateQuestionsMutation.isPending ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {generateQuestionsMutation.data ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Generated Questions</h3>
                <Button
                  onClick={handleGenerateQuestions}
                  variant="outline"
                  size="sm"
                  disabled={generateQuestionsMutation.isPending}
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>

              <div className="space-y-4">
                {generateQuestionsMutation.data.map((question: SimulationQuestion, index: number) => (
                  <Card key={question.id || index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {question.questionType}
                            </Badge>
                            <Badge className={getDifficultyColor(question.difficultyLevel)}>
                              {getDifficultyLabel(question.difficultyLevel)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-900 leading-relaxed">
                            {question.question}
                          </p>
                        </div>

                        {question.context && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-1">Context</h4>
                            <p className="text-blue-800 text-sm">{question.context}</p>
                          </div>
                        )}

                        {question.expectedOutcomes && question.expectedOutcomes.length > 0 && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-2">Key Elements to Address</h4>
                            <ul className="text-green-800 text-sm space-y-1">
                              {question.expectedOutcomes.map((outcome, i) => (
                                <li key={i} className="flex items-start">
                                  <Target className="w-3 h-3 mt-1 mr-2 flex-shrink-0" />
                                  {outcome}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center pt-6">
                <Link href="/practice">
                  <Button size="lg">
                    Start Practice Session
                    <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Generated Yet</h3>
                <p className="text-gray-600 mb-6">
                  Generate personalized interview questions using the form in the previous tab.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}