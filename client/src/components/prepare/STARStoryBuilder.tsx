import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Plus, Save, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface StarStory {
  id?: string;
  category: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags?: string[];
}

const CATEGORIES = [
  "Teamwork & Collaboration",
  "Adaptability & Change",
  "Conflict & Feedback",
  "Communication",
  "Problem-Solving"
];

export default function STARStoryBuilder() {
  const [stories, setStories] = useState<StarStory[]>([]);
  const [currentStory, setCurrentStory] = useState<StarStory>({
    category: "",
    title: "",
    situation: "",
    task: "",
    action: "",
    result: "",
    tags: []
  });
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load existing stories on mount
  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/prepare/star-stories', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load stories');
      }

      const data = await response.json();
      setStories(data.data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
      toast({
        title: "Error",
        description: "Failed to load your STAR stories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveStory = async () => {
    if (!currentStory.category || !currentStory.title || !currentStory.situation) {
      toast({
        title: "Validation Error",
        description: "Please fill in at least category, title, and situation",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/prepare/star-stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentStory),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to save story');
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: "STAR story saved successfully",
      });

      // Reload stories and reset form
      await loadStories();
      setCurrentStory({
        category: "",
        title: "",
        situation: "",
        task: "",
        action: "",
        result: "",
        tags: []
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving story:', error);
      toast({
        title: "Error",
        description: "Failed to save story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteStory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      const response = await fetch(`/api/prepare/star-stories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete story');
      }

      toast({
        title: "Success",
        description: "Story deleted successfully",
      });

      await loadStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Error",
        description: "Failed to delete story",
        variant: "destructive",
      });
    }
  };

  const getStoriesByCategory = (category: string) => {
    return stories.filter(s => s.category === category);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

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
                  <Textarea
                    placeholder="Specific actions you took..."
                    value={currentStory.action}
                    onChange={(e) => setCurrentStory({ ...currentStory, action: e.target.value })}
                    className="min-h-24"
                  />
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

                <Button
                  onClick={saveStory}
                  disabled={!currentStory.category || !currentStory.title || !currentStory.situation || isSaving}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Story
                    </>
                  )}
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
                    onClick={() => story.id && deleteStory(story.id)}
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
                  <span className="font-semibold text-purple-700">A:</span> {story.action}
                </div>
                {story.result && (
                  <div>
                    <span className="font-semibold text-purple-700">R:</span> {story.result}
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
