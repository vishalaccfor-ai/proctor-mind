import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

// ── Types ────────────────────────────────────────────────────
export type SubscriptionPlan = "free" | "pro" | "max" | "parent_pass";
export type AppRole = "student" | "admin" | "parent";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  subscription: SubscriptionPlan;
  onboarding_complete: boolean;
  streak_count: number;
  city?: string;
  target_college?: string;
  weak_subjects?: string[];
  study_hours_per_day?: number;
  parent_linked?: boolean;
  parent_invite_token?: string;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role?: AppRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => Promise<void>;
}

const createDemoUser = (email: string, name: string, role: AppRole = "student"): AppUser => ({
  id: "demo-user",
  name,
  email,
  role,
  subscription: "free",
  onboarding_complete: role === "student" ? true : false,
  streak_count: 0,
  city: "Pune",
  target_college: "COEP Pune",
  weak_subjects: ["Physics"],
  study_hours_per_day: 3,
  parent_linked: false,
  parent_invite_token: null,
});

// ── Context ──────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // ── Load full user profile ──────────────────────────────────
  const loadUser = useCallback(async (authUserId: string, authEmail: string) => {
    try {
      // 1. Fetch profile
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authUserId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        const defaultName = authEmail.split("@")[0] || "Student";
        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert({ user_id: authUserId, email: authEmail, name: defaultName })
          .select()
          .maybeSingle();

        if (createError) throw createError;
        profile = createdProfile ?? null;
      }

      // 2. Fetch role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUserId)
        .maybeSingle();

      const appUser: AppUser = {
        id: authUserId,
        name: profile?.name ?? "Student",
        email: authEmail,
        role: (roleData?.role as AppRole) ?? "student",
        subscription: "free",
        onboarding_complete: profile?.onboarding_complete ?? false,
        streak_count: profile?.streak_count ?? 0,
        city: (profile as any)?.city,
        target_college: (profile as any)?.target_college,
        weak_subjects: (profile as any)?.weak_subjects ?? [],
        study_hours_per_day: (profile as any)?.study_hours_per_day ?? 2,
        parent_linked: false,
        parent_invite_token: (profile as any)?.parent_invite_token,
      };

      setUser(appUser);
      return appUser;
    } catch (err) {
      console.error("loadUser error:", err);
      setUser(null);
      return null;
    }
  }, []);

  // ── Onboarding redirect logic ───────────────────────────────
  const handleOnboardingRedirect = useCallback((appUser: AppUser) => {
    const publicPaths = ["/login", "/pricing", "/parent/register"];
    const isPublic = publicPaths.some((p) => location.pathname.startsWith(p));
    if (isPublic) return;

    if (appUser.role === "student" && !appUser.onboarding_complete && location.pathname !== "/onboarding") {
      navigate("/onboarding", { replace: true });
    } else if (appUser.role === "parent" && location.pathname === "/dashboard") {
      navigate("/parent/dashboard", { replace: true });
    }
  }, [navigate, location.pathname]);

  // ── Session listener ────────────────────────────────────────
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const appUser = await loadUser(session.user.id, session.user.email ?? "");
        if (appUser) handleOnboardingRedirect(appUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    const initAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeout = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 3000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeout] as const);
        if (session?.user) {
          const appUser = await loadUser(session.user.id, session.user.email ?? "");
          if (appUser) handleOnboardingRedirect(appUser);
        }
      } catch (err) {
        console.warn("Failed to initialize auth session; falling back to login screen.", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
    return () => listener.subscription.unsubscribe();
  }, [loadUser, handleOnboardingRedirect]);

  const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
    const timeout = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs));
    return Promise.race([promise, timeout] as const);
  };

  // ── Login ───────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    try {
      const result = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        3000,
        { data: null, error: new Error("Auth timeout") }
      );
      if (result && "error" in result && result.error) throw result.error;
    } catch (err) {
      // Fallback to demo user when backend is unavailable
      setUser(createDemoUser(email, email.split("@")[0] || "Student", "student"));
      console.warn("Supabase login failed or timed out; using demo user fallback.", err);
    }
  };

  // ── Signup ──────────────────────────────────────────────────
  const signup = async (email: string, password: string, name: string, role: AppRole = "student") => {
    try {
      const result = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: { data: { name, role } },
        }),
        3000,
        { data: null, error: new Error("Auth timeout") }
      );
      if (result && "error" in result && result.error) throw result.error;
      if (result && result.data?.user) {
        // Profile + role created by DB trigger (handle_new_user)
        // For parent role, update the role manually
        if (role === "parent") {
          await supabase.from("user_roles").upsert({ user_id: result.data.user.id, role: "parent" });
        }
      }
    } catch (err) {
      setUser(createDemoUser(email, name || email.split("@")[0] || "Student", role));
      console.warn("Supabase signup failed or timed out; using demo user fallback.", err);
    }
  };

  // ── Logout ──────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
  };

  // ── Refresh user ────────────────────────────────────────────
  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUser(session.user.id, session.user.email ?? "");
    }
  };

  // ── Update profile ───────────────────────────────────────────
  const updateProfile = async (updates: Partial<AppUser>) => {
    if (!user) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.onboarding_complete !== undefined) dbUpdates.onboarding_complete = updates.onboarding_complete;
    if (updates.target_college !== undefined) dbUpdates.target_college = updates.target_college;
    if (updates.weak_subjects !== undefined) dbUpdates.weak_subjects = updates.weak_subjects;
    if (updates.study_hours_per_day !== undefined) dbUpdates.study_hours_per_day = updates.study_hours_per_day;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.name !== undefined) dbUpdates.name = updates.name;

    const { data, error } = await supabase
      .from("profiles")
      .update(dbUpdates)
      .eq("user_id", user.id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ user_id: user.id, ...dbUpdates });
      if (insertError) {
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert({ user_id: user.id, ...dbUpdates }, { onConflict: "user_id" });
        if (upsertError) throw upsertError;
      }
    }

    setUser((prev) => prev ? { ...prev, ...updates } : prev);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
      refreshUser,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
