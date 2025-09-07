import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ResetPasswordFormProps {
  onBackToLogin: () => void;
}

export default function ResetPasswordForm({ onBackToLogin }: ResetPasswordFormProps) {
  const [step, setStep] = useState<'request' | 'success'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await apiRequest("POST", "/api/auth/forgot-password", { email });
      if (response.ok) {
        setStep('success');
      }
    } catch (error: any) {
      setError(error.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We've sent password reset instructions to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600 space-y-2">
            <p>If you don't see the email in your inbox, please check your spam folder.</p>
            <p>The reset link will expire in 24 hours for security reasons.</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={onBackToLogin}
            className="w-full"
            data-testid="button-back-to-login"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Reset Your Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              data-testid="input-reset-email"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-send-reset">
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Send Reset Instructions
          </Button>
        </form>

        <div className="text-center">
          <button 
            onClick={onBackToLogin}
            className="text-gray-600 hover:text-gray-500 font-medium text-sm"
            disabled={isLoading}
            data-testid="link-back-to-login"
          >
            <ArrowLeft className="w-3 h-3 mr-1 inline" />
            Back to Login
          </button>
        </div>
      </CardContent>
    </Card>
  );
}