import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Loader2, AlertCircle } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { apiRequest } from "@/lib/queryClient";

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignup: () => void;
  onSwitchToReset: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToSignup, onSwitchToReset }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false);
  const [isGoogleEnabled, setIsGoogleEnabled] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const googleEnvFlag = (import.meta.env as Record<string, string | undefined>)["VITE_ENABLE_GOOGLE_OAUTH"];
  const googleEnvEnabled = googleEnvFlag !== "false";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("authError") === "google") {
      setError("Google sign-in didn't complete. Please try again or use email instead.");
      setIsOAuthRedirecting(false);
      params.delete("authError");
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, []);

  useEffect(() => {
    if (!googleEnvEnabled) {
      return;
    }
    let isMounted = true;
    const controller = new AbortController();

    const loadProviders = async () => {
      try {
        const res = await fetch("/api/auth/providers", {
          credentials: "include",
          signal: controller.signal
        });

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        if (isMounted) {
          setIsGoogleEnabled(Boolean(data?.providers?.google));
        }
      } catch (err) {
        if (typeof err === "object" && err && "name" in err && (err as { name?: string }).name === "AbortError") {
          return;
        }
        console.error("Failed to load auth providers", err);
      }
    };

    loadProviders();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [googleEnvEnabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOAuthRedirecting) {
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest("POST", "/api/auth/login", formData);
      const data = await response.json();

      if (data.success) {
        onSuccess();

        // Fetch user data to check role for admin redirect
        const userResponse = await fetch('/api/auth/user', { credentials: 'include' });
        const userData = await userResponse.json();

        // Redirect based on role: admins to /admin, regular users to /dashboard
        if (userData.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      } else if (data.requiresVerification) {
        setError("Please verify your email before logging in. Check your inbox for the verification link.");
      } else {
        setError(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error: any) {
      setError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (!googleEnvEnabled || isOAuthRedirecting || isLoading) {
      return;
    }
    setError("");
    setIsOAuthRedirecting(true);
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const params = new URLSearchParams();
    if (currentPath) {
      params.set("returnTo", currentPath);
    }
    const query = params.toString();
    window.location.href = query ? `/api/auth/google?${query}` : "/api/auth/google";
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
        
        {googleEnvEnabled && isGoogleEnabled ? (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isOAuthRedirecting}
              data-testid="button-google-login"
            >
              {isOAuthRedirecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <FcGoogle className="w-5 h-5" />
                  Continue with Google
                </>
              )}
            </Button>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-gray-500">
              <span className="h-px flex-1 bg-gray-200" />
              <span>Or continue with email</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>
          </div>
        ) : null}

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
              disabled={isLoading || isOAuthRedirecting}
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
              disabled={isLoading || isOAuthRedirecting}
              data-testid="input-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || isOAuthRedirecting} data-testid="button-login">
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
              disabled={isLoading || isOAuthRedirecting}
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
              disabled={isLoading || isOAuthRedirecting}
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
