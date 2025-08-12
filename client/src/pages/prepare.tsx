import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ArrowLeft, Construction } from "lucide-react";
import { Link } from "wouter";

export default function Prepare() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P³</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Interview Academy</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/practice">
                <Button variant="outline">Go to Practice</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Construction className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
              Prepare Module Coming Soon
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're working hard to bring you comprehensive interview preparation resources. 
              This module will include fundamentals, industry insights, and best practices.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-blue-50 rounded-lg">
                <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Interview Fundamentals</h3>
                <p className="text-gray-600 text-sm">Master the basics with comprehensive guides and frameworks</p>
              </div>
              <div className="p-6 bg-green-50 rounded-lg">
                <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Industry Insights</h3>
                <p className="text-gray-600 text-sm">Learn what top companies look for in candidates</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button variant="outline" size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/practice">
                <Button size="lg">
                  Try Practice Module
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}