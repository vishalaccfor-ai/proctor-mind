import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Lock } from "lucide-react";

interface CollegeResult {
  college_name: string;
  city: string;
  branch: string;
  probability: number;
  gap_marks: number;
}

interface CollegePredictorWidgetProps {
  readinessScore?: number;
  className?: string;
}

export function CollegePredictorWidget({ readinessScore, className }: CollegePredictorWidgetProps) {
  const { user } = useAuth();
  const [results, setResults] = useState<CollegeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [gapToTarget, setGapToTarget] = useState<number | null>(null);
  const isPro = user?.subscription === "pro" || user?.subscription === "max";

  useEffect(() => {
    if (!isPro || !readinessScore) return;
    fetchPrediction();
  }, [readinessScore, isPro]);

  const fetchPrediction = async () => {
    if (!readinessScore) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("college-predictor", {
        body: {
          readiness_score: readinessScore,
          branch: "Computer Engineering",
          city: user?.city ?? "Any",
          target_college: user?.target_college ?? "",
        },
      });
      if (error) throw error;
      setResults(data?.colleges?.slice(0, 3) ?? []);
      setGapToTarget(data?.gap_to_target ?? null);
    } catch {
      // Silently fail — widget is supplementary
    } finally {
      setLoading(false);
    }
  };

  // Free user — blur overlay
  if (!isPro) {
    return (
      <div className={`border border-border bg-card rounded-sm overflow-hidden relative ${className}`}>
        <div className="p-4 filter blur-sm pointer-events-none select-none">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">College Chances</p>
          <div className="space-y-2">
            {["COEP Pune CS — 82%", "VJTI Mumbai CS — 45%", "MIT Pune CS — 91%"].map((c) => (
              <div key={c} className="flex justify-between text-sm">
                <span>{c.split(" — ")[0]}</span>
                <span className="font-bold text-green-600">{c.split(" — ")[1]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Lock className="w-5 h-5 text-muted-foreground mb-2" />
          <p className="text-sm font-semibold text-foreground">Pro Feature</p>
          <NavLink to="/pricing">
            <button className="mt-2 text-xs font-bold text-[#e8341c] hover:underline">
              Upgrade to unlock →
            </button>
          </NavLink>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`border border-border bg-card rounded-sm p-4 ${className}`}>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">College Chances</p>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-border bg-card rounded-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">College Chances</p>
        <NavLink to="/college-predictor" className="text-xs text-primary hover:underline flex items-center gap-0.5">
          Full list <ArrowRight className="w-3 h-3" />
        </NavLink>
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground">Complete a mock exam to see predictions.</p>
      ) : (
        <div className="space-y-2.5">
          {results.map((r) => (
            <div key={r.college_name + r.branch} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{r.college_name}</p>
                <p className="text-xs text-muted-foreground">{r.branch}</p>
              </div>
              <div className={`ml-3 text-sm font-black flex-shrink-0 ${
                r.probability >= 75 ? "text-green-600" :
                r.probability >= 50 ? "text-amber-600" : "text-red-500"
              }`}>
                {r.probability}%
              </div>
            </div>
          ))}
        </div>
      )}

      {gapToTarget !== null && user?.target_college && (
        <div className={`mt-3 pt-3 border-t border-border text-xs ${gapToTarget <= 0 ? "text-green-700" : "text-amber-700"}`}>
          {gapToTarget <= 0
            ? `✓ You're on track for ${user.target_college}`
            : `Need +${gapToTarget} marks for ${user.target_college}`}
        </div>
      )}
    </div>
  );
}
