import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useExams } from "@/contexts/ExamContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareCard } from "@/components/ShareCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  ArrowLeft, CheckCircle, XCircle, MinusCircle, Clock, Brain, Share2, ChevronDown, ChevronUp,
} from "lucide-react";
import type { ExamResult } from "@/types/exam";

interface AIFeedback {
  question: string;
  subject: string;
  diagnosis: string;
  tip: string;
}

export default function Results() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { results, fetchResults } = useExams();
  const { user } = useAuth();

  const [result, setResult] = useState<ExamResult | null>(null);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  useEffect(() => {
    if (!results?.length) return;
    if (attemptId) {
      const found = results.find((r) => r.attemptId === attemptId);
      setResult(found ?? null);
    } else {
      setResult(results[0] ?? null);
    }
  }, [results, attemptId]);

  // ── Fetch AI debrief for worst 3 questions ────────────────
  useEffect(() => {
    if (!result || !result.questionResults) return;
    const isPro = user?.subscription === "pro" || user?.subscription === "max";
    const wrongQs = result.questionResults
      .filter((qr) => !qr.isCorrect && qr.selectedOptionId)
      .slice(0, isPro ? 3 : 1);
    if (wrongQs.length === 0) return;
    fetchAIFeedback(wrongQs);
  }, [result, user?.subscription]);

  const fetchAIFeedback = async (wrongQs: { questionId: string; selectedOptionId: string; correctOptionId: string }[]) => {
    setLoadingAI(true);
    try {
      const feedbacks: AIFeedback[] = [];
      for (const qr of wrongQs) {
        const { data, error } = await supabase.functions.invoke("generate-feedback", {
          body: {
            question_id: qr.questionId,
            selected_answer: qr.selectedOptionId,
            correct_answer: qr.correctOptionId,
          },
        });
        if (!error && data?.feedback) {
          feedbacks.push(data.feedback);
        }
      }
      setAiFeedback(feedbacks);
    } catch {
      // Silent fail — debrief is supplementary
    } finally {
      setLoadingAI(false);
    }
  };

  // ── Results list view ─────────────────────────────────────
  if (!attemptId && !result) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-black text-foreground">Your Results</h1>
        {results?.length === 0 ? (
          <Card className="border-border rounded-sm border-dashed">
            <CardContent className="flex flex-col items-center py-10">
              <div className="text-4xl mb-3">📊</div>
              <p className="font-bold text-foreground mb-1">No results yet</p>
              <p className="text-sm text-muted-foreground mb-4">Take your first exam to see results here.</p>
              <Button onClick={() => navigate("/exams")} className="bg-[#1c1917] text-white">
                Browse Exams →
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {results.map((r) => (
              <button
                key={r.attemptId}
                onClick={() => navigate(`/results/${r.attemptId}`)}
                className="w-full text-left border border-border bg-card hover:bg-muted/40 rounded-sm p-4 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-black ${
                    (r.percentage ?? 0) >= 75 ? "text-green-600" :
                    (r.percentage ?? 0) >= 50 ? "text-amber-600" : "text-[#e8341c]"
                  }`}>{r.percentage ?? 0}%</div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground text-sm">{r.examTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.correct}/{r.totalQuestions} correct · {new Date(r.submittedAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { percentage = 0, correct = 0, incorrect = 0, unattempted = 0, totalQuestions = 0 } = result;
  const grade =
    percentage >= 90 ? { label: "Exceptional", color: "text-green-600", bg: "bg-green-50" } :
    percentage >= 75 ? { label: "Excellent",    color: "text-green-600", bg: "bg-green-50" } :
    percentage >= 60 ? { label: "Good",          color: "text-amber-600", bg: "bg-amber-50" } :
    percentage >= 40 ? { label: "Average",        color: "text-amber-600", bg: "bg-amber-50" } :
                       { label: "Needs Work",     color: "text-[#e8341c]", bg: "bg-red-50"  };

  const barData = result.subjectResults?.map((sr) => ({
    name: sr.subject?.slice(0, 4) ?? "—",
    accuracy: Math.round(sr.percentage ?? 0),
  })) ?? [];

  const subjectResultsForShare = result.subjectResults?.map((sr) => ({
    subject: sr.subject ?? "",
    percentage: Math.round(sr.percentage ?? 0),
  })) ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* ── Back ── */}
      <button
        onClick={() => navigate("/results")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All Results
      </button>

      {/* ── Score hero ── */}
      <Card className="border-border rounded-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{result.examTitle}</p>
              <div className={`text-5xl font-black ${grade.color}`}>{percentage}%</div>
              <p className="text-sm text-muted-foreground mt-1">
                {result.totalScore} / {result.maxScore} marks ·{" "}
                {Math.round((result.timeTaken ?? 0) / 60)} min taken
              </p>
              <span className={`mt-2 inline-block text-xs font-bold px-2 py-1 rounded ${grade.bg} ${grade.color}`}>
                {grade.label}
              </span>
            </div>

            {/* Answer breakdown */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: CheckCircle, label: "Correct", value: correct, color: "text-green-600" },
                { icon: XCircle,     label: "Wrong",   value: incorrect, color: "text-[#e8341c]" },
                { icon: MinusCircle, label: "Skipped", value: unattempted, color: "text-muted-foreground" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                  <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── AI Debrief ── */}
      <Card className="border-border rounded-sm border-l-4 border-l-[#e8341c]">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#e8341c]" />
            <CardTitle className="text-base font-bold">AI Debrief</CardTitle>
            {user?.subscription === "free" && (
              <Badge variant="outline" className="ml-auto text-[10px] text-[#e8341c] border-[#e8341c]">
                Upgrade for full analysis
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {loadingAI && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Analysing your mistakes...
            </div>
          )}
          {!loadingAI && aiFeedback.length === 0 && correct === totalQuestions && (
            <p className="text-sm text-green-700 font-semibold">🎉 Perfect score! No mistakes to analyse.</p>
          )}
          {!loadingAI && aiFeedback.length === 0 && correct < totalQuestions && (
            <p className="text-sm text-muted-foreground">Submit a few exams to unlock AI diagnosis.</p>
          )}
          {!loadingAI && aiFeedback.length > 0 && (
            <div className="space-y-4">
              {aiFeedback.map((fb, i) => (
                <div key={i} className="border border-border rounded-sm p-4 space-y-1.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#e8341c] uppercase tracking-wider">{fb.subject}</span>
                    <span className="text-xs text-muted-foreground">→ Root cause</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{fb.question}</p>
                  <p className="text-sm text-muted-foreground">{fb.diagnosis}</p>
                  {fb.tip && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 rounded-sm">
                      <span className="text-blue-600 text-xs">💡</span>
                      <p className="text-xs text-blue-700">{fb.tip}</p>
                    </div>
                  )}
                </div>
              ))}
              {user?.subscription === "free" && (
                <div className="text-center pt-1">
                  <button
                    onClick={() => navigate("/pricing")}
                    className="text-xs font-bold text-[#e8341c] hover:underline"
                  >
                    Upgrade Pro to unlock analysis for all wrong answers →
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Subject breakdown chart ── */}
      {barData.length > 0 && (
        <Card className="border-border rounded-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Subject Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} barSize={40}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, "Accuracy"]} />
                <Bar dataKey="accuracy" radius={[3, 3, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.accuracy >= 75 ? "#22c55e" : entry.accuracy >= 50 ? "#e8c547" : "#e8341c"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Share card ── */}
      <Card className="border-border rounded-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowShare(!showShare)}
          >
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-bold">Share Your Score</CardTitle>
            </div>
            {showShare ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
        </CardHeader>
        {showShare && (
          <CardContent className="px-5 pb-5">
            <ShareCard
              studentName={user?.name ?? "Student"}
              score={result.totalScore ?? 0}
              maxScore={result.maxScore ?? 150}
              percentage={percentage}
              examTitle={result.examTitle}
              subjectResults={subjectResultsForShare}
              streak={user?.streak_count ?? 0}
            />
          </CardContent>
        )}
      </Card>

      {/* ── Question-by-question details ── */}
      {result.questionResults && result.questionResults.length > 0 && (
        <Card className="border-border rounded-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setShowDetails(!showDetails)}
            >
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Question Details
              </CardTitle>
              {showDetails ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
          </CardHeader>
          {showDetails && (
            <CardContent className="px-5 pb-5 space-y-3">
              {result.questionResults.slice(0, 20).map((qr, i) => (
                <div key={qr.questionId} className={`p-3 border rounded-sm ${
                  qr.isCorrect ? "border-green-200 bg-green-50/50" :
                  !qr.selectedOptionId ? "border-border bg-muted/30" :
                  "border-red-200 bg-red-50/50"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {qr.isCorrect
                        ? <CheckCircle className="w-4 h-4 text-green-600" />
                        : !qr.selectedOptionId
                          ? <MinusCircle className="w-4 h-4 text-muted-foreground" />
                          : <XCircle className="w-4 h-4 text-[#e8341c]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-0.5">Q{i + 1}.</p>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {Math.round((qr.timeSpent ?? 0) / 1)}s
                        </span>
                        {qr.selectedOptionId && !qr.isCorrect && (
                          <span className="text-[#e8341c]">Your ans: {qr.selectedOptionId}</span>
                        )}
                        {!qr.isCorrect && (
                          <span className="text-green-600">Correct: {qr.correctOptionId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* ── CTA ── */}
      <div className="flex gap-3 pb-6">
        <Button onClick={() => navigate("/exams")} className="flex-1 bg-[#1c1917] text-white hover:bg-[#1c1917]/90">
          Take Another Exam
        </Button>
        <Button onClick={() => navigate("/analytics")} variant="outline" className="flex-1">
          See Analytics
        </Button>
      </div>
    </div>
  );
}
