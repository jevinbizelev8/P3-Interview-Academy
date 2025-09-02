import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BreadcrumbNavigation } from "@/components/prepare/breadcrumb-navigation";
import { FooterNavigation } from "@/components/prepare/footer-navigation";
import { 
  Target, 
  MessageSquare, 
  Users, 
  BookOpen,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function InterviewStrategies() {
  useEffect(() => {
    document.title = "Interview Strategies - P³ Interview Academy";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BreadcrumbNavigation currentPage="Interview Strategies" />

      {/* Header */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Target className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Interview Strategies
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Master proven frameworks and techniques that help you structure compelling answers 
              and make a lasting impression on interviewers.
            </p>
          </div>
        </div>
      </section>

      {/* STAR Method */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <MessageSquare className="w-6 h-6 text-blue-600 mr-2" />
                The STAR Method
              </CardTitle>
              <CardDescription>
                Structure your behavioral interview responses for maximum impact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm mr-2">S</span>
                      Situation
                    </h3>
                    <p className="text-blue-800 text-sm">
                      Set the context by describing the background of your example
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-sm mr-2">T</span>
                      Task
                    </h3>
                    <p className="text-green-800 text-sm">
                      Explain what you needed to accomplish or the challenge you faced
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">
                      <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm mr-2">A</span>
                      Action
                    </h3>
                    <p className="text-purple-800 text-sm">
                      Detail the specific steps you took to address the situation
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-semibold text-orange-900 mb-2">
                      <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm mr-2">R</span>
                      Result
                    </h3>
                    <p className="text-orange-800 text-sm">
                      Share the outcomes and lessons learned from your actions
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-6">
                <Button className="w-full sm:w-auto">
                  Practice STAR Method
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Other Strategies */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Essential Interview Techniques</h2>
            <p className="text-lg text-gray-600">
              Additional frameworks to enhance your interview performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* PAR Method */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BookOpen className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle>PAR Method</CardTitle>
                <CardDescription>
                  Problem, Action, Result - A concise alternative to STAR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    Problem identification
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    Action taken
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    Results achieved
                  </li>
                </ul>
                <Button variant="ghost" size="sm">Learn More</Button>
              </CardContent>
            </Card>

            {/* SOAR Method */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Target className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle>SOAR Method</CardTitle>
                <CardDescription>
                  Situation, Obstacle, Action, Result - For challenging scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5" />
                    Situation context
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5" />
                    Obstacle faced
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5" />
                    Action & Result
                  </li>
                </ul>
                <Button variant="ghost" size="sm">Learn More</Button>
              </CardContent>
            </Card>

            {/* CARL Method */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>CARL Method</CardTitle>
                <CardDescription>
                  Context, Action, Result, Learning - For growth-focused answers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                    Context setting
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                    Action details
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                    Result & Learning
                  </li>
                </ul>
                <Button variant="ghost" size="sm">Learn More</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Strategy Tips</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Before the Interview</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Prepare 5-7 STAR examples covering different competencies</li>
                <li>• Practice your examples out loud to ensure flow</li>
                <li>• Research the company's values and match your examples</li>
                <li>• Prepare thoughtful questions to ask the interviewer</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">During the Interview</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Take a moment to think before answering</li>
                <li>• Use specific numbers and metrics when possible</li>
                <li>• Focus on your individual contribution to team successes</li>
                <li>• End with the positive impact of your actions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FooterNavigation />
    </div>
  );
}