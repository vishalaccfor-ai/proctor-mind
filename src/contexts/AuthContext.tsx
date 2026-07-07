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

 
// ── Context ──────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // ── Load full user profile ──────────────────────────────────
// ── Load full user profile ──────────────────────────────────
const loadUser = useCallback(
  async (authUserId: string, authEmail: string) => {
    console.log("========== LOAD USER START ==========");
    console.log("User ID:", authUserId);
    console.log("Email:", authEmail);

    try {
      console.log("Reading profile...");

      const profilePromise = supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authUserId)
        .maybeSingle();

      const profileResult: any = await Promise.race([
        profilePromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("PROFILE QUERY TIMEOUT (5 sec)")),
            5000
          )
        ),
      ]);

      console.log("Profile query completed");
      console.log(profileResult);

      const profile = profileResult.data;
      const profileError = profileResult.error;

      if (profileError) {
        console.error("Profile Error:", profileError);
        throw profileError;
      }

      let finalProfile = profile;

      if (!finalProfile) {
        console.log("Profile not found. Creating profile...");

        const defaultName = authEmail.split("@")[0] || "Student";

        const createResult = await supabase
          .from("profiles")
          .insert({
            user_id: authUserId,
            email: authEmail,
            name: defaultName,
          })
          .select()
          .single();

        console.log("Create Profile Result:", createResult);

        if (createResult.error) {
          throw createResult.error;
        }

        finalProfile = createResult.data;
      }

      console.log("Reading user role...");

      const roleResult = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUserId)
        .maybeSingle();

      console.log("Role Result:", roleResult);

      const appUser: AppUser = {
        id: authUserId,
        name: finalProfile?.name ?? "Student",
        email: authEmail,
        role: (roleResult.data?.role as AppRole) ?? "student",
        subscription: "free",
        onboarding_complete:
          finalProfile?.onboarding_complete ?? false,
        streak_count: finalProfile?.streak_count ?? 0,
        city: finalProfile?.city,
        target_college: finalProfile?.target_college,
        weak_subjects: finalProfile?.weak_subjects ?? [],
        study_hours_per_day:
          finalProfile?.study_hours_per_day ?? 2,
        parent_linked: finalProfile?.parent_linked ?? false,
        parent_invite_token:
          finalProfile?.parent_invite_token,
      };

      console.log("App User Created:", appUser);

      setUser(appUser);

      console.log("========== LOAD USER END ==========");

      return appUser;
    } catch (err) {
      console.error("LOAD USER FAILED");
      console.error(err);

      setUser(null);

      return null;
    }
  },
  []
);
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
  let mounted = true;

  const initialize = async () => {
    try {
      console.log("========== INIT AUTH ==========");

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      console.log("Session:", session);
      console.log("Session Error:", error);

      if (!mounted) return;

      if (session?.user) {
        console.log("Loading existing user...");

        const appUser = await loadUser(
          session.user.id,
          session.user.email ?? ""
        );

        if (appUser && mounted) {
          handleOnboardingRedirect(appUser);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Init Auth Failed:", err);
      setUser(null);
    } finally {
      if (mounted) {
        setIsLoading(false);
      }
    }
  };

  initialize();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("========== AUTH EVENT ==========");
    console.log("Event:", event);
    console.log("Session:", session);

    if (!mounted) return;

    try {
      if (session?.user) {
        const appUser = await loadUser(
          session.user.id,
          session.user.email ?? ""
        );

        if (appUser && mounted) {
          handleOnboardingRedirect(appUser);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth Event Error:", err);
    } finally {
      if (mounted) {
        setIsLoading(false);
      }
    }
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, [loadUser, handleOnboardingRedirect]);

  const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
    const timeout = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs));
    return Promise.race([promise, timeout] as const);
  };

  // ── Login ───────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
  console.log("========== LOGIN START ==========");
  console.log("Email:", email);

  try {
    console.log("Calling signInWithPassword...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("signInWithPassword completed");
    console.log("Data:", data);
    console.log("Error:", error);

    if (error) {
      console.error("Login error:", error);
      throw error;
    }

    console.log("Login finished successfully");
    console.log("========== LOGIN END ==========");
  } catch (err) {
    console.error("Login exception:", err);
    throw err;
  }
};

  // ── Signup ──────────────────────────────────────────────────
  const signup = async (
  email: string, 
  password: string, 
  name: string, 
  role: AppRole = "student"
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });
  if (error) throw error;
  if (data?.user && role === "parent") {
    await supabase
      .from("user_roles")
      .upsert({ user_id: data.user.id, role: "parent" });
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
