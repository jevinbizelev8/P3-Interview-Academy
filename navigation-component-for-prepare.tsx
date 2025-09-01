// Navigation Component for P³ Prepare Module
// Copy this into your prepare module project

import { Button } from "@/components/ui/button"; // Make sure you have shadcn/ui components

export function NavigationHeader() {
  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Link back to main project */}
          <a href="https://YOUR_MAIN_PROJECT_URL.replit.app" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P³</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Interview Academy</span>
          </a>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="https://YOUR_MAIN_PROJECT_URL.replit.app#modules" className="text-gray-600 hover:text-gray-900 transition-colors">
              Modules
            </a>
            <a href="https://YOUR_MAIN_PROJECT_URL.replit.app#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="https://YOUR_MAIN_PROJECT_URL.replit.app#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">
              Reviews
            </a>
            <span className="text-blue-600 font-medium">
              Prepare
            </span>
            <a href="https://YOUR_MAIN_PROJECT_URL.replit.app/perform" className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
              Perform
            </a>
            <a href="https://YOUR_MAIN_PROJECT_URL.replit.app/practice">
              <Button>Start Practice</Button>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Usage in your prepare module:
// Import this component and use it at the top of your main page
// <NavigationHeader />