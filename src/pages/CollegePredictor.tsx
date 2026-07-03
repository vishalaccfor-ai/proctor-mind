import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Share2, ArrowLeft, Filter } from "lucide-react";
import { toast } from "sonner";

interface CollegeResult {
  college_name: string;
  city: string;
  branch: string;
  probability: number;
  gap_marks: number;
  cutoff_2024: number;
  type: string;
}

const BRANCHES = ["Computer Engineering", "Electronics Engineering", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering"];
const CITIES   = ["Any", "Pune", "Mumbai", "Nashik", "Nagpur", "Aurangabad", "Sangli"];
const TYPES    = ["Any", "government", "aided", "private"];

const FALLBACK_COLLEGES: CollegeResult[] = [
  { college_name: "COEP Pune", city: "Pune", branch: "Computer Engineering", probability: 82, gap_marks: -4, cutoff_2024: 210, type: "government" },
  { college_name: "VJTI Mumbai", city: "Mumbai", branch: "Computer Engineering", probability: 58, gap_marks: 12, cutoff_2024: 195, type: "government" },
  { college_name: "PICT Pune", city: "Pune", branch: "Computer Engineering", probability: 45, gap_marks: 24, cutoff_2024: 180, type: "private" },
];

export default function CollegePredictor() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [branch, setBranch] = useState("Computer Engineering");
  const [city, setCity] = useState(user?.city ?? "Any");
  const [collegeType, setCollegeType] = useState("Any");
  const [results, setResults] = useState<CollegeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Estimate readiness score from recent results
  const [readinessScore, setReadinessScore] = useState(60);

  useEffect(() => {
    fetchReadiness();
  }, []);

  const fetchReadiness = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("exam_results")
        .select("percentage, total_score")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(5);
      if (data && data.length > 0) {
        const avg = data.reduce((s, r) => s + (Number(r.percentage) || Number(r.total_score) || 0), 0) / data.length;
        setReadinessScore(Math.round(avg));
      }
    } catch (err) {
      console.warn("Could not fetch readiness score; using default.", err);
      setReadinessScore(60);
    }
  };

  const fetchPredictions = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke("college-predictor", {
        body: {
          readiness_score: readinessScore,
          branch,
          city: city === "Any" ? "" : city,
          target_college: user?.target_college ?? "",
          college_type: collegeType === "Any" ? "" : collegeType,
        },
      });
      if (error) throw error;
      setResults(data?.colleges ?? FALLBACK_COLLEGES);
    } catch (err) {
      console.warn("College predictor service unavailable, using demo output.", err);
      setResults(FALLBACK_COLLEGES);
      toast.error("Could not fetch live predictions. Showing sample recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const text = [
      `My MHT-CET College Predictions 🎓`,
      `Current score: ${readinessScore}%`,
      `Branch: ${branch}`,
      ``,
      results.slice(0, 3).map((r) => `${r.college_name} — ${r.probability}%`).join("\n"),
      ``,
      `Predicted on Proctor Mind · #MHT_CET2026`,
    ].join("\n");

    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-foreground flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            College Predictor
          </h1>
          <p className="text-xs text-muted-foreground">Based on your current readiness score of {readinessScore}%{hasSearched ? "" : " · demo results shown if no backend"}</p>
        </div>
        {results.length > 0 && (
          <Button onClick={handleShare} variant="outline" size="sm" className="ml-auto gap-1.5">
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        )}
      </div>

      {/* ── Filters ── */}
      <Card className="border-border rounded-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          {/* Readiness score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your Readiness Score
              </label>
              <span className="text-lg font-black text-foreground">{readinessScore}%</span>
            </div>
            <input
              type="range" min={20} max={100} step={1}
              value={readinessScore}
              onChange={(e) => setReadinessScore(Number(e.target.value))}
              className="w-full accent-[#e8c547]"
            />
            <p className="text-xs text-muted-foreground">
              Auto-filled from your recent exam results. Drag to explore scenarios.
            </p>
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Branch</label>
            <div className="flex flex-wrap gap-2">
              {BRANCHES.map((b) => (
                <button
                  key={b}
                  onClick={() => setBranch(b)}
                  className={`px-3 py-1.5 border rounded-sm text-xs font-semibold transition-colors ${
                    branch === b ? "border-[#1c1917] bg-[#1c1917] text-white" : "border-border text-foreground hover:border-foreground/40"
                  }`}
                >
                  {b.replace(" Engineering", "")}
                </button>
              ))}
            </div>
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">City Preference</label>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`px-3 py-1.5 border rounded-full text-xs font-semibold transition-colors ${
                    city === c ? "border-[#e8c547] bg-[#e8c547]/10 text-[#1c1917]" : "border-border text-foreground hover:border-foreground/40"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* College type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">College Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setCollegeType(t)}
                  className={`px-3 py-1.5 border rounded-sm text-xs font-semibold capitalize transition-colors ${
                    collegeType === t ? "border-[#1c1917] bg-[#1c1917] text-white" : "border-border text-foreground hover:border-foreground/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={fetchPredictions}
            disabled={loading}
            className="w-full bg-[#1c1917] text-[#e8c547] hover:bg-[#1c1917]/90 font-bold"
          >
            {loading ? "Calculating..." : "Predict My Colleges →"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Target college gap ── */}
      {user?.target_college && results.length > 0 && (() => {
        const target = results.find((r) => r.college_name === user.target_college);
        return target ? (
          <div className={`p-4 rounded-sm border flex items-center gap-3 ${
            target.probability >= 70 ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
          }`}>
            <span className="text-xl">{target.probability >= 70 ? "✅" : "⚠️"}</span>
            <div>
              <p className={`text-sm font-bold ${target.probability >= 70 ? "text-green-800" : "text-amber-800"}`}>
                {target.college_name} ({branch.replace(" Engineering", "")})
              </p>
              <p className={`text-xs ${target.probability >= 70 ? "text-green-700" : "text-amber-700"}`}>
                {target.probability >= 70
                  ? `You're on track — ${target.probability}% probability`
                  : `Need +${target.gap_marks} marks to reach here`}
              </p>
            </div>
            <div className={`ml-auto text-2xl font-black ${target.probability >= 70 ? "text-green-700" : "text-amber-700"}`}>
              {target.probability}%
            </div>
          </div>
        ) : null;
      })()}

      {/* ── Results table ── */}
      {hasSearched && !loading && (
        <Card className="border-border rounded-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {results.length} Colleges Found — {branch.replace(" Engineering", "")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-2">No colleges found for these filters.</p>
                <p className="text-xs text-muted-foreground">Try increasing your score or changing the city/branch filter.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-sm border transition-colors ${
                      r.college_name === user?.target_college
                        ? "border-[#e8c547] bg-[#e8c547]/5"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-7 text-center text-xs font-bold text-muted-foreground">{i + 1}</div>

                    {/* College info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground truncate">{r.college_name}</p>
                        {r.college_name === user?.target_college && (
                          <Badge variant="outline" className="text-[9px] text-[#e8c547] border-[#e8c547]">TARGET</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {r.city} · {r.type} · Cutoff 2024: {r.cutoff_2024}%ile
                      </p>
                    </div>

                    {/* Gap */}
                    {r.gap_marks > 0 && (
                      <div className="text-xs text-amber-600 font-semibold flex-shrink-0">
                        +{r.gap_marks}
                      </div>
                    )}

                    {/* Probability */}
                    <div className={`text-base font-black flex-shrink-0 ${
                      r.probability >= 75 ? "text-green-600" :
                      r.probability >= 50 ? "text-amber-600" : "text-[#e8341c]"
                    }`}>
                      {r.probability}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#e8c547] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Calculating your college chances...</p>
          </div>
        </div>
      )}

      {/* ── Share with parent CTA ── */}
      {results.length > 0 && (
        <div className="p-4 bg-muted/50 border border-border rounded-sm flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Share with your parents</p>
            <p className="text-xs text-muted-foreground">They can track your college progress with the Parent Pass</p>
          </div>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-[#25D366] text-white text-xs font-bold rounded-sm hover:bg-[#25D366]/90 transition-colors whitespace-nowrap"
          >
            📱 Share on WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}
