import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, X, MessageCircle, Send, MessageSquare, HeadphonesIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubmitFeedback, useCreateTicket } from "@/hooks/useApi";

const contextualTips = {
  Dashboard: [
    "Start with the Prepare stage to build a strong foundation!",
    "Complete your self-intro and resume analysis for personalised insights.",
    "Your readiness score improves as you complete more modules and simulations."
  ],
  Prepare: [
    "Record your self-introduction to get instant AI feedback.",
    "Upload your resume with a job description for tailored suggestions.",
    "Complete all 5 interview stage modules to unlock Practice mode."
  ],
  Practice: [
    "Choose a simulation that matches your target role.",
    "Be authentic in your responses - the AI learns your style.",
    "Review your feedback after each simulation to track improvement."
  ],
  Perform: [
    "Your performance metrics show trends over time.",
    "Focus on areas with lower scores for maximum improvement.",
    "Earn badges by completing milestones and maintaining streaks!"
  ]
};

export default function FloatingAICoach({ currentPage = "Dashboard" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  
  // Feedback form state
  const [feedbackData, setFeedbackData] = useState({
    feedback_type: "general",
    subject: "",
    message: ""
  });

  // Support form state
  const [supportData, setSupportData] = useState({
    category: "technical",
    subject: "",
    message: ""
  });

  const tips = contextualTips[currentPage] || contextualTips.Dashboard;

  const feedbackMutation = useSubmitFeedback({
    onSuccess: () => {
      alert("Thank you for your feedback! We'll review it and get back to you soon.");
      setFeedbackData({ feedback_type: "general", subject: "", message: "" });
      setShowFeedback(false);
    }
  });

  const supportMutation = useCreateTicket({
    onSuccess: (ticket) => {
      alert(`Support ticket created! Your ticket number is: ${ticket.ticket_number}\n\nOur team will respond within 24 hours.`);
      setSupportData({ category: "technical", subject: "", message: "" });
      setShowSupport(false);
    }
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setChatHistory(prev => [...prev, 
      { role: "user", content: message },
      { role: "coach", content: "I'm here to help you succeed! This is a demo response. In production, I'd provide personalised guidance based on your progress and goals." }
    ]);
    setMessage("");
  };

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (feedbackData.message.trim()) {
      feedbackMutation.mutate(feedbackData);
    }
  };

  const handleSubmitSupport = (e) => {
    e.preventDefault();
    if (supportData.subject.trim() && supportData.message.trim()) {
      supportMutation.mutate(supportData);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-2 border-purple-200 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-3 border-b border-purple-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    AI Coach
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {!showFeedback && !showSupport && (
                  <>
                    <div className="mb-4">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-700 font-medium mb-2">Quick Tip:</p>
                            <p className="text-sm text-gray-600">{tips[currentTipIndex]}</p>
                            <div className="flex gap-2 mt-3">
                              {tips.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentTipIndex(index)}
                                  className={`w-2 h-2 rounded-full transition-all ${
                                    index === currentTipIndex 
                                      ? 'bg-purple-600 w-6' 
                                      : 'bg-purple-300 hover:bg-purple-400'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
                      {chatHistory.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-4 py-2 ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Ask me anything..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        size="icon"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFeedback(true)}
                        className="w-full"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Feedback
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSupport(true)}
                        className="w-full"
                      >
                        <HeadphonesIcon className="w-4 h-4 mr-2" />
                        Support
                      </Button>
                    </div>
                  </>
                )}

                {showFeedback && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Share Your Feedback</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowFeedback(false)}
                        className="h-6 w-6"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <form onSubmit={handleSubmitFeedback} className="space-y-3">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={feedbackData.feedback_type}
                          onValueChange={(value) => setFeedbackData({...feedbackData, feedback_type: value})}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="feature">Feature Request</SelectItem>
                            <SelectItem value="bug">Bug Report</SelectItem>
                            <SelectItem value="improvement">Improvement</SelectItem>
                            <SelectItem value="general">General Feedback</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Subject</Label>
                        <Input
                          value={feedbackData.subject}
                          onChange={(e) => setFeedbackData({...feedbackData, subject: e.target.value})}
                          placeholder="Brief summary..."
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Message</Label>
                        <Textarea
                          value={feedbackData.message}
                          onChange={(e) => setFeedbackData({...feedbackData, message: e.target.value})}
                          placeholder="Tell us more..."
                          className="text-sm min-h-[80px]"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" size="sm" disabled={feedbackMutation.isPending}>
                        {feedbackMutation.isPending ? "Sending..." : "Submit Feedback"}
                      </Button>
                    </form>
                  </div>
                )}

                {showSupport && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Contact Support</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSupport(false)}
                        className="h-6 w-6"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <form onSubmit={handleSubmitSupport} className="space-y-3">
                      <div>
                        <Label className="text-xs">Category</Label>
                        <Select
                          value={supportData.category}
                          onValueChange={(value) => setSupportData({...supportData, category: value})}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technical">Technical Issue</SelectItem>
                            <SelectItem value="billing">Billing/Payments</SelectItem>
                            <SelectItem value="account">Account Management</SelectItem>
                            <SelectItem value="feature">Feature Help</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Subject *</Label>
                        <Input
                          value={supportData.subject}
                          onChange={(e) => setSupportData({...supportData, subject: e.target.value})}
                          placeholder="What do you need help with?"
                          className="h-8 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Description *</Label>
                        <Textarea
                          value={supportData.message}
                          onChange={(e) => setSupportData({...supportData, message: e.target.value})}
                          placeholder="Describe your issue in detail..."
                          className="text-sm min-h-[80px]"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" size="sm" disabled={supportMutation.isPending}>
                        {supportMutation.isPending ? "Creating Ticket..." : "Submit Support Request"}
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}