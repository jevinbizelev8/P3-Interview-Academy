import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, ArrowLeft, Construction } from "lucide-react";
import { Link } from "wouter";
import MainNav from "@/components/navigation/main-nav";
import ModuleSwitcher from "@/components/navigation/module-switcher";

export default function Perform() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <MainNav currentModule="perform" />
      <ModuleSwitcher currentModule="perform" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <Construction className="w-8 h-8 text-purple-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
              Perform Module Coming Soon
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              Advanced strategies for interview excellence, executive presence, and career advancement. 
              Perfect your performance with expert-level techniques.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-purple-50 rounded-lg">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Advanced Strategies</h3>
                <p className="text-gray-600 text-sm">Master complex interview scenarios and executive-level discussions</p>
              </div>
              <div className="p-6 bg-indigo-50 rounded-lg">
                <Award className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Executive Presence</h3>
                <p className="text-gray-600 text-sm">Develop leadership communication and professional gravitas</p>
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