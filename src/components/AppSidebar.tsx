import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, ClipboardList, BarChart2,
  Zap, Map, GraduationCap, Settings, LogOut,
  FlameIcon, CreditCard, Shield,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { StreakBadge } from "@/components/StreakBadge";
import { cn } from "@/lib/utils";

// ── MHT-CET exam date (update annually) ──────────────────────
const EXAM_DATE = new Date("2026-05-05");
function getDaysLeft() {
  const diff = Math.ceil((EXAM_DATE.getTime() - Date.now()) / 86400000);
  return diff > 0 ? diff : 0;
}

// ── Nav items ─────────────────────────────────────────────────
const studentNav = [
  { label: "Dashboard",        path: "/dashboard",         icon: LayoutDashboard },
  { label: "Practice Exams",   path: "/exams",             icon: BookOpen },
  { label: "Results",          path: "/results",           icon: ClipboardList },
  { label: "Analytics",        path: "/analytics",         icon: BarChart2 },
  { label: "College Predictor",path: "/college-predictor", icon: GraduationCap },
];

const adminNav = [
  { label: "Exam Builder",     path: "/admin/exam-builder", icon: Settings },
];

// ── Component ─────────────────────────────────────────────────
export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const daysLeft = getDaysLeft();
  const isPro = user?.subscription === "pro" || user?.subscription === "max";

  return (
    <Sidebar className="border-r border-border">
      {/* ── Header ── */}
      <SidebarHeader className="px-4 py-4 border-b border-border">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <div className="w-7 h-7 bg-[#1c1917] flex items-center justify-center text-[#e8c547] font-black text-sm flex-shrink-0">
            ⚡
          </div>
          <span className="font-black text-base text-foreground tracking-tight">
            Proctor Mind
          </span>
        </div>

        {/* Streak */}
        <div className="mt-3 flex items-center justify-between">
          <StreakBadge count={user?.streak_count ?? 0} size="sm" />
          {!isPro && (
            <NavLink to="/pricing">
              <span className="text-[10px] font-bold text-[#e8341c] hover:underline cursor-pointer">
                Upgrade →
              </span>
            </NavLink>
          )}
        </div>

        {/* Exam countdown */}
        <div className="mt-2 px-3 py-2 bg-muted/60 rounded-sm text-center">
          <div className="text-lg font-black text-foreground leading-none">{daysLeft}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">days to MHT-CET</div>
        </div>
      </SidebarHeader>

      {/* ── Content ── */}
      <SidebarContent className="py-2">
        {/* Student nav */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-4 py-2">
            Prepare
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studentNav.map((item) => {
                const isLocked = item.path === "/college-predictor" && !isPro;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={isLocked ? "/pricing" : item.path}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors w-full rounded-none",
                            isActive
                              ? "bg-[#1c1917] text-[#e8c547]"
                              : "text-foreground hover:bg-muted",
                            isLocked && "opacity-60"
                          )
                        }
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {isLocked && (
                          <span className="text-[9px] font-bold text-[#e8341c] bg-red-50 px-1.5 py-0.5 rounded">PRO</span>
                        )}
                        {item.path === "/flash" && (
                          <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">NEW</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin nav */}
        {user?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-4 py-2">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors w-full rounded-none",
                            isActive ? "bg-[#1c1917] text-[#e8c547]" : "text-foreground hover:bg-muted"
                          )
                        }
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="border-t border-border p-4 space-y-1">
        {/* User info */}
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="w-7 h-7 rounded-full bg-[#e8c547]/20 flex items-center justify-center text-sm font-black text-[#1c1917]">
            {user?.name?.[0]?.toUpperCase() ?? "S"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user?.subscription ?? "free"} plan</p>
          </div>
        </div>

        <NavLink to="/pricing">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-sm transition-colors">
            <CreditCard className="w-4 h-4" />
            <span>Plans & Billing</span>
          </button>
        </NavLink>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
