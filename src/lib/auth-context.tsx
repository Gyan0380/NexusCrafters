import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getRedirectResult,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailLink,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseAuth, isOwnerEmail } from "@/lib/firebase";
import { ensureUserDocument, fetchUserRole } from "@/lib/cms";

const EMAIL_STORAGE_KEY = "nx_email_for_signin";

export type AuthState = {
  user: User | null;
  role: string;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  sendEmailCode: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    let cancelled = false;

    const finishAuthRedirects = async () => {
      try {
        // Keep the Firebase session across browser redirects and page reloads.
        await setPersistence(auth, browserLocalPersistence);

        // Complete a Google redirect sign-in before the auth-state listener
        // starts doing the normal user/profile work.
        await getRedirectResult(auth);
      } catch (error) {
        console.error("Google redirect sign-in failed", error);
      }

      // Complete a passwordless email-link sign-in when the user returns here.
      if (isSignInWithEmailLink(auth, window.location.href)) {
        const stored = window.localStorage.getItem(EMAIL_STORAGE_KEY);
        const email = stored || window.prompt("Confirm your email to finish signing in") || "";

        if (email) {
          try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem(EMAIL_STORAGE_KEY);
            window.history.replaceState({}, "", window.location.pathname);
          } catch (error) {
            console.error("Email link sign-in failed", error);
          }
        }
      }

      if (!cancelled) setLoading(false);
    };

    void finishAuthRedirects();

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const owner = isOwnerEmail(nextUser.email);
        try {
          await ensureUserDocument(nextUser.uid, nextUser.email ?? null, owner);
          const nextRole = await fetchUserRole(nextUser.uid);
          setRole(owner ? "admin" : nextRole);
        } catch {
          setRole(owner ? "admin" : "user");
        }
      } else {
        setRole("user");
      }
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const sendEmailCode = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
    await setPersistence(auth, browserLocalPersistence);
    await sendSignInLinkToEmail(auth, email, {
      url: `${window.location.origin}/`,
      handleCodeInApp: true,
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    // Redirect is more reliable than popups on mobile browsers. Firebase
    // restores the result when the app loads again via getRedirectResult().
    await signInWithRedirect(getFirebaseAuth(), provider);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      role,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: role === "admin" || isOwnerEmail(user?.email),
      sendEmailCode,
      signInWithGoogle,
      signOut,
    }),
    [user, role, loading, sendEmailCode, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      role: "user",
      loading: true,
      isAuthenticated: false,
      isAdmin: false,
      sendEmailCode: async () => {},
      signInWithGoogle: async () => {},
      signOut: async () => {},
    };
  }
  return context;
}
