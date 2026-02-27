import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ExamProvider } from "@/contexts/ExamContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ExamList from "./pages/ExamList";
import TakeExam from "./pages/TakeExam";
import Results from "./pages/Results";
import Analytics from "./pages/Analytics";
import ExamBuilder from "./pages/ExamBuilder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ExamProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/exams" element={<ExamList />} />
                <Route path="/results" element={<Results />} />
                <Route path="/results/:attemptId" element={<Results />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/admin/exam-builder" element={<RequireAdmin><ExamBuilder /></RequireAdmin>} />
              </Route>
              <Route path="/exam/:examId" element={<RequireAuth><TakeExam /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ExamProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
