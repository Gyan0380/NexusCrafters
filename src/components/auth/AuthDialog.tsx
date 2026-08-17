import { Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export type AuthMode = "login" | "signup";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1a7 7 0 0 1-6.6-4.8H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1A7 7 0 0 1 12 4.8Z"
      />
    </svg>
  );
}

export function AuthDialog({
  open,
  onOpenChange,
  mode = "login",
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  mode?: AuthMode;
}) {
  const { sendEmailCode, signInWithGoogle, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [busy, setBusy] = useState<null | "email" | "google">(null);

  useEffect(() => {
    if (isAuthenticated && open) onOpenChange(false);
  }, [isAuthenticated, open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setEmailSent(false);
    }
  }, [open]);

  const title = mode === "signup" ? "Create your account" : "Welcome back";
  const description =
    mode === "signup"
      ? "Sign up with a passwordless email link or Google."
      : "Log in with a passwordless email link or Google.";

  async function handleEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setBusy("email");
    try {
      await sendEmailCode(email);
      setEmailSent(true);
      toast.success("Verification link sent — check your inbox.");
    } catch (error) {
      toast.error(errorMessage(error, "Could not send the verification email."));
    } finally {
      setBusy(null);
    }
  }

  async function handleGoogle() {
    setBusy("google");
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google");
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error, "Google sign-in was cancelled."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Button variant="glass" className="w-full gap-2" onClick={handleGoogle} disabled={!!busy}>
          {busy === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {emailSent ? (
          <div className="space-y-2 pt-2 text-sm">
            <p className="font-medium">Check {email}</p>
            <p className="text-muted-foreground">
              We sent a secure sign-in link. Open it to finish signing in — no password needed.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setEmailSent(false)}>
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleEmail} className="space-y-3 pt-2">
            <div>
              <Label htmlFor="auth-email">Email address</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                className="mt-2"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={!!busy}>
              {busy === "email" ? <Loader2 className="size-4 animate-spin" /> : null}
              Send verification link
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function errorMessage(error: unknown, fallback: string) {
  const code = (error as { code?: string } | null)?.code;
  if (!code) return fallback;
  const map: Record<string, string> = {
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/operation-not-allowed":
      "Enable this sign-in method in the Firebase console (Authentication → Sign-in method).",
    "auth/unauthorized-domain": "Add this domain to Firebase Authentication → Settings → Authorized domains.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
  };
  return map[code] ?? `${fallback} (${code})`;
}
