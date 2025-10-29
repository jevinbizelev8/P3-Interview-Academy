import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Video, FileText } from "lucide-react";
import { motion } from "framer-motion";

import LearningHub from "../components/prepare/LearningHub";
import SelfIntroScriptingWizard from "../components/prepare/SelfIntroScriptingWizard";
import ResumeAnalyzer from "../components/prepare/ResumeAnalyzer";

export default function Prepare() {
  const [activeTab, setActiveTab] = useState("learning");

  useEffect(() => {
    // Listen for custom event from ElevatorPitchBuilder
    const handleSwitchTab = (event) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('switchToTab', handleSwitchTab);
    
    return () => {
      window.removeEventListener('switchToTab', handleSwitchTab);
    };
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Prepare Stage
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Build your foundation with comprehensive learning, script development, and resume optimization
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white shadow-lg p-1 rounded-xl">
            <TabsTrigger
              value="learning"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Learning Hub
            </TabsTrigger>
            <TabsTrigger
              value="intro"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg"
            >
              <Video className="w-4 h-4 mr-2" />
              Self-Introduction
            </TabsTrigger>
            <TabsTrigger
              value="resume"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg"
            >
              <FileText className="w-4 h-4 mr-2" />
              Resume Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learning">
            <LearningHub />
          </TabsContent>

          <TabsContent value="intro">
            <SelfIntroScriptingWizard />
          </TabsContent>

          <TabsContent value="resume">
            <ResumeAnalyzer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}