import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/Neon Cyberpunk Robot Head Bust.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Ultron AI" },
      {
        name: "description",
        content: "Sign in to Ultron AI to reach your saved sessions, voices and settings.",
      },
      { property: "og:title", content: "Sign in — Ultron AI" },
      {
        property: "og:description",
        content: "Sign in to Ultron AI to reach your saved sessions, voices and settings.",
      },
    ],
  }),
  component: AuthPage,
});

/** Turn raw Supabase auth errors into plain, actionable language. */
function friendlyAuthError(raw: string): string {
  const text = raw.toLowerCase();
  if (text.includes("invalid login credentials")) {
    return "Email or password is wrong — or your account isn't confirmed yet. Check your inbox and spam for the confirmation link, or resend it below.";
  }
  if (text.includes("weak_password") || text.includes("password should")) {
    return "That password is too easy to guess — please choose a more unique one.";
  }
  if (text.includes("email not confirmed")) {
    return "Confirm your email first — check your inbox (and spam folder) for the link.";
  }
  if (text.includes("already registered")) {
    return "That email is already registered — sign in instead.";
  }
  if (text.includes("rate") || text.includes("too many")) {
    return "Too many attempts — wait a minute, then try again.";
  }
  if (
    text.includes("not allowed") ||
    text.includes("placeholder") ||
    text.includes("valid email")
  ) {
    return "That email address can't be used — check it or try another one.";
  }
  return raw;
}

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/chat" });
  }, [loading, session, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/chat` },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success(
            "Almost there! Check your inbox (and spam folder) to confirm your account, then sign in.",
            { duration: 6000 },
          );
          return;
        }
        void navigate({ to: "/chat" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        void navigate({ to: "/chat" });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? friendlyAuthError(error.message) : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    // Native Supabase OAuth — no Lovable broker involved.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    if (error) {
      setBusy(false);
      toast.error(friendlyAuthError(error.message));
    }
    // On success the browser navigates away to Google.
  }

  async function handleResend() {
    if (!email.trim()) {
      toast.error("Enter your email address above first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setBusy(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
    } else {
      toast.success("Confirmation email sent again — check your inbox and spam folder.", {
        duration: 6000,
      });
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div aria-hidden className="hud-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[50vh]"
      />
      <Link
        to="/"
        className="absolute left-4 top-4 z-20 flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-dim transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        BACK TO HOME
      </Link>
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex items-center gap-3">
          <span className="size-2.5 animate-corepulse rounded-full bg-signal" />
          <img
            src={logo}
            alt="Ultron neon head"
            className="logo-glow h-11 w-auto shrink-0 object-contain"
          />
          <div>
            <div className="font-mono text-[11px] tracking-[0.28em] text-ink">ULTRON CORE</div>
            <div className="mono-label mt-1">created by mr. chris</div>
          </div>
        </div>

        <div className="mt-6 rounded-md border border-line bg-panel p-5">
          <div className="mono-label">
            {mode === "signin" ? "operator sign in" : "register operator"}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <label className="block">
              <span className="mono-label">email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-voice"
                placeholder="you@domain.com"
              />
            </label>
            <label className="block">
              <span className="mono-label">password</span>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 pr-10 text-sm text-ink outline-none focus:border-voice"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim transition-colors hover:text-ink"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-signal py-2 font-mono text-[11px] tracking-[0.18em] text-signal-foreground disabled:opacity-60"
            >
              {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="mt-3 w-full rounded-md border border-line bg-surface py-2 font-mono text-[11px] tracking-[0.18em] text-ink transition-colors hover:border-voice disabled:opacity-60"
          >
            CONTINUE WITH GOOGLE
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-[11px] text-dim transition-colors hover:text-ink"
          >
            {mode === "signin"
              ? "No account yet? Register an operator"
              : "Already registered? Sign in"}
          </button>

          {mode === "signin" && (
            <button
              type="button"
              onClick={handleResend}
              disabled={busy}
              className="mt-2 w-full text-center text-[11px] text-voice transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              Didn't get the confirmation email? Resend it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
