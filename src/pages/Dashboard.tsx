import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useExams } from "@/contexts/ExamContext";
import { supabase } from "@/integrations/supabase/client";
import { sampleExams } from "@/data/sampleExams";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StreakBadge } from "@/components/StreakBadge";
import { ParentCTA } from "@/components/ParentCTA";
import { CollegePredictorWidget } from "@/components/CollegePredictorWidget";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { BookOpen, Target, TrendingUp, Clock, Zap, ChevronRight, AlertCircle } from "lucide-react";

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];
const SUBJECT_ICONS: Record<string, string> = {
  Physics: "⚛️", Chemistry: "🧪", Mathematics: "📐", Biology: "🧬",
};

// MHT-CET exam date
const EXAM_DATE = new Date("2026-05-05");
function getDaysLeft() {
  return Math.max(0, Math.ceil((EXAM_DATE.getTime() - Date.now()) / 86400000));
}

// ── QOTD (Question of the Day) ────────────────────────────────
interface QOTD {
  text: string;
  subject: string;
  options: { id: string; text: string }[];
  correct_option_id: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { results, fetchResults } = useExams();
  const navigate = useNavigate();

  const [qotd, setQotd] = useState<QOTD | null>(null);
  const [qotdAnswer, setQotdAnswer] = useState<string | null>(null);
  const [readinessScore, setReadinessScore] = useState(0);

  useEffect(() => { fetchResults(); }, [fetchResults]);
  useEffect(() => { fetchQOTD(); calcReadiness(); }, [results]);

  // ── Fetch QOTD ─────────────────────────────────────────────
  const fetchQOTD = async () => {
    const weakSub = user?.weak_subjects?.[0] ?? "Physics";
    try {
      const { data } = await supabase
        .from("questions")
        .select("id, text, options, correct_option_id, subject_id")
        .eq("difficulty", "medium")
        .limit(50);
      if (data && data.length > 0) {
        const dayIndex = new Date().getDate() % data.length;
        const q = data[dayIndex];
        setQotd({
          text: q.text,
          subject: weakSub,
          options: q.options as { id: string; text: string }[],
          correct_option_id: q.correct_option_id,
        });
        return;
      }
    } catch (err) {
      console.warn("Could not load QOTD from backend.", err);
    }

    const fallbackQ = sampleExams[0]?.questions?.[0];
    if (fallbackQ) {
      setQotd({
        text: fallbackQ.text,
        subject: weakSub,
        options: fallbackQ.options,
        correct_option_id: fallbackQ.correctOptionId,
      });
    }
  };

  // ── Calculate readiness score ──────────────────────────────
  const calcReadiness = () => {
    if (!results || results.length === 0) { setReadinessScore(0); return; }
    const recent = results.slice(0, 5);
    const avg = recent.reduce((s, r) => s + (r.percentage ?? 0), 0) / recent.length;
    setReadinessScore(Math.round(avg));
  };

  // ── Stats ──────────────────────────────────────────────────
  const totalAttempts = results?.length ?? 0;
  const avgScore = totalAttempts > 0
    ? Math.round(results.reduce((s, r) => s + (r.percentage ?? 0), 0) / totalAttempts)
    : 0;
  const bestScore = totalAttempts > 0 ? Math.max(...results.map((r) => r.percentage ?? 0)) : 0;

  // ── Subject accuracy data ──────────────────────────────────
  const subjectData = SUBJECTS.map((sub) => {
    const subResults = results?.flatMap((r) =>
      (r.subjectResults ?? []).filter((sr: { subject: string; percentage: number }) =>
        sr.subject?.toLowerCase().includes(sub.toLowerCase())
      )
    ) ?? [];
    const acc = subResults.length > 0
      ? Math.round(subResults.reduce((s: number, sr: { percentage: number }) => s + sr.percentage, 0) / subResults.length)
      : 0;
    const isWeak = user?.weak_subjects?.includes(sub);
    return { subject: sub, accuracy: acc, isWeak };
  });

  // ── Radar data ─────────────────────────────────────────────
  const radarData = subjectData.map((s) => ({ subject: s.subject.slice(0, 4), score: s.accuracy }));

