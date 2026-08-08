"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AuthError } from "@/lib/auth/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              text?: string;
              width?: number;
              shape?: string;
            },
          ) => void;
        };
      };
    };
  }
}

type Mode = "login" | "register";

export function LoginForm() {
  const router = useRouter();
  const { login, register, loginWithGoogle, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, displayName || undefined);
      }
      router.push("/");
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setError(null);
      setIsLoading(true);
      try {
        await loginWithGoogle(credential);
        router.push("/");
      } catch (err) {
        if (err instanceof AuthError) {
          setError(err.message);
        } else {
          setError("Google sign-in failed. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithGoogle, router],
  );

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleRendered = useRef(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || googleRendered.current) return;

    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current || googleRendered.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          handleGoogleCredential(response.credential);
        },
        use_fedcm_for_prompt: false,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 350,
        shape: "rectangular",
      });
      googleRendered.current = true;
    };

    if (window.google) {
      renderGoogleButton();
      return;
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => renderGoogleButton();
      document.head.appendChild(script);
    }
  }, [handleGoogleCredential]);

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login"
            ? "Sign in to your FayazLabs account"
            : "Get started with FayazLabs"}
        </p>
      </div>

      {/* Google sign-in */}
      <div
        ref={googleButtonRef}
        className="mb-6 flex w-full items-center justify-center"
      />
      {!GOOGLE_CLIENT_ID && (
        <p className="mb-6 text-center text-xs text-muted-foreground">
          Google sign-in unavailable (client ID not configured)
        </p>
      )}

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div className="relative">
            <User className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-10 pl-9"
              autoComplete="name"
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 pl-9"
            autoComplete="email"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 pl-9 pr-9"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full h-10"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          {!isLoading && (mode === "login" ? "Sign in" : "Create account")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={toggleMode}
          className="font-medium text-primary hover:underline"
        >
          {mode === "login" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
