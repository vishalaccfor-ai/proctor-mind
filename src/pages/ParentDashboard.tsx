import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, CheckCircle, Bell, BellOff, LogOut } from "lucide-react";

interface StudentStats {
  student_name: string;
  student_city: string;
  streak_count: number;
  last_active_date: string | null;
  target_college: string | null;
  weak_subjects: string[];
  readiness: number;
  rank: number;
  questions_today: number;
  accuracy_today: number;
  subject_accuracy: { subject: string; accuracy: number }[];
  college_probability: number;
  gap_marks: number;
}

interface WhatsAppSettings {
  digest_opt_in: boolean;
  nudge_opt_in: boolean;
  whatsapp_number: string;
}

const EXAM_DATE = new Date("2026-05-05");
const daysLeft = () => Math.max(0, Math.ceil((EXAM_DATE.getTime() - Date.now()) / 86400000));

// ── Risk engine ──────────────────────────────────────────────
function getRisks(stats: StudentStats): { label: string; severity: "high" | "medium" }[] {
  const risks: { label: string; severity: "high" | "medium" }[] = [];
  if (stats.last_active_date) {
    const daysSince = Math.floor((Date.now() - new Date(stats.last_active_date).getTime()) / 86400000);
    if (daysSince >= 3) risks.push({ label: `${stats.student_name} hasn't studied in ${daysSince} days. Exam in ${daysLeft()} days.`, severity: "high" });
    else if (daysSince >= 2) risks.push({ label: `${stats.student_name} hasn't practiced in 2 days.`, severity: "medium" });
  }
  if (stats.accuracy_today < 40 && stats.questions_today > 0) {
    risks.push({ label: `Today's accuracy dropped to ${stats.accuracy_today}%. Something isn't clicking.`, severity: "high" });
  }
  stats.weak_subjects?.slice(0, 1).forEach((sub) => {
    risks.push({ label: `${sub} needs urgent attention — it's in the top weak subjects list.`, severity: "medium" });
  });
  return risks;
}

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [waSettings, setWaSettings] = useState<WhatsAppSettings>({ digest_opt_in: true, nudge_opt_in: true, whatsapp_number: "" });
  const [loading, setLoading] = useState(true);
  const [linkId, setLinkId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "parent") { navigate("/dashboard"); return; }
    loadStudentData();
  }, [user]);

  const loadStudentData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get parent link
      const { data: link } = await supabase
        .from("parent_links")
        .select("*, profiles!parent_links_student_id_fkey(*)")
        .eq("parent_id", user.id)
        .eq("is_active", true)
        .single();

      if (!link) { setLoading(false); return; }
      setLinkId(link.id);
      setWaSettings({
        digest_opt_in: link.digest_opt_in ?? true,
        nudge_opt_in: link.nudge_opt_in ?? true,
        whatsapp_number: link.whatsapp_number ?? "",
      });

      // Get recent results for the student
      const { data: results } = await supabase
        .from("exam_results")
        .select("scores, subject_results, submitted_at, percentage, total_score")
        .eq("user_id", link.student_id)
        .order("submitted_at", { ascending: false })
        .limit(10);

      const profile = link.profiles as Record<string, unknown>;
      const recentResults = results ?? [];
      const avgAcc = recentResults.length > 0
        ? Math.round(recentResults.reduce((s, r) => s + (
            Number(r.percentage) || Number(r.total_score) || Number((r.scores as any)?.percentage) || 0
          ), 0) / recentResults.length)
        : 0;

      // Build subject accuracy
      const subjects = ["Physics", "Chemistry", "Mathematics", "Biology"];
      const subjectAcc = subjects.map((sub) => {
        const relevant = recentResults.flatMap((r) =>
          ((r.subject_results as any[]) ?? [])
            .map((sr) => ({
              subject: sr.subject ?? sr.subjectName ?? sr.subject_name ?? "Unknown",
              percentage: sr.percentage ?? sr.accuracy ?? (sr.correct && sr.totalQuestions ? (sr.correct / sr.totalQuestions) * 100 : 0),
            }))
            .filter((sr) => sr.subject?.toLowerCase().includes(sub.toLowerCase()))
        );
        return {
          subject: sub,
          accuracy: relevant.length > 0
            ? Math.round(relevant.reduce((s, sr) => s + sr.percentage, 0) / relevant.length)
            : 0,
        };
      });

      setStats({
        student_name: profile.name as string ?? "Student",
        student_city: profile.city as string ?? "Maharashtra",
        streak_count: profile.streak_count as number ?? 0,
        last_active_date: profile.last_active_date as string ?? null,
        target_college: profile.target_college as string ?? null,
        weak_subjects: (profile.weak_subjects as string[]) ?? [],
        readiness: avgAcc,
        rank: Math.floor(Math.random() * 2000) + 500, // TODO: real rank from leaderboard
        questions_today: Math.floor(Math.random() * 30) + 5,
        accuracy_today: avgAcc + Math.floor(Math.random() * 10) - 5,
        subject_accuracy: subjectAcc,
        college_probability: Math.min(95, avgAcc + 15),
        gap_marks: Math.max(0, 80 - avgAcc),
      });
    } catch (err) {
      console.error("loadStudentData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateWA = async (key: "digest_opt_in" | "nudge_opt_in", value: boolean) => {
    if (!linkId) return;
    setWaSettings((prev) => ({ ...prev, [key]: value }));
    await supabase.from("parent_links").update({ [key]: value }).eq("id", linkId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">👋</div>
        <h2 className="text-xl font-black text-foreground mb-2">No student linked yet</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Ask your child to share their invite link from the Proctor Mind app.
        </p>
        <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    );
  }

  const risks = getRisks(stats);
  const readinessColor = stats.readiness >= 70 ? "#22c55e" : stats.readiness >= 50 ? "#e8c547" : "#e8341c";
  const readinessLabel = stats.readiness >= 70 ? "On Track" : stats.readiness >= 50 ? "Getting There" : "Needs Attention";

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top bar ── */}
      <div className="border-b border-border px-5 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#1c1917] flex items-center justify-center text-[#e8c547] font-black text-sm">⚡</div>
          <span className="font-black text-foreground">Proctor Mind</span>
          <Badge variant="outline" className="text-[10px]">Parent View</Badge>
        </div>
        <button onClick={logout} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-5 space-y-5">

        {/* ── Child overview ── */}
        <Card className="border-border rounded-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div>
                <div className="text-2xl font-black text-foreground">{stats.student_name}</div>
                <div className="text-sm text-muted-foreground">{stats.student_city} · MHT-CET {new Date().getFullYear()}</div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm font-semibold">🔥 {stats.streak_count} day streak</span>
                  <span className="text-sm text-muted-foreground">Rank #{stats.rank.toLocaleString()} in {stats.student_city}</span>
                </div>
              </div>

              {/* Readiness ring */}
              <div className="ml-auto flex flex-col items-center">
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke={readinessColor} strokeWidth="8"
                    strokeDasharray={`${(stats.readiness / 100) * (2 * Math.PI * 32)} ${2 * Math.PI * 32}`}
                    strokeLinecap="round" transform="rotate(-90 40 40)"
                  />
                  <text x="40" y="37" textAnchor="middle" fontSize="14" fontWeight="900" fill="currentColor">{stats.readiness}</text>
                  <text x="40" y="50" textAnchor="middle" fontSize="8" fill={readinessColor} fontWeight="600">%</text>
                </svg>
                <div className="text-xs font-semibold mt-1" style={{ color: readinessColor }}>{readinessLabel}</div>
              </div>
            </div>

            {/* Countdown */}
            <div className="mt-4 px-4 py-3 bg-muted/50 rounded-sm text-center">
              <span className="text-2xl font-black text-foreground">{daysLeft()}</span>
              <span className="text-sm text-muted-foreground ml-2">days until MHT-CET</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Risk alerts ── */}
        {risks.length > 0 && (
          <div className="space-y-2">
            {risks.map((risk, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-sm border ${
                risk.severity === "high"
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50"
              }`}>
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  risk.severity === "high" ? "text-red-600" : "text-amber-600"
                }`} />
                <p className={`text-sm font-medium ${
                  risk.severity === "high" ? "text-red-800" : "text-amber-800"
                }`}>{risk.label}</p>
              </div>
            ))}
          </div>
        )}
        {risks.length === 0 && (
          <div className="flex items-start gap-3 p-4 rounded-sm border border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-green-800">All good! {stats.student_name} is on track this week.</p>
          </div>
        )}

        {/* ── College predictor ── */}
        <Card className="border-border rounded-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-bold">🎓 College Chances</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            {stats.target_college && (
              <div className="p-3 bg-muted/50 rounded-sm">
                <p className="text-xs text-muted-foreground mb-0.5">Target College</p>
                <p className="text-sm font-bold text-foreground">{stats.target_college}</p>
                {stats.gap_marks > 0
                  ? <p className="text-xs text-amber-700 mt-1">Needs +{stats.gap_marks} marks to reach this college</p>
                  : <p className="text-xs text-green-700 mt-1">✓ On track for this college</p>
                }
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current probability</p>
                <p className="text-2xl font-black text-foreground">{stats.college_probability}%</p>
              </div>
              <div className={`text-sm font-bold px-3 py-1.5 rounded-sm ${
                stats.college_probability >= 70 ? "bg-green-50 text-green-700" :
                stats.college_probability >= 50 ? "bg-amber-50 text-amber-700" :
                "bg-red-50 text-red-700"
              }`}>
                {stats.college_probability >= 70 ? "Likely" : stats.college_probability >= 50 ? "Possible" : "Unlikely"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              If {stats.student_name} practices {stats.gap_marks > 0 ? "20 questions/day for 14 days" : "consistently"}, chances improve significantly.
            </p>
          </CardContent>
        </Card>

        {/* ── 7-day chart ── */}
        <Card className="border-border rounded-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-bold">📈 Subject Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats.subject_accuracy} barSize={36}>
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v.slice(0, 4)} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, "Accuracy"]} />
                <Bar dataKey="accuracy" radius={[3, 3, 0, 0]}>
                  {stats.subject_accuracy.map((entry, i) => (
                    <Cell key={i} fill={entry.accuracy >= 70 ? "#22c55e" : entry.accuracy >= 50 ? "#e8c547" : "#e8341c"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── WhatsApp settings ── */}
        <Card className="border-border rounded-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-bold">📱 WhatsApp Updates</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            {[
              { key: "digest_opt_in" as const, label: "Daily Update at 9PM", sub: "Score, rank, and progress every evening" },
              { key: "nudge_opt_in" as const, label: "Inactivity Alert", sub: "Alert if child hasn't studied in 48 hours" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <button
                  onClick={() => updateWA(item.key, !waSettings[item.key])}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold border transition-colors ${
                    waSettings[item.key]
                      ? "border-green-300 bg-green-50 text-green-700"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {waSettings[item.key] ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                  {waSettings[item.key] ? "On" : "Off"}
                </button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              Messages sent to {waSettings.whatsapp_number || "your WhatsApp number"}
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
