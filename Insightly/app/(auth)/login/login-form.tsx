"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3, ArrowRight, Eye, EyeOff, Loader2,
  TrendingUp, FileText, Zap, Users, Clock,
  CheckCircle2, Sparkles, Shield, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  agencyCount: number;
  reportCount: number;
}

// Two rows of cards for the MagicUI-style marquee
// Row 1 scrolls left, Row 2 scrolls right
function MarqueeRow({
  items,
  reverse = false,
}: {
  items: { icon: React.ElementType; value: string; label: string }[];
  reverse?: boolean;
}) {
  const doubled = [...items, ...items];
  return (
    <div className={`flex gap-4 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
      {doubled.map(({ icon: Icon, value, label }, i) => (
        <div
          key={i}
          className="shrink-0 w-52 rounded-xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15">
            <Icon className="h-4.5 w-4.5 text-brand-400" />
          </div>
          <p className="text-xl font-bold leading-none text-foreground">{value}</p>
          <p className="mt-1.5 text-xs leading-tight text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

export function LoginForm({ agencyCount, reportCount }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard?welcome=1" });
  };

  // Row 1 — stat cards with real data (scroll left)
  const row1 = [
    { icon: Users, value: `${agencyCount}+`, label: "Active Agencies" },
    { icon: FileText, value: `${reportCount}+`, label: "Reports Generated" },
    { icon: Clock, value: "7 hrs/mo", label: "Avg. Time Saved" },
    { icon: TrendingUp, value: "99.9%", label: "Data Accuracy" },
  ];

  // Row 2 — feature cards (scroll right)
  const row2 = [
    { icon: Zap, value: "GA4 + Meta", label: "Live Integrations" },
    { icon: Sparkles, value: "Claude AI", label: "AI-Powered" },
    { icon: Shield, value: "Encrypted", label: "Secure by Default" },
    { icon: Globe, value: "White-label", label: "Your Brand" },
  ];

  const BENEFITS = [
    "One dashboard for all client data",
    "AI writes the narrative, you review it",
    "Send white-labeled PDFs in one click",
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-card/50 border-r border-border overflow-hidden">
        {/* Logo */}
        <div className="p-12 pb-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold text-foreground">Reportiq</span>
              <span className="text-[9px] font-medium tracking-wide text-muted-foreground uppercase">report + intelligence</span>
            </div>
          </div>
        </div>

        {/* Middle — heading + marquee + benefits */}
        <div className="space-y-8">
          <div className="px-12">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Built for agencies that move fast
            </h2>
            <p className="text-sm text-muted-foreground">
              Connect your clients&apos; marketing data and let AI do the heavy lifting.
            </p>
          </div>

          {/* MagicUI-style two-row marquee — bleeds edge to edge */}
          <div className="space-y-3 overflow-hidden">
            <MarqueeRow items={row1} />
            <MarqueeRow items={row2} reverse />
          </div>

          {/* Benefits */}
          <div className="px-12 space-y-2.5">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 shrink-0 text-brand-400" />
                <span className="text-sm text-foreground">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — testimonial */}
        <div className="p-12 pt-0">
          <blockquote className="text-sm font-medium leading-relaxed text-foreground border-l-2 border-brand-500 pl-4">
            &ldquo;Reportiq cut our monthly reporting time from 8 hours to 20
            minutes. The AI narratives are better than what we were writing
            manually.&rdquo;
          </blockquote>
          <div className="mt-3 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" />
            <div>
              <p className="font-semibold text-sm text-foreground">Mohanaprasad G</p>
              <p className="text-xs text-muted-foreground">Founder</p>
            </div>
          </div>
        </div>
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
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your agency workspace
            </p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Google OAuth */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">
                    or continue with email
                  </span>
                </div>
              </div>

              {/* Success message */}
              {success && (
                <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Signed in successfully! Redirecting…
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              {/* Credentials form */}
              <form onSubmit={handleCredentialsLogin} className="space-y-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-brand-400 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
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
                      Sign in <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-brand-400 hover:underline"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
