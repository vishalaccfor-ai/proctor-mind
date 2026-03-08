#!/bin/bash
# ================================================================
# PROCTOR MIND — Fix remaining files + push (Windows compatible)
# Run from repo root: bash fix-and-push.sh
# ================================================================

set -e

echo ""
echo "🧠 PROCTOR MIND — Fixing remaining files..."
echo "============================================"
echo ""

# ── package.json (pure bash, no node needed) ──────────────────
# We write it directly instead of using node -e
cat > package.json << 'EOF'
{
  "name": "proctor-mind",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-aspect-ratio": "^1.1.7",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-context-menu": "^2.2.15",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-hover-card": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-menubar": "^1.1.15",
    "@radix-ui/react-navigation-menu": "^1.2.13",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.7",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-toggle": "^1.1.9",
    "@radix-ui/react-toggle-group": "^1.1.10",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@supabase/supabase-js": "^2.98.0",
    "@tanstack/react-query": "^5.83.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.6.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.462.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.61.1",
    "react-resizable-panels": "^2.1.9",
    "react-router-dom": "^6.30.1",
    "recharts": "^2.15.4",
    "sonner": "^1.7.4",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.9",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@eslint/js": "^9.32.0",
    "@tailwindcss/typography": "^0.5.16",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^22.16.5",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react-swc": "^3.11.0",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.32.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^15.15.0",
    "jsdom": "^20.0.3",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.38.0",
    "vite": "^5.4.19",
    "vitest": "^3.2.4"
  }
}
EOF
echo "✅ package.json  (lovable-tagger removed, name = proctor-mind)"

# ── Delete .lovable folder ─────────────────────────────────────
if [ -d ".lovable" ]; then
  rm -rf .lovable
  echo "✅ .lovable/ folder deleted"
else
  echo "ℹ️  .lovable/ already gone"
fi

# ── src/pages/Index.tsx ───────────────────────────────────────
cat > src/pages/Index.tsx << 'EOF'
import { Navigate } from "react-router-dom";

const Index = () => {
  return <Navigate to="/dashboard" replace />;
};

export default Index;
EOF
echo "✅ src/pages/Index.tsx"

# ── src/pages/Login.tsx ───────────────────────────────────────
cat > src/pages/Login.tsx << 'EOF'
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { isAuthenticated, isLoading, login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signup(email, password, name);
        toast.success("Account created! You can now sign in.");
        setIsSignUp(false);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Proctor Mind</CardTitle>
          <CardDescription>MHT-CET AI Exam Preparation</CardDescription>
          <p className="text-xs text-muted-foreground">
            {isSignUp ? "Create your account to get started" : "Sign in to continue your preparation"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
EOF
echo "✅ src/pages/Login.tsx  (Proctor Mind + Brain icon)"

# ── src/components/AppSidebar.tsx ─────────────────────────────
cat > src/components/AppSidebar.tsx << 'EOF'
import { LayoutDashboard, BookOpen, PenTool, BarChart3, LogOut, Brain } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const studentItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Available Exams", url: "/exams", icon: BookOpen },
  { title: "My Results", url: "/results", icon: BarChart3 },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const adminItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Exam Builder", url: "/admin/exam-builder", icon: PenTool },
  { title: "All Exams", url: "/exams", icon: BookOpen },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, logout } = useAuth();

  const items = user?.role === "admin" ? adminItems : studentItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-tight">Proctor Mind</span>
              <span className="text-xs text-muted-foreground leading-tight">MHT-CET AI Prep</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        {!collapsed && user && (
          <div className="px-2 py-1 mb-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => logout()}>
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
EOF
echo "✅ src/components/AppSidebar.tsx  (Proctor Mind + Brain icon)"

# ── src/integrations/supabase/client.ts ───────────────────────
cat > src/integrations/supabase/client.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
EOF
echo "✅ src/integrations/supabase/client.ts"

# ── .env in .gitignore ────────────────────────────────────────
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
  echo ".env" >> .gitignore
  echo "✅ .env added to .gitignore"
else
  echo "ℹ️  .env already in .gitignore"
fi

# ── .github/copilot-instructions.md placeholder ───────────────
mkdir -p .github
if [ ! -f ".github/copilot-instructions.md" ]; then
  echo "# Proctor Mind — VS Code Agent Instructions" > .github/copilot-instructions.md
  echo "# Replace this with the full agent prompt from proctor-mind-vscode-agent.md" >> .github/copilot-instructions.md
  echo "✅ .github/copilot-instructions.md created (add your agent prompt here)"
fi

# ── Summary of all changes ────────────────────────────────────
echo ""
echo "============================================"
echo "✅ ALL FILES UPDATED — running git status..."
echo "============================================"
echo ""
git status

# ── git add + commit + push ───────────────────────────────────
echo ""
echo "📤 Committing and pushing..."
echo ""

git add -A

git commit -m "chore: remove all Lovable references, rebrand to Proctor Mind

- README.md: rewritten with Proctor Mind branding and setup docs
- index.html: updated title, meta, OG tags (removed lovable.dev URLs)
- vite.config.ts: removed componentTagger import from lovable-tagger
- package.json: removed lovable-tagger devDependency, renamed to proctor-mind v1.0.0
- .lovable/: deleted entire folder
- src/pages/Index.tsx: removed placeholder, redirects to /dashboard
- src/pages/Login.tsx: ExamPro -> Proctor Mind, GraduationCap -> Brain icon
- src/components/AppSidebar.tsx: ExamPro -> Proctor Mind, Brain icon + subtitle
- src/integrations/supabase/client.ts: removed auto-generated Lovable comment
- .github/copilot-instructions.md: VS Code agent prompt placeholder added"

git push origin main

echo ""
echo "================================================"
echo "🎉  DONE! Repo is clean and pushed to GitHub!"
echo "================================================"
echo ""
echo "  🔗  https://github.com/vishalaccfor-ai/proctor-mind"
echo ""
echo "  Next steps:"
echo "  1. npm install          install fresh deps (no lovable-tagger)"
echo "  2. npm run dev          start dev server on :8080"
echo "  3. Supabase SQL Editor  run supabase/migrations/*.sql"
echo "  4. Vercel               connect repo and deploy"
echo ""
