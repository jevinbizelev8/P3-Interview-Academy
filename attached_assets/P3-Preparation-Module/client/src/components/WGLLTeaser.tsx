import { Lock, Star, MessageSquare, TrendingUp } from "lucide-react";

export default function WGLLTeaser() {
  return (
    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-6 border border-purple-200">
      <div className="text-center">
        <div className="w-12 h-12 bg-purple-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-white" />
        </div>
        
        <h4 className="text-xl font-semibold text-gray-900 mb-2">What Good Looks Like (WGLL)</h4>
        <p className="text-neutral-gray mb-6">
          Complete your practice session to unlock model answers, expert tips, and detailed examples.
        </p>
        
        <div className="flex items-center justify-center space-x-8 text-sm">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-warning-yellow" />
            <span className="text-gray-700">Expert model answers</span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-primary-blue" />
            <span className="text-gray-700">Communication tips</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-success-green" />
            <span className="text-gray-700">Performance comparison</span>
          </div>
        </div>
      </div>
    </div>
  );
}
