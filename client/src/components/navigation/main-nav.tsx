import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

interface MainNavProps {
  currentModule?: string;
  showBackToHome?: boolean;
}

export default function MainNav({ currentModule, showBackToHome = true }: MainNavProps) {
  return (
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
            {/* Module Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/prepare" className={`transition-colors ${currentModule === 'prepare' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
                Prepare
              </Link>
              <Link href="/practice" className={`transition-colors ${currentModule === 'practice' ? 'text-green-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
                Practice
              </Link>
              <Link href="/perform" className={`transition-colors ${currentModule === 'perform' ? 'text-purple-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
                Perform
              </Link>
            </div>
            
            {showBackToHome && (
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Module Navigation */}
      <div className="md:hidden border-t bg-gray-50">
        <div className="flex justify-center space-x-8 py-3">
          <Link href="/prepare" className={`text-sm transition-colors ${currentModule === 'prepare' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
            Prepare
          </Link>
          <Link href="/practice" className={`text-sm transition-colors ${currentModule === 'practice' ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
            Practice
          </Link>
          <Link href="/perform" className={`text-sm transition-colors ${currentModule === 'perform' ? 'text-purple-600 font-medium' : 'text-gray-600'}`}>
            Perform
          </Link>
        </div>
      </div>
    </nav>
  );
}