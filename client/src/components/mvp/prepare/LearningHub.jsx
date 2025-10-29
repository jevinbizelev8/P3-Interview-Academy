
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2, ArrowRight, Target, Users, Briefcase, Code, Award as AwardIcon, X, ArrowLeft, Rocket, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPageUrl } from "@/utils";

import STARStoryBuilder from "./practice/STARStoryBuilder";
import ConflictScenarioPractice from "./practice/ConflictScenarioPractice";
import CommunicationExercises from "./practice/CommunicationExercises";
import ScreeningInterviewGame from "./interactive/ScreeningInterviewGame";
import ElevatorPitchBuilder from "./interactive/ElevatorPitchBuilder";
import HRQuestionsGame from "./interactive/HRQuestionsGame";
import BrandingWorkshop from "./interactive/BrandingWorkshop";
import TeamDynamicsGame from "./interactive/TeamDynamicsGame";
import ManagerPerspectiveGame from "./interactive/ManagerPerspectiveGame";
import TechnicalFrameworkGame from "./interactive/TechnicalFrameworkGame";
import ExecutivePresenceBuilder from "./interactive/ExecutivePresenceBuilder";

import { awardRewardsPoints, calculateReadinessScore, updateStreak, REWARDS_POINTS_VALUES } from "../utils/scoring";

