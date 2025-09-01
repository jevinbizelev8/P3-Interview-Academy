// Footer Component for P³ Prepare Module
// Copy this into your prepare module project

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FooterNavigation() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P³</span>
              </div>
              <span className="text-xl font-bold">Interview Academy</span>
            </div>
            <p className="text-gray-400">
              Transform your interview skills with AI-powered coaching and multi-language support.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://YOUR_MAIN_PROJECT_URL.replit.app" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="https://YOUR_MAIN_PROJECT_URL.replit.app/practice" className="text-gray-400 hover:text-white transition-colors">
                  Practice Module
                </a>
              </li>
              <li>
                <a href="https://YOUR_MAIN_PROJECT_URL.replit.app/perform" className="text-gray-400 hover:text-white transition-colors">
                  Perform Module
                </a>
              </li>
            </ul>
          </div>

          {/* Call to Action */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ready to Practice?</h3>
            <p className="text-gray-400 mb-4">
              Start your interview preparation journey with AI-powered coaching.
            </p>
            <a href="https://YOUR_MAIN_PROJECT_URL.replit.app/practice">
              <Button className="w-full">
                Start Practice
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 P³ Interview Academy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Usage: Add this at the bottom of your prepare module pages
// <FooterNavigation />