"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  "Connect GA4 and Meta Ads accounts",
  "AI-generated narrative insights",
  "White-labeled PDF reports",
  "Automated monthly delivery",
];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Call the signup API route (to be built)
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, agencyName, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create account.");
        return;
      }

      // Auto-login after successful signup
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-card/50 border-r border-border p-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold text-foreground">Reportiq</span>
            <span className="text-[9px] font-medium tracking-wide text-muted-foreground uppercase">report + intelligence</span>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Start reporting smarter
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Everything you need to automate client reporting.
          </p>
          <div className="space-y-3">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-400" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-lg border border-brand-500/20 bg-brand-500/5 p-4">
            <p className="text-xs font-medium text-brand-300">Free forever plan</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Get started with up to 3 clients and 5 reports/month at no cost.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          No credit card required. Cancel anytime.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-foreground">Reportiq</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">Create your workspace</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Free forever · No credit card needed
            </p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Google OAuth */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignup}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Sign up with Google
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">
                    or with email
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                      id="name"
                      placeholder="Jane Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="agency">Agency name</Label>
                    <Input
                      id="agency"
                      placeholder="Acme Digital"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@agency.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Create workspace <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-[11px] text-muted-foreground">
                By signing up you agree to our{" "}
                <Link href="/terms" className="underline hover:text-foreground">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-brand-400 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
