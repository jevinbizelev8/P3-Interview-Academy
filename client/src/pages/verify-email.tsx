import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      // Get token from URL query params
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setStatus('error');
        setMessage("Invalid verification link. Please check your email and try again.");
        return;
      }

      try {
        const response = await apiRequest("GET", `/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (data.alreadyVerified) {
          setStatus('already-verified');
          setMessage(data.message || "Email already verified. You can now log in.");
        } else if (data.verified || data.success) {
          setStatus('success');
          setMessage(data.message || "Email verified successfully!");

          // If auto-logged in, redirect to dashboard after 2 seconds
          if (data.autoLoggedIn) {
            setTimeout(() => {
              setLocation('/dashboard');
            }, 2000);
          }
        } else {
          setStatus('error');
          setMessage(data.message || "Verification failed. Please try again.");
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || "Verification failed. The link may have expired.");
      }
    };

    verifyEmail();
  }, [setLocation]);

  const handleGoToLogin = () => {
    setLocation('/');
  };

  const handleGoToDashboard = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-100">
            {status === 'loading' && <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-8 h-8 text-green-600" />}
            {status === 'already-verified' && <CheckCircle className="w-8 h-8 text-blue-600" />}
            {status === 'error' && <XCircle className="w-8 h-8 text-red-600" />}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && "Verifying Email..."}
            {status === 'success' && "Email Verified!"}
            {status === 'already-verified' && "Already Verified"}
            {status === 'error' && "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && "Please wait while we verify your email address"}
            {status === 'success' && "Your account is now active"}
            {status === 'already-verified' && "This email has already been verified"}
            {status === 'error' && "Unable to verify your email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant={status === 'error' ? 'destructive' : 'default'}>
            <Mail className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>

          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-center text-gray-600">
                Welcome to P³ Interview Academy! Redirecting to dashboard...
              </p>
              <Button onClick={handleGoToDashboard} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === 'already-verified' && (
            <Button onClick={handleGoToLogin} className="w-full">
              Go to Login
            </Button>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <Button onClick={handleGoToLogin} className="w-full">
                Back to Login
              </Button>
              <p className="text-xs text-center text-gray-500">
                Need a new verification link? Try signing up again or contact support.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
