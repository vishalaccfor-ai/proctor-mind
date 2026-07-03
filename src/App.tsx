import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ExamProvider } from "@/contexts/ExamContext";
import {AppLayout} from "@/components/AppLayout";

// ── Pages ────────────────────────────────────────────────────
import Login              from "@/pages/Login";
import Index              from "@/pages/Index";
import Dashboard          from "@/pages/Dashboard";
import ExamList           from "@/pages/ExamList";
import TakeExam           from "@/pages/TakeExam";
import Results            from "@/pages/Results";
import Analytics          from "@/pages/Analytics";
import ExamBuilder        from "@/pages/ExamBuilder";
import NotFound           from "@/pages/NotFound";

// ── New B2P Pages ────────────────────────────────────────────
import Onboarding         from "@/pages/Onboarding";
import ParentOnboarding   from "@/pages/ParentOnboarding";
import ParentDashboard    from "@/pages/ParentDashboard";
import Pricing            from "@/pages/Pricing";
import CollegePredictor   from "@/pages/CollegePredictor";
// import FlashMode          from "@/pages/FlashMode";
// import ChapterWarMap      from "@/pages/ChapterWarMap";

const queryClient = new QueryClient();

// ── Route Guards ──────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Onboarding guard — students must complete onboarding first
  if (
    user?.role === "student" &&
    !user?.onboarding_complete &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RequirePro({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.subscription === "free") {
    return <Navigate to="/pricing" replace />;
  }
  return <>{children}</>;
}

// ── App Shell ─────────────────────────────────────────────────
function AppShell() {
  return (
    <SidebarProvider>
      <ExamProvider>
        <Routes>
          {/* ── Public ── */}
          <Route path="/login"           element={<Login />} />
          <Route path="/pricing"         element={<Pricing />} />
          <Route path="/parent/register" element={<ParentOnboarding />} />

          {/* ── Onboarding (auth, no onboarding check) ── */}
          <Route path="/onboarding" element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          } />

          {/* ── Full exam (no layout chrome) ── */}
          <Route path="/exam/:examId" element={
            <RequireAuth>
              <TakeExam />
            </RequireAuth>
          } />

          {/* ── Parent dashboard (separate layout) ── */}
          <Route path="/parent/dashboard" element={
            <RequireAuth>
              <ParentDashboard />
            </RequireAuth>
          } />

          {/* ── Main app (with sidebar layout) ── */}
          <Route element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }>
            <Route path="/"                  element={<Index />} />
            <Route path="/dashboard"         element={<Dashboard />} />
            <Route path="/exams"             element={<ExamList />} />
            <Route path="/results"           element={<Results />} />
            <Route path="/results/:attemptId" element={<Results />} />
            <Route path="/analytics"         element={<Analytics />} />
            {/* <Route path="/flash"             element={<FlashMode />} /> */}
            {/* <Route path="/chapter-map"       element={<ChapterWarMap />} /> */}
            <Route path="/college-predictor" element={
              <RequirePro>
                <CollegePredictor />
              </RequirePro>
            } />
            <Route path="/admin/exam-builder" element={
              <RequireAdmin>
                <ExamBuilder />
              </RequireAdmin>
            } />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ExamProvider>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
          <Toaster richColors closeButton position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
