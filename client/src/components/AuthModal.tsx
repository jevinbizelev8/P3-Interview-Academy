import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import ResetPasswordForm from "./ResetPasswordForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup' | 'reset';
}

export default function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'reset'>(initialView);

  // Reset to initial view when modal opens or initialView changes
  useEffect(() => {
    if (isOpen) {
      setCurrentView(initialView);
    }
  }, [isOpen, initialView]);

  const handleSuccess = () => {
    onClose();
  };

  const getDialogTitle = () => {
    switch (currentView) {
      case 'login': return "Login";
      case 'signup': return "Sign Up";
      case 'reset': return "Reset Password";
      default: return "Authentication";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 border-0" aria-describedby={undefined}>
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </VisuallyHidden>
        </DialogHeader>
        {currentView === 'login' ? (
          <LoginForm 
            onSuccess={handleSuccess}
            onSwitchToSignup={() => setCurrentView('signup')}
            onSwitchToReset={() => setCurrentView('reset')}
          />
        ) : currentView === 'signup' ? (
          <SignupForm 
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        ) : (
          <ResetPasswordForm 
            onBackToLogin={() => setCurrentView('login')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}