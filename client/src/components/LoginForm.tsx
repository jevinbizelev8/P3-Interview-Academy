import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Loader2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignup: () => void;
  onSwitchToReset: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToSignup, onSwitchToReset }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await apiRequest("POST", "/api/auth/login", formData);
      if (response.ok) {
        onSuccess();
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      setError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to access your interview preparation dashboard
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
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              disabled={isLoading}
              data-testid="input-email"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              disabled={isLoading}
              data-testid="input-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Sign In
          </Button>
        </form>

        <div className="text-center text-sm space-y-2">
          <div>
            <button 
              type="button"
              onClick={onSwitchToReset}
              className="text-blue-600 hover:text-blue-500 font-medium text-sm"
              disabled={isLoading}
              data-testid="link-forgot-password"
            >
              Forgot your password?
            </button>
          </div>
          <div>
            <span className="text-gray-600">Don't have an account? </span>
            <button 
              onClick={onSwitchToSignup}
              className="text-blue-600 hover:text-blue-500 font-medium"
              disabled={isLoading}
              data-testid="link-signup"
            >
              Create one here
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}