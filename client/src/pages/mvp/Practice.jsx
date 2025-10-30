import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Play, Award, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useSimulationHistory } from "@/hooks/useApi";

import SimulationSetup from "../components/practice/SimulationSetup";
import SimulationInterface from "../components/practice/SimulationInterface";
import SimulationHistory from "../components/practice/SimulationHistory";
import ReflectionJournal from "../components/practice/ReflectionJournal";
import AssessmentViewer from "../components/practice/AssessmentViewer";

export default function Practice() {
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [selectedSimId, setSelectedSimId] = useState(null);
  const [viewingSimulation, setViewingSimulation] = useState(null);

  const { data: simulationData } = useSimulationHistory();
  const simulations = simulationData?.sessions || [];

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openReflection') === 'true') {
      setShowReflection(true);
      setSelectedSimId(urlParams.get('simId'));
    } else if (urlParams.get('viewSimulation')) {
      const simId = urlParams.get('viewSimulation');
      const simulation = simulations.find(s => s.id === simId);
      if (simulation) {
        setViewingSimulation(simulation);
      }
    }
  }, [simulations]);

  const startNewSimulation = () => {
    setShowSetup(true);
  };

  const handleSimulationStart = (config) => {
    setActiveSimulation(config);
    setShowSetup(false);
  };

  const handleSimulationComplete = () => {
    setActiveSimulation(null);
    // Clear URL params
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleBackFromAssessment = () => {
    setViewingSimulation(null);
    // Clear URL params
    window.history.pushState({}, '', window.location.pathname);
  };

  if (activeSimulation) {
    return (
      <SimulationInterface
        config={activeSimulation}
        onComplete={handleSimulationComplete}
      />
    );
  }

  if (showSetup) {
    return (
      <SimulationSetup
        onStart={handleSimulationStart}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  if (showReflection) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => {
              setShowReflection(false);
              window.history.pushState({}, '', window.location.pathname);
            }}
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Practice
          </Button>
          <ReflectionJournal simulationId={selectedSimId} />
        </div>
      </div>
    );
  }

  if (viewingSimulation) {
    return (
      <AssessmentViewer 
        simulation={viewingSimulation} 
        onBack={handleBackFromAssessment}
      />
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Practice Stage
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Experience realistic AI-powered interview simulations for each stage
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{simulations.length}</h3>
              <p className="text-gray-600">Total Simulations</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {Math.round(simulations.reduce((sum, s) => sum + (s.overall_score || 0), 0) / (simulations.length || 1))}%
              </h3>
              <p className="text-gray-600">Average Score</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl">
            <CardContent className="p-6 flex items-center justify-center">
              <Button
                onClick={startNewSimulation}
                className="w-full h-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-8"
                size="lg"
              >
                <Play className="w-6 h-6 mr-2" />
                Start New Simulation
              </Button>
            </CardContent>
          </Card>
        </div>

        <SimulationHistory simulations={simulations} />
      </div>
    </div>
  );
}