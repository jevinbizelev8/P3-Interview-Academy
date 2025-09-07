import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, LogIn, UserPlus, Shield, ArrowRight } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/login';
  };

  const handleSignup = () => {
    setIsLoading(true);
    window.location.href = '/api/login';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center text-2xl">Welcome to P³ Interview Academy</DialogTitle>
          <DialogDescription className="text-center">
            Choose how you'd like to access your personalized interview preparation platform
          </DialogDescription>
        </DialogHeader>
        
        <CardContent className="space-y-4 p-0">
          <div className="space-y-3">
            <Button 
              onClick={handleSignup} 
              className="w-full h-12 text-base"
              disabled={isLoading}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Create New Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleLogin}
              className="w-full h-12 text-base"
              disabled={isLoading}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In to Existing Account
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600 mt-6">
            <div className="flex items-center justify-center mb-2">
              <Shield className="w-4 h-4 mr-1" />
              <span className="font-medium">Secure Authentication</span>
            </div>
            <div className="space-y-1 text-xs">
              <p>✅ Track your interview progress</p>
              <p>✅ Save your evaluation results</p>
              <p>✅ Access personalized recommendations</p>
              <p>✅ View your performance history</p>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 text-center mt-4">
            Powered by enterprise-grade security with Replit Auth
          </div>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}