  // ── Readiness ring ─────────────────────────────────────────
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (readinessScore / 100) * circumference;
  const readinessColor = readinessScore >= 75 ? "#22c55e" : readinessScore >= 50 ? "#e8c547" : "#e8341c";
  const readinessLabel = readinessScore >= 75 ? "On Track" : readinessScore >= 50 ? "Getting There" : "Needs Work";

  const daysLeft = getDaysLeft();

  return (
    <div className="space-y-5 p-6 max-w-6xl mx-auto">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">
            Hey {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {daysLeft > 0
              ? `MHT-CET in ${daysLeft} days — let's make every session count`
              : "MHT-CET exam day! You've got this."}
          </p>
        </div>
        <StreakBadge count={user?.streak_count ?? 0} size="lg" />
      </div>

      {/* ── Parent CTA ─────────────────────────────────────── */}
      <ParentCTA />

      {/* ── Top row: Readiness ring + stats ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Readiness ring */}
        <Card className="border-border rounded-sm md:col-span-1">
          <CardContent className="p-5 flex flex-col items-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Readiness</p>
            <svg width={130} height={130} viewBox="0 0 130 130">
              <circle cx={65} cy={65} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={10} />
              <circle
                cx={65} cy={65} r={radius} fill="none"
                stroke={readinessColor} strokeWidth={10}
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 65 65)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
              <text x="65" y="62" textAnchor="middle" fontSize="22" fontWeight="900" fill="currentColor">
                {readinessScore}
              </text>
              <text x="65" y="78" textAnchor="middle" fontSize="10" fill={readinessColor} fontWeight="600">
                {readinessLabel}
              </text>
            </svg>
            <p className="text-xs text-muted-foreground text-center mt-1">
              {readinessScore < 50
                ? "Focus on weak chapters daily"
                : "Keep your streak going!"}
            </p>
          </CardContent>
        </Card>

        {/* Stat cards */}
        {[
          { label: "Exams Taken", value: totalAttempts, icon: BookOpen, sub: "total attempts" },
          { label: "Avg Score", value: `${avgScore}%`, icon: TrendingUp, sub: "last 5 exams" },
          { label: "Best Score", value: `${bestScore}%`, icon: Target, sub: "all time" },
        ].map((s) => (
          <Card key={s.label} className="border-border rounded-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-muted rounded-sm">
                  <s.icon className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="text-2xl font-black text-foreground">{s.value}</div>
              <div className="text-xs font-semibold text-foreground mt-0.5">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Middle row: Subject bars + Radar + College widget ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Subject accuracy bars */}
        <Card className="border-border rounded-sm md:col-span-1">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Subject Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {subjectData.map((s) => (
              <div key={s.subject}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{SUBJECT_ICONS[s.subject]}</span>
                    <span className="text-sm font-semibold text-foreground">{s.subject}</span>
                    {s.isWeak && (
                      <AlertCircle className="w-3 h-3 text-[#e8341c]" />
                    )}
                  </div>
                  <span className={`text-sm font-black ${
                    s.accuracy >= 75 ? "text-green-600" :
                    s.accuracy >= 50 ? "text-amber-600" : "text-[#e8341c]"
                  }`}>{s.accuracy}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${s.accuracy}%`,
                      background: s.accuracy >= 75 ? "#22c55e" : s.accuracy >= 50 ? "#e8c547" : "#e8341c"
                    }}
                  />
                </div>
              </div>
            ))}
            {totalAttempts === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Take your first exam to see accuracy data
              </p>
            )}
          </CardContent>
        </Card>

        {/* Radar chart */}
        <Card className="border-border rounded-sm md:col-span-1">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Skill Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Radar dataKey="score" stroke="#e8c547" fill="#e8c547" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* College predictor widget */}
        <CollegePredictorWidget readinessScore={readinessScore} className="md:col-span-1" />
      </div>

      {/* ── QOTD ────────────────────────────────────────────── */}
      {qotd && (
        <Card className="border-border rounded-sm border-l-4 border-l-[#e8c547]">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <CardTitle className="text-sm font-bold">Question of the Day</CardTitle>
              <Badge variant="outline" className="text-[10px] ml-auto">{qotd.subject}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-sm font-medium text-foreground mb-3">{qotd.text}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {qotd.options.map((opt) => {
                const isSelected = qotdAnswer === opt.id;
                const isCorrect = opt.id === qotd.correct_option_id;
                const showResult = qotdAnswer !== null;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { if (!qotdAnswer) setQotdAnswer(opt.id); }}
                    disabled={!!qotdAnswer}
                    className={`
                      text-left px-3 py-2.5 border rounded-sm text-sm transition-all
                      ${!showResult && "hover:border-foreground/40 hover:bg-muted/50"}
                      ${showResult && isCorrect && "border-green-500 bg-green-50 text-green-800 font-semibold"}
                      ${showResult && isSelected && !isCorrect && "border-red-400 bg-red-50 text-red-800"}
                      ${!showResult && "border-border bg-background text-foreground"}
                      ${!showResult && isSelected && "border-primary bg-primary/5"}
                    `}
                  >
                    <span className="font-semibold mr-1.5">{opt.id}.</span>{opt.text}
                  </button>
                );
              })}
            </div>
            {qotdAnswer && (
              <p className={`mt-3 text-sm font-semibold ${qotdAnswer === qotd.correct_option_id ? "text-green-700" : "text-red-600"}`}>
                {qotdAnswer === qotd.correct_option_id ? "✅ Correct! Great recall." : `❌ Correct answer: ${qotd.correct_option_id}`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Quick actions ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Practice Exams", sub: "Full mocks", icon: "📝", path: "/exams", color: "#22c55e" },
          { label: "Analytics", sub: "Deep dive", icon: "📊", path: "/analytics", color: "#8b5cf6" },
          { label: "College Predictor", sub: "Target your best fit", icon: "🎓", path: "/college-predictor", color: "#f59e0b" },
          { label: "My Results", sub: "Review scorecards", icon: "📋", path: "/results", color: "#3b82f6" },
        ].map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className="text-left border border-border bg-card hover:bg-muted/50 rounded-sm p-4 transition-colors group"
          >
            <div className="text-2xl mb-2">{a.icon}</div>
            <div className="text-sm font-bold text-foreground">{a.label}</div>
            <div className="text-xs text-muted-foreground">{a.sub}</div>
            <ChevronRight className="w-3 h-3 mt-2 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>
        ))}
      </div>

      {/* ── Recent results ───────────────────────────────────── */}
      {totalAttempts > 0 && (
        <Card className="border-border rounded-sm">
          <CardHeader className="pb-2 pt-4 px-5 flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Recent Results
            </CardTitle>
            <button
              onClick={() => navigate("/results")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </button>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="space-y-2">
              {results.slice(0, 4).map((r) => (
                <div
                  key={r.attemptId}
                  onClick={() => navigate(`/results/${r.attemptId}`)}
                  className="flex items-center gap-4 py-2.5 px-3 hover:bg-muted/40 rounded-sm cursor-pointer transition-colors border border-transparent hover:border-border"
                >
                  <div className={`w-10 text-center font-black text-sm ${
                    (r.percentage ?? 0) >= 75 ? "text-green-600" :
                    (r.percentage ?? 0) >= 50 ? "text-amber-600" : "text-[#e8341c]"
                  }`}>
                    {r.percentage ?? 0}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{r.examTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.correct}/{r.totalQuestions} correct · {new Date(r.submittedAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.round((r.timeTaken ?? 0) / 60)}m
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {totalAttempts === 0 && (
        <Card className="border-border rounded-sm border-dashed">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-bold text-foreground mb-1">Take your first exam</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Start with a chapter-wise test on your weakest subject. AI will tell you exactly what's going wrong.
            </p>
            <button
              onClick={() => navigate("/exams")}
              className="px-5 py-2.5 bg-[#1c1917] text-white text-sm font-bold rounded-sm hover:bg-[#1c1917]/90 transition-colors"
            >
              Browse Exams →
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
