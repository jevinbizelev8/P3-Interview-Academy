import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Prepare() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = "Prepare - P³ Interview Academy";
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P³</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Interview Academy</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <a href="/#modules" className="text-gray-600 hover:text-gray-900 transition-colors">Modules</a>
              <a href="/#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="/#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Reviews</a>
              <span className="text-blue-600 font-medium">Prepare</span>
              <Link href="/perform" className="text-gray-600 hover:text-purple-600 transition-colors font-medium">Perform</Link>
              <Link href="/practice">
                <Button size="sm">Start Practice</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center" style={{ height: "calc(100vh - 64px)" }}>
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading Prepare Module...</p>
          </div>
        </div>
      )}

      {/* Embedded Prepare Module */}
      <div className="w-full" style={{ height: "calc(100vh - 64px)" }}>
        <iframe
          src="https://p3-prepare-sealion.replit.app"
          className="w-full h-full border-0"
          title="P³ Prepare Module"
          allow="microphone; camera; clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          onLoad={handleIframeLoad}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
}