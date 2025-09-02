import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";

export function BreadcrumbNavigation({ 
  currentPage = "Prepare Module" 
}: { 
  currentPage?: string 
}) {
  return (
    <div className="bg-gray-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav className="flex items-center space-x-2 text-sm">
          <Link 
            href="/" 
            className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Home className="w-4 h-4 mr-1" />
            P³ Interview Academy
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-blue-600 font-medium">{currentPage}</span>
        </nav>
      </div>
    </div>
  );
}