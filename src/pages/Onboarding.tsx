import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

// ── Data ─────────────────────────────────────────────────────
const COLLEGES = [
  "COEP Pune", "VJTI Mumbai", "ICT Mumbai", "PICT Pune", "MIT Pune",
  "VIT Pune", "SPIT Mumbai", "KJ Somaiya Mumbai", "BVDU Pune",
  "GCOE Nashik", "RCOEM Nagpur", "Walchand Sangli", "DY Patil Pune",
  "Symbiosis Institute Pune", "MGM Aurangabad", "YCCE Nagpur", "Other",
];

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];

const CITIES = ["Pune", "Mumbai", "Nashik", "Aurangabad", "Nagpur", "Kolhapur", "Sangli", "Other"];

// ── Step indicators ───────────────────────────────────────────
function StepDot({ n, current }: { n: number; current: number }) {
  const done = n < current;
  const active = n === current;
  return (
    <div className={`
      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
      ${done ? "bg-[#22c55e] text-white" : active ? "bg-[#1c1917] text-[#e8c547]" : "bg-muted text-muted-foreground"}
    `}>
      {done ? "✓" : n}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function Onboarding() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [targetCollege, setTargetCollege] = useState("");
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [studyHours, setStudyHours] = useState(3);
  const [city, setCity] = useState("");

  const toggleSubject = (s: string) => {
    setWeakSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleFinish = async () => {
    if (!targetCollege) { toast.error("Please select your target college"); return; }
    if (!city) { toast.error("Please select your city"); return; }

    setSubmitting(true);
    try {
      await updateProfile({
        target_college: targetCollege,
        weak_subjects: weakSubjects,
        study_hours_per_day: studyHours,
        city,
        onboarding_complete: true,
      });
      toast.success("You're all set! Let's crack MHT-CET 🔥");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Onboarding save failed:", err);
      const message = err?.message || err?.detail || err?.hint || JSON.stringify(err);
      toast.error(message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#1c1917] flex items-center justify-center text-[#e8c547] font-black text-xl mx-auto mb-4">⚡</div>
          <h1 className="text-2xl font-black text-foreground mb-1">
            Welcome, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Quick setup — 3 questions so we can personalise your prep
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <StepDot n={n} current={step} />
              {n < 3 && <div className={`w-12 h-0.5 ${step > n ? "bg-[#22c55e]" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Target College + City ── */}
        {step === 1 && (
          <div className="border border-border bg-card p-6 rounded-sm space-y-5">
            <div>
              <h2 className="font-black text-lg text-foreground mb-1">
                What's your dream college?
              </h2>
              <p className="text-sm text-muted-foreground">
                We'll track exactly how many marks you need to get there.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Target College
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COLLEGES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setTargetCollege(c)}
                    className={`
                      text-left px-3 py-2.5 border rounded-sm text-sm transition-all
                      ${targetCollege === c
                        ? "border-[#1c1917] bg-[#1c1917] text-white font-semibold"
                        : "border-border bg-background text-foreground hover:border-foreground/30"
                      }
                    `}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your City
              </label>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={`
                      px-3 py-1.5 border rounded-full text-sm transition-all
                      ${city === c
                        ? "border-[#e8c547] bg-[#e8c547]/10 text-[#1c1917] font-semibold"
                        : "border-border bg-background text-foreground hover:border-foreground/30"
                      }
                    `}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => {
                if (!targetCollege) { toast.error("Please select your target college"); return; }
                if (!city) { toast.error("Please select your city"); return; }
                setStep(2);
              }}
              className="w-full bg-[#1c1917] text-white hover:bg-[#1c1917]/90"
            >
              Next →
            </Button>
          </div>
        )}

        {/* ── Step 2: Weak Subjects ── */}
        {step === 2 && (
          <div className="border border-border bg-card p-6 rounded-sm space-y-5">
            <div>
              <h2 className="font-black text-lg text-foreground mb-1">
                Which subjects worry you most?
              </h2>
              <p className="text-sm text-muted-foreground">
                Select all that apply. We'll prioritise these in your practice and AI feedback.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SUBJECTS.map((s) => {
                const selected = weakSubjects.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSubject(s)}
                    className={`
                      flex items-center gap-3 px-4 py-4 border rounded-sm text-sm font-semibold transition-all
                      ${selected
                        ? "border-[#e8341c] bg-[#e8341c]/8 text-[#e8341c]"
                        : "border-border bg-background text-foreground hover:border-foreground/30"
                      }
                    `}
                  >
                    <span className="text-xl">
                      {s === "Physics" ? "⚛️" : s === "Chemistry" ? "🧪" : s === "Mathematics" ? "📐" : "🧬"}
                    </span>
                    {s}
                    {selected && <CheckCircle className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              {weakSubjects.length === 0 && "Select at least one subject (even if you're strong at all!)"}
              {weakSubjects.length > 0 && `${weakSubjects.join(", ")} selected`}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>← Back</Button>
              <Button className="flex-1 bg-[#1c1917] text-white hover:bg-[#1c1917]/90" onClick={() => setStep(3)}>
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Study Hours ── */}
        {step === 3 && (
          <div className="border border-border bg-card p-6 rounded-sm space-y-5">
            <div>
              <h2 className="font-black text-lg text-foreground mb-1">
                How many hours can you study daily?
              </h2>
              <p className="text-sm text-muted-foreground">
                We'll build your daily mission to fit your schedule — not overwhelm it.
              </p>
            </div>

            <div className="text-center py-4">
              <div className="text-6xl font-black text-[#e8c547] mb-2">{studyHours}</div>
              <div className="text-muted-foreground text-sm">hours per day</div>
            </div>

            <input
              type="range"
              min={1} max={8} step={1}
              value={studyHours}
              onChange={(e) => setStudyHours(Number(e.target.value))}
              className="w-full accent-[#e8c547]"
            />

            <div className="flex justify-between text-xs text-muted-foreground px-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                <span key={h} className={studyHours === h ? "text-[#e8c547] font-bold" : ""}>{h}h</span>
              ))}
            </div>

            <div className="p-3 bg-muted/50 rounded-sm text-sm text-muted-foreground">
              {studyHours <= 2 && "💡 That's fine — we'll focus on high-impact questions only."}
              {studyHours >= 3 && studyHours <= 5 && "🎯 Perfect. Your daily mission will be ~40 focused questions."}
              {studyHours >= 6 && "🔥 Serious mode. We'll build a full exam + chapter mix daily."}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>← Back</Button>
              <Button
                className="flex-1 bg-[#e8341c] text-white hover:bg-[#e8341c]/90 font-bold"
                onClick={handleFinish}
                disabled={submitting}
              >
                {submitting ? "Setting up..." : "Start Preparing 🚀"}
              </Button>
            </div>
          </div>
        )}

        {/* Progress text */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Step {step} of 3 · Takes less than 90 seconds
        </p>
      </div>
    </div>
  );
}
