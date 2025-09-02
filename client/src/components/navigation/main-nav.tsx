import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Target, Award, Home, Mic, Settings } from "lucide-react";

interface MainNavProps {
  currentModule?: string;
  showBackToHome?: boolean;
  showActions?: boolean;
}

export default function MainNav({ currentModule, showBackToHome = true, showActions = false }: MainNavProps) {
  const modules = [
    {
      id: "prepare",
      name: "Prepare",
      icon: BookOpen,
      href: "/prepare",
      activeColor: "text-blue-600 border-blue-600 bg-blue-50",
      hoverColor: "hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50"
    },
    {
      id: "practice", 
      name: "Practice",
      icon: Target,
      href: "/practice",
      activeColor: "text-green-600 border-green-600 bg-green-50",
      hoverColor: "hover:text-green-600 hover:border-green-600 hover:bg-green-50"
    },
    {
      id: "perform",
      name: "Perform", 
      icon: Award,
      href: "/perform",
      activeColor: "text-purple-600 border-purple-600 bg-purple-50",
      hoverColor: "hover:text-purple-600 hover:border-purple-600 hover:bg-purple-50"
    }
  ];

  return (
    <nav className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:shadow-md transition-shadow">
              <span className="text-white font-bold text-sm">P³</span>
            </div>
            <span className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">Interview Academy</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {modules.map((module) => {
              const Icon = module.icon;
              const isActive = currentModule === module.id;
              
              return (
                <Link key={module.id} href={module.href}>
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border border-transparent transition-all duration-200 ${
                    isActive 
                      ? module.activeColor 
                      : `text-gray-600 ${module.hoverColor}`
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{module.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {showActions && (
              <>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                  <Settings className="w-4 h-4" />
                </Button>
              </>
            )}
            
            {showBackToHome && (
              <Link href="/">
                <Button variant="outline" size="sm" className="ml-2">
                  <Home className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden border-t bg-gray-50/80">
        <div className="flex justify-center space-x-6 py-3 px-4">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = currentModule === module.id;
            
            return (
              <Link key={module.id} href={module.href} className="flex-1">
                <div className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
                  isActive 
                    ? module.activeColor.split(' ')[0] + ' font-medium'
                    : 'text-gray-600 hover:text-gray-800'
                }`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{module.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}