const STAGES = [
  {
    stage: "hr_screening",
    number: 1,
    title: "HR/Recruiter Screening",
    subtitle: "First Impression Mastery",
    description: "Background verification, qualification check, and cultural fit assessment",
    color: "from-blue-500 to-blue-600",
    icon: Target,
    learningGoals: [
      "Understand recruiter mindset and basic screening criteria",
      "Craft and deliver strong self-introduction",
      "Communicate cultural fit authentically",
      "Avoid common screening pitfalls"
    ],
    modules: [
      {
        name: "Understanding Screening Interviews",
        description: "Why HR asks what they ask, what they're looking for",
        isInteractive: true,
        interactiveComponent: "ScreeningInterviewGame"
      },
      {
        name: "Perfect Your Elevator Pitch",
        description: "Craft and record your 60-sec intro video",
        isInteractive: true,
        interactiveComponent: "ElevatorPitchBuilder"
      },
      {
        name: "Common HR Questions",
        description: "Walkthrough of 'Tell me about yourself,' 'Why this role?'",
        isInteractive: true,
        interactiveComponent: "HRQuestionsGame"
      },
      {
        name: "Self-Branding Basics",
        description: "Building your personal brand story",
        isInteractive: true,
        interactiveComponent: "BrandingWorkshop"
      }
    ]
  },
  {
    stage: "functional_team",
    number: 2,
    title: "Functional/Team Round",
    subtitle: "Collaboration & Fit",
    description: "Teamwork, adaptability, and interpersonal awareness",
    color: "from-purple-500 to-purple-600",
    icon: Users,
    learningGoals: [
      "Demonstrate teamwork, adaptability, and interpersonal awareness",
      "Communicate past collaborative experiences using STAR framework",
      "Build rapport with future peers",
      "Handle conflict and feedback constructively"
    ],
    modules: [
      {
        name: "Behavioural Interviewing - STAR Method",
        description: "Master the STAR framework for compelling behavioural answers",
        isInteractive: true,
        practiceComponent: "STARStoryBuilder"
      },
      {
        name: "Team Dynamics 101",
        description: "How teams assess fit and chemistry",
        isInteractive: true,
        interactiveComponent: "TeamDynamicsGame"
      },
      {
        name: "Handling Conflict & Feedback",
        description: "How to frame constructive conflict responses",
        isInteractive: true,
        practiceComponent: "ConflictScenarioPractice"
      },
      {
        name: "Communication Exercises",
        description: "Practise tone, clarity, empathy",
        isInteractive: true,
        practiceComponent: "CommunicationExercises"
      }
    ]
  },
  {
    stage: "hiring_manager",
    number: 3,
    title: "Hiring Manager Round",
    subtitle: "Competence & Alignment",
    description: "Role-specific competencies, expectations, and performance goals",
    color: "from-pink-500 to-pink-600",
    icon: Briefcase,
    learningGoals: [
      "Understand what hiring managers assess (competence, ownership, alignment)",
      "Learn to link personal achievements with business outcomes",
      "Showcase initiative, accountability, and measurable impact"
    ],
    modules: [
      {
        name: "Manager's Perspective",
        description: "Decoding hiring manager expectations",
        isInteractive: true,
        interactiveComponent: "ManagerPerspectiveGame"
      },
      {
        name: "Framing Impact Stories",
        description: "Turn metrics into storytelling",
        isInteractive: true,
        interactiveComponent: "ManagerPerspectiveGame"
      },
      {
        name: "Handling Performance Questions",
        description: "How to respond to metrics and KPI-related prompts",
        isInteractive: true,
        interactiveComponent: "ManagerPerspectiveGame"
      },
      {
        name: "Leadership Fit",
        description: "Reflect on your preferred management style",
        isInteractive: true,
        interactiveComponent: "ManagerPerspectiveGame"
      }
    ]
  },
  {
    stage: "sme_technical",
    number: 4,
    title: "SME/Technical Round",
    subtitle: "Technical Depth",
    description: "Domain expertise, structured problem-solving, and technical communication",
    color: "from-orange-500 to-orange-600",
    icon: Code,
    learningGoals: [
      "Display domain expertise confidently and clearly",
      "Practice structured problem-solving",
      "Communicating technical reasoning effectively"
    ],
    modules: [
      {
        name: "Technical Questioning Framework",
        description: "Understand logic-based questioning",
        isInteractive: true,
        interactiveComponent: "TechnicalFrameworkGame"
      },
      {
        name: "Mock Technical Challenge",
        description: "Role-play coding or case-based simulation",
        isInteractive: true,
        interactiveComponent: "TechnicalFrameworkGame"
      },
      {
        name: "Communicating Technical Thought Process",
        description: "Explain solutions clearly",
        isInteractive: true,
        interactiveComponent: "TechnicalFrameworkGame"
      },
      {
        name: "Deep Dive Exercise",
        description: "Domain-specific case study practice",
        isInteractive: true,
        interactiveComponent: "TechnicalFrameworkGame"
      }
    ]
  },
  {
    stage: "executive_final",
    number: 5,
    title: "Executive/Final Round",
    subtitle: "Leadership & Vision",
    description: "Strategic thinking, executive presence, and cultural alignment",
    color: "from-green-500 to-emerald-600",
    icon: AwardIcon,
    learningGoals: [
      "Exhibit strategic thinking and cultural alignment",
      "Develop executive presence and gravitas",
      "Master storytelling for vision and leadership"
    ],
    modules: [
      {
        name: "Strategic Thinking Frameworks",
        description: "SWOT, OKR, systems thinking",
        isInteractive: true,
        interactiveComponent: "ExecutivePresenceBuilder"
      },
      {
        name: "Building Executive Presence",
        description: "Posture, tone, storytelling",
        isInteractive: true,
        interactiveComponent: "ExecutivePresenceBuilder"
      },
      {
        name: "Leadership Style Discovery",
        description: "Identify and express your authentic leadership type",
        isInteractive: true,
        interactiveComponent: "ExecutivePresenceBuilder"
      },
      {
        name: "Case Simulation: Boardroom Q&A",
        description: "Executive role-play interview",
        isInteractive: true,
        interactiveComponent: "ExecutivePresenceBuilder"
      }
    ]
  }
];

