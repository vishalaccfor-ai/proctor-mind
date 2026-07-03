import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ShareCardProps {
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  rank?: number;
  examTitle: string;
  subjectResults?: { subject: string; percentage: number }[];
  streak?: number;
}

export function ShareCard({
  studentName,
  score,
  maxScore,
  percentage,
  rank,
  examTitle,
  subjectResults = [],
  streak = 0,
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const grade =
    percentage >= 90 ? { label: "Exceptional 🔥", color: "#22c55e" } :
    percentage >= 75 ? { label: "Excellent ✅",   color: "#e8c547" } :
    percentage >= 60 ? { label: "Good 📈",         color: "#3b82f6" } :
                       { label: "Keep Grinding 💪", color: "#f59e0b" };

  const shareText = [
    `📊 My MHT-CET Mock Result`,
    ``,
    `Exam: ${examTitle}`,
    `Score: ${score}/${maxScore} (${percentage}%)`,
    rank ? `Rank: #${rank.toLocaleString()} in Maharashtra` : "",
    streak > 0 ? `Study Streak: ${streak} days 🔥` : "",
    ``,
    `Preparing on Proctor Mind — Maharashtra's AI exam prep platform`,
    `#MHT_CET2026 #ProctorMind`,
  ].filter(Boolean).join("\n");

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "My MHT-CET Score", text: shareText });
        return;
      } catch { /* user cancelled */ }
    }
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <div className="space-y-3">
      {/* Visual card (what gets screenshotted/shared) */}
      <div
        id="share-card"
        className="rounded-sm overflow-hidden border border-border"
        style={{ background: "#1c1917" }}
      >
        {/* Top bar */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <div className="text-[#e8c547] font-black text-xs uppercase tracking-widest mb-0.5">Proctor Mind</div>
            <div className="text-white/50 text-xs">MHT-CET AI Prep · Maharashtra</div>
          </div>
          <div className="text-2xl">⚡</div>
        </div>

        {/* Score */}
        <div className="px-5 py-4 text-center border-t border-white/8">
          <div className="text-white/50 text-xs uppercase tracking-wider mb-1">{examTitle}</div>
          <div className="font-black text-5xl leading-none mb-1" style={{ color: grade.color }}>
            {percentage}%
          </div>
          <div className="text-white/60 text-sm mb-2">{score} / {maxScore} marks</div>
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: grade.color + "22", color: grade.color }}
          >
            {grade.label}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 border-t border-white/8">
          {[
            { label: "Student", value: studentName.split(" ")[0] },
            { label: "Rank", value: rank ? `#${rank.toLocaleString()}` : "—" },
            { label: "Streak", value: streak > 0 ? `${streak}🔥` : "—" },
          ].map((s) => (
            <div key={s.label} className="py-3 text-center border-r border-white/8 last:border-r-0">
              <div className="text-white font-bold text-sm">{s.value}</div>
              <div className="text-white/40 text-[10px] uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Subject bars */}
        {subjectResults.length > 0 && (
          <div className="px-5 py-4 border-t border-white/8 space-y-2">
            {subjectResults.map((sr) => (
              <div key={sr.subject}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">{sr.subject}</span>
                  <span className="text-white/80 font-semibold">{sr.percentage}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${sr.percentage}%`,
                      background: sr.percentage >= 75 ? "#22c55e" : sr.percentage >= 50 ? "#e8c547" : "#e8341c"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/8">
          <p className="text-white/25 text-[10px] text-center">proctormind.in · AI-powered MHT-CET prep</p>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleWhatsApp}
          className="flex-1 gap-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white font-semibold"
        >
          <span>📱</span> WhatsApp
        </Button>
        <Button
          onClick={handleShare}
          variant="outline"
          className="flex-1 gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Text"}
        </Button>
        <Button
          onClick={handleShare}
          variant="outline"
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
