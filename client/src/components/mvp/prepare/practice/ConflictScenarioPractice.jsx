
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge"; // This import is no longer used, but keeping it as it was in original file and not explicitly asked to remove.
import { CheckCircle2, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react"; // These imports are mostly no longer used, but keeping them as they were in original file. Lightbulb and RefreshCw are not used in the new UI.
import { motion, AnimatePresence } from "framer-motion";

const SCENARIOS = [
  {
    id: 1,
    title: "The Missed Deadline",
    badFrame: "My teammate always misses deadlines, which holds us back and makes me look bad. I had to pick up their slack again.",
    goodFrame: "There was an instance where a team member was struggling to meet deadlines on a critical project. I noticed this pattern was impacting our overall progress.",
    explanation: "This reframes the issue from blame to observation. It focuses on the impact on the project, not the individual's perceived failings, setting a more constructive tone."
  },
  {
    id: 2,
    title: "The Technical Disagreement",
    badFrame: "I had a huge argument with a senior developer who wanted to use an overly complex solution. They just wouldn't listen to reason.",
    goodFrame: "I once had a professional disagreement with a senior developer regarding the technical approach for a new feature. While they proposed a more elaborate solution, I believed a simpler, more efficient method would achieve the same results with less risk.",
    explanation: "This acknowledges the disagreement professionally, focuses on the technical merits (complex vs. simple, efficient), and avoids characterising the senior developer negatively. It highlights your own belief without being confrontational."
  },
  {
    id: 3,
    title: "The Harsh Feedback",
    badFrame: "My manager told me my communication was too blunt, but honestly, I was just being direct. They're too sensitive.",
    goodFrame: "I received feedback from my manager that my communication style was perceived as too direct, which was inadvertently affecting team morale. Initially, I found this feedback challenging to process.",
    explanation: "This accepts the feedback without defensiveness, states the impact (affecting team morale), and acknowledges personal reaction, showing self-awareness and willingness to address it."
  },
  {
    id: 4,
    title: "The Team Conflict",
    badFrame: "Two of my colleagues were constantly bickering, and it made the whole atmosphere toxic. I just tried to stay out of their drama.",
    goodFrame: "There was a period where two team members had an ongoing conflict, which was noticeably impacting our team's productivity and collaborative environment. I felt it was important to help facilitate a more harmonious working relationship.",
    explanation: "This describes the situation objectively, highlights the business impact (productivity, collaboration), and states a proactive intent to resolve, rather than avoidance or victimisation."
  }
];

export default function ConflictScenarioPractice() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [userResponse, setUserResponse] = useState("");
  const [showGoodFrame, setShowGoodFrame] = useState(false);

  // The previous functions (getTips, resetScenario, selectNewScenario) are no longer relevant
  // to the new UI/logic and have been removed.

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardHeader>
          <CardTitle>Reframing Conflict Stories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            Practise reframing conflict situations in a constructive way. Choose a scenario and write how you'd frame it positively.
          </p>
          
          <div className="grid gap-3 mb-4">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  setSelectedScenario(scenario);
                  setUserResponse(""); // Reset user's response when a new scenario is selected
                  setShowGoodFrame(false); // Hide the example when a new scenario is selected
                }}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedScenario?.id === scenario.id
                    ? 'border-orange-500 bg-white shadow-md'
                    : 'border-orange-200 hover:border-orange-300 bg-white/50'
                }`}
              >
                <p className="font-medium text-sm mb-1">{scenario.title}</p>
                <p className="text-xs text-gray-600">{scenario.badFrame}</p>
              </button>
            ))}
          </div>

          {selectedScenario && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-red-900 mb-1">❌ Poor Framing:</p>
                <p className="text-sm text-red-800">{selectedScenario.badFrame}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Your Reframed Response:</label>
                <Textarea
                  placeholder="How would you frame this constructively?"
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  className="min-h-32"
                />
              </div>

              <Button
                onClick={() => setShowGoodFrame(!showGoodFrame)}
                variant="outline"
                className="w-full"
              >
                {showGoodFrame ? 'Hide Example' : 'Give this a go'}
              </Button>

              <AnimatePresence>
                {showGoodFrame && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }} // Added exit animation for smoother hide
                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                  >
                    <p className="text-xs font-semibold text-green-900 mb-1">✅ Better Framing:</p>
                    <p className="text-sm text-green-800 mb-3">{selectedScenario.goodFrame}</p>
                    <p className="text-xs font-semibold text-green-900 mb-1">Why this works:</p>
                    <p className="text-xs text-green-700">{selectedScenario.explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