export default function LearningHub() {
  const [selectedModule, setSelectedModule] = useState(null);
  const [showStageCompletion, setShowStageCompletion] = useState(null);
  const queryClient = useQueryClient();

  const { data: completedModules = [] } = useQuery({
    queryKey: ['completedModules'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.UserModuleProgress.filter({
        created_by: user.email,
        completed: true
      });
    }
  });

  const completeModuleMutation = useMutation({
    mutationFn: async (moduleName) => {
      const user = await base44.auth.me();

      const existing = await base44.entities.UserModuleProgress.filter({
        created_by: user.email,
        module_name: moduleName
      });

      if (existing.length > 0 && existing[0].completed) {
        return existing[0];
      }

      let moduleProgress;
      if (existing.length > 0) {
        moduleProgress = await base44.entities.UserModuleProgress.update(existing[0].id, {
          completed: true,
          completion_date: new Date().toISOString(),
          time_spent_minutes: 15
        });
      } else {
        moduleProgress = await base44.entities.UserModuleProgress.create({
          module_name: moduleName,
          stage: selectedModule.parentStage,
          completed: true,
          completion_date: new Date().toISOString(),
          time_spent_minutes: 15
        });
      }

      const isAdvancedModule = moduleName.includes('STAR') || moduleName.includes('Technical') || moduleName.includes('Strategic') || moduleName.includes('Elevator Pitch') || moduleName.includes('Branding') || moduleName.includes('HR Questions') || moduleName.includes('Executive');
      const rewardsPointsAmount = isAdvancedModule ? REWARDS_POINTS_VALUES.LEARNING_MODULE_ADVANCED : REWARDS_POINTS_VALUES.LEARNING_MODULE_BASIC;
      await awardRewardsPoints(user.id, rewardsPointsAmount, `Completed module: ${moduleName}`, moduleProgress.id);

      await updateStreak(user.id);
      await calculateReadinessScore(user.id);

      return moduleProgress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completedModules'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
  });

  const handleModuleClick = (module, parentStage, moduleIndex, stageIndex) => {
    setSelectedModule({ ...module, parentStage, moduleIndex, stageIndex });
  };

  const handleCompleteModule = async () => {
    await completeModuleMutation.mutateAsync(selectedModule.name);
    
    // Check if all modules in this stage are completed
    const currentStage = STAGES[selectedModule.stageIndex];
    const stageModules = currentStage.modules;
    const completedInStage = completedModules.filter(m => m.stage === currentStage.stage);
    
    if (completedInStage.length + 1 >= stageModules.length) {
      // All modules completed, show stage completion
      setShowStageCompletion(currentStage);
      setSelectedModule(null);
    } else {
      // Move to next module
      const nextModuleIndex = selectedModule.moduleIndex + 1;
      if (nextModuleIndex < stageModules.length) {
        const nextModule = stageModules[nextModuleIndex];
        setSelectedModule({ 
          ...nextModule, 
          parentStage: currentStage.stage, 
          moduleIndex: nextModuleIndex,
          stageIndex: selectedModule.stageIndex
        });
      } else {
        setSelectedModule(null);
      }
    }
  };

  const handleNextModule = () => {
    const currentStage = STAGES[selectedModule.stageIndex];
    const nextModuleIndex = selectedModule.moduleIndex + 1;
    
    if (nextModuleIndex < currentStage.modules.length) {
      const nextModule = currentStage.modules[nextModuleIndex];
      setSelectedModule({ 
        ...nextModule, 
        parentStage: currentStage.stage, 
        moduleIndex: nextModuleIndex,
        stageIndex: selectedModule.stageIndex
      });
    }
  };

  const isModuleCompleted = (moduleName) => {
    return completedModules.some(m => m.module_name === moduleName);
  };

  const getStageProgress = (stage) => {
    const totalModules = stage.modules.length;
    const completed = stage.modules.filter(m => isModuleCompleted(m.name)).length;
    return { completed, total: totalModules, percentage: (completed / totalModules) * 100 };
  };

  if (showStageCompletion) {
    const currentStageIndex = STAGES.findIndex(s => s.stage === showStageCompletion.stage);
    const hasNextStage = currentStageIndex < STAGES.length - 1;
    const nextStage = hasNextStage ? STAGES[currentStageIndex + 1] : null;
    const StageIcon = showStageCompletion.icon;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <Card className="border-none shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="text-center pb-4">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${showStageCompletion.color} flex items-center justify-center mx-auto mb-4 shadow-xl`}>
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl mb-2">🎉 Stage Complete!</CardTitle>
            <p className="text-xl font-semibold text-purple-600">{showStageCompletion.title}</p>
            <p className="text-gray-600 mt-2">You've mastered all modules in this stage!</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-purple-50 border-purple-200">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              <AlertDescription>
                <p className="font-semibold text-purple-900 mb-2">Congratulations! You've completed:</p>
                <ul className="text-sm text-purple-800 space-y-1">
                  {showStageCompletion.modules.map((module, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      {module.name}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={() => window.location.href = createPageUrl("Practice")}
                className="h-auto py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <div className="flex flex-col items-center gap-2">
                  <Rocket className="w-8 h-8" />
                  <div>
                    <p className="font-bold">Practice Simulation</p>
                    <p className="text-xs opacity-90">Test your skills with AI</p>
                  </div>
                </div>
              </Button>

              {hasNextStage && (
                <Button
                  onClick={() => {
                    setShowStageCompletion(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  variant="outline"
                  className="h-auto py-6 border-2 border-purple-300 hover:bg-purple-50"
                >
                  <div className="flex flex-col items-center gap-2">
                    <ArrowRight className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="font-bold text-purple-900">Next Stage</p>
                      <p className="text-xs text-purple-700">{nextStage.title}</p>
                    </div>
                  </div>
                </Button>
              )}

              {!hasNextStage && (
                <Button
                  onClick={() => setShowStageCompletion(null)}
                  variant="outline"
                  className="h-auto py-6 border-2 border-green-300 hover:bg-green-50"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Trophy className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-bold text-green-900">All Stages Complete!</p>
                      <p className="text-xs text-green-700">Review or practice</p>
                    </div>
                  </div>
                </Button>
              )}
            </div>

            <Button
              onClick={() => setShowStageCompletion(null)}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Learning Hub
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (selectedModule) {
    // Interactive module rendering
    if (selectedModule.isInteractive) {
      let InteractiveComponent;
      
      // Try interactive component first
      if (selectedModule.interactiveComponent) {
        switch(selectedModule.interactiveComponent) {
          case "ScreeningInterviewGame":
            InteractiveComponent = ScreeningInterviewGame;
            break;
          case "ElevatorPitchBuilder":
            InteractiveComponent = ElevatorPitchBuilder;
            break;
          case "HRQuestionsGame":
            InteractiveComponent = HRQuestionsGame;
            break;
          case "BrandingWorkshop":
            InteractiveComponent = BrandingWorkshop;
            break;
          case "TeamDynamicsGame":
            InteractiveComponent = TeamDynamicsGame;
            break;
          case "ManagerPerspectiveGame":
            InteractiveComponent = ManagerPerspectiveGame;
            break;
          case "TechnicalFrameworkGame":
            InteractiveComponent = TechnicalFrameworkGame;
            break;
          case "ExecutivePresenceBuilder":
            InteractiveComponent = ExecutivePresenceBuilder;
            break;
          default:
            InteractiveComponent = null;
        }
      }
      
      // Fall back to practice component if no interactive component
      if (!InteractiveComponent && selectedModule.practiceComponent) {
        switch(selectedModule.practiceComponent) {
          case "STARStoryBuilder":
            InteractiveComponent = STARStoryBuilder;
            break;
          case "ConflictScenarioPractice":
            InteractiveComponent = ConflictScenarioPractice;
            break;
          case "CommunicationExercises":
            InteractiveComponent = CommunicationExercises;
            break;
          default:
            InteractiveComponent = null;
        }
      }

      const currentStage = STAGES[selectedModule.stageIndex];
      const isLastModule = selectedModule.moduleIndex === currentStage.modules.length - 1;
      const isAlreadyCompleted = isModuleCompleted(selectedModule.name);

      return (
        <div className="space-y-6">
          <Card className="border-none shadow-xl">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-purple-600">
                      Module {selectedModule.moduleIndex + 1} of {currentStage.modules.length}
                    </Badge>
                    {isAlreadyCompleted && (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl mb-2">{selectedModule.name}</CardTitle>
                  <p className="text-gray-600">{selectedModule.description}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedModule(null)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardHeader>
          </Card>

          {InteractiveComponent && <InteractiveComponent />}

          <Card className="border-none shadow-xl">
            <CardContent className="p-6">
              <div className="flex gap-3">
                {!isAlreadyCompleted && (
                  <Button
                    onClick={handleCompleteModule}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    disabled={completeModuleMutation.isLoading}
                  >
                    {completeModuleMutation.isLoading ? "Completing..." : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {isLastModule ? "Complete Stage!" : "Complete & Continue"}
                      </>
                    )}
                  </Button>
                )}

                {isAlreadyCompleted && !isLastModule && (
                  <Button
                    onClick={handleNextModule}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Next Module <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {isAlreadyCompleted && isLastModule && (
                  <Button
                    onClick={() => {
                      setShowStageCompletion(currentStage);
                      setSelectedModule(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    View Stage Summary <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            Master All 5 Interview Stages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            All stages are unlocked! Click on any module below to start learning.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {STAGES.map((stage, stageIndex) => {
          const StageIcon = stage.icon;
          const progress = getStageProgress(stage);
          const isStageComplete = progress.completed === progress.total;

          return (
            <motion.div
              key={stage.stage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: stageIndex * 0.1 }}
            >
              <Card className="border-none shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${stage.color} flex items-center justify-center shadow-lg relative`}>
                      <StageIcon className="w-8 h-8 text-white" />
                      {isStageComplete && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold">{stage.title}</h3>
                        {isStageComplete && (
                          <Badge className="bg-green-600">
                            <Trophy className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg font-semibold text-purple-600 mb-2">{stage.subtitle}</p>
                      <p className="text-gray-600 mb-4">{stage.description}</p>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium text-gray-700">Progress</span>
                          <span className="text-purple-600 font-bold">{progress.completed}/{progress.total} modules</span>
                        </div>
                        <Progress value={progress.percentage} className="h-2" />
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Learning Goals</h4>
                        <ul className="space-y-1">
                          {stage.learningGoals.map((goal, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                              {goal}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 mb-3">Learning Modules</h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          {stage.modules.map((module, moduleIndex) => {
                            const completed = isModuleCompleted(module.name);
                            return (
                              <button
                                key={moduleIndex}
                                onClick={() => handleModuleClick(module, stage.stage, moduleIndex, stageIndex)}
                                className={`bg-white p-3 rounded-lg border transition-all text-left relative ${
                                  completed 
                                    ? 'border-green-300 hover:border-green-400' 
                                    : 'border-purple-200 hover:border-purple-400'
                                } hover:shadow-md`}
                              >
                                {completed && (
                                  <div className="absolute top-2 right-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  </div>
                                )}
                                <p className="font-medium text-sm text-gray-900 mb-1 pr-6">{module.name}</p>
                                <p className="text-xs text-gray-600 mb-2">{module.description}</p>
                                <div className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3 text-purple-600" />
                                  <span className="text-xs text-purple-600">
                                    {completed ? 'Review' : 'Start learning'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {isStageComplete && (
                        <div className="mt-4">
                          <Button
                            onClick={() => setShowStageCompletion(stage)}
                            variant="outline"
                            className="w-full border-2 border-green-300 hover:bg-green-50"
                          >
                            <Trophy className="w-4 h-4 mr-2 text-green-600" />
                            View Stage Summary
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
