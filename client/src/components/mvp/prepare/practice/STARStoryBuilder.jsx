import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Plus, Save, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  "Teamwork & Collaboration",
  "Adaptability & Change",
  "Conflict & Feedback",
  "Communication",
  "Problem-Solving"
];

export default function STARStoryBuilder() {
  const [stories, setStories] = useState([]);
  const [currentStory, setCurrentStory] = useState({
    category: "",
    title: "",
    situation: "",
    task: "",
    actions: ["", "", ""],
    result: "",
    learned: ""
  });
  const [showForm, setShowForm] = useState(false);

  const addAction = () => {
    setCurrentStory({
      ...currentStory,
      actions: [...currentStory.actions, ""]
    });
  };

  const updateAction = (index, value) => {
    const newActions = [...currentStory.actions];
    newActions[index] = value;
    setCurrentStory({ ...currentStory, actions: newActions });
  };

  const removeAction = (index) => {
    const newActions = currentStory.actions.filter((_, i) => i !== index);
    setCurrentStory({ ...currentStory, actions: newActions });
  };

  const saveStory = () => {
    if (currentStory.category && currentStory.title && currentStory.situation) {
      setStories([...stories, { ...currentStory, id: Date.now() }]);
      setCurrentStory({
        category: "",
        title: "",
        situation: "",
        task: "",
        actions: ["", "", ""],
        result: "",
        learned: ""
      });
      setShowForm(false);
    }
  };

  const deleteStory = (id) => {
    setStories(stories.filter(s => s.id !== id));
  };

  const getStoriesByCategory = (category) => {
    return stories.filter(s => s.category === category);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your STAR Story Bank</span>
            <Badge variant="outline" className="text-lg">
              {stories.length} {stories.length === 1 ? 'Story' : 'Stories'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            Build a collection of STAR stories for different interview scenarios. Aim for 2-3 stories per category.
          </p>
          
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            {CATEGORIES.map((category) => {
              const count = getStoriesByCategory(category).length;
              return (
                <div key={category} className="p-3 bg-white rounded-lg border">
                  <p className="font-medium text-sm mb-1">{category}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i <= count ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">{count}/3</span>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'Add New Story'}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Build Your STAR Story</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <select
                    value={currentStory.category}
                    onChange={(e) => setCurrentStory({ ...currentStory, category: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select a category...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Story Title *</label>
                  <Input
                    placeholder="e.g., Resolving team conflict during product launch"
                    value={currentStory.title}
                    onChange={(e) => setCurrentStory({ ...currentStory, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Situation (Context) *</label>
                  <Textarea
                    placeholder="When & where, key players, context/stakes..."
                    value={currentStory.situation}
                    onChange={(e) => setCurrentStory({ ...currentStory, situation: e.target.value })}
                    className="min-h-20"
                  />
                  <p className="text-xs text-gray-500 mt-1">Keep it brief - 2-3 sentences</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Task (Your Responsibility)</label>
                  <Textarea
                    placeholder="Your specific responsibility, the challenge you faced..."
                    value={currentStory.task}
                    onChange={(e) => setCurrentStory({ ...currentStory, task: e.target.value })}
                    className="min-h-16"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Actions (What YOU Did)</label>
                  {currentStory.actions.map((action, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Textarea
                        placeholder={`Step ${index + 1}: Specific action you took...`}
                        value={action}
                        onChange={(e) => updateAction(index, e.target.value)}
                        className="min-h-16"
                      />
                      {currentStory.actions.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeAction(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAction}
                    className="w-full"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Another Action
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Result (Outcome)</label>
                  <Textarea
                    placeholder="What happened? Include metrics if possible..."
                    value={currentStory.result}
                    onChange={(e) => setCurrentStory({ ...currentStory, result: e.target.value })}
                    className="min-h-16"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">What You Learned</label>
                  <Textarea
                    placeholder="Key takeaways from this experience..."
                    value={currentStory.learned}
                    onChange={(e) => setCurrentStory({ ...currentStory, learned: e.target.value })}
                    className="min-h-16"
                  />
                </div>

                <Button
                  onClick={saveStory}
                  disabled={!currentStory.category || !currentStory.title || !currentStory.situation}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Story
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {stories.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Your Saved Stories</h3>
          {stories.map((story) => (
            <Card key={story.id} className="border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="mb-2">{story.category}</Badge>
                    <CardTitle className="text-base">{story.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteStory(story.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-purple-700">S:</span> {story.situation}
                </div>
                {story.task && (
                  <div>
                    <span className="font-semibold text-purple-700">T:</span> {story.task}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-purple-700">A:</span>
                  <ul className="list-disc ml-6 mt-1">
                    {story.actions.filter(a => a).map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>
                {story.result && (
                  <div>
                    <span className="font-semibold text-purple-700">R:</span> {story.result}
                  </div>
                )}
                {story.learned && (
                  <div className="pt-2 border-t">
                    <span className="font-semibold text-blue-700">Learned:</span> {story.learned}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}