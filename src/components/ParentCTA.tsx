import { useState } from "react";
import { X, Eye, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParentCTAProps {
  className?: string;
}

export function ParentCTA({ className }: ParentCTAProps) {
  const { user, refreshUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [copying, setCopying] = useState(false);

  if (dismissed) return null;

  const handleDismiss = async () => {
    setDismissed(true);
    if (user) {
      await supabase
        .from("profiles")
        .update({ dismiss_parent_cta_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }
  };

  const handleInvite = async () => {
    if (!user?.parent_invite_token) return;
    setCopying(true);
    const link = `${window.location.origin}/parent/register?token=${user.parent_invite_token}&student=${encodeURIComponent(user.name)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Track my MHT-CET prep",
          text: `Hi! I'm preparing for MHT-CET 2026 on Proctor Mind. You can track my daily progress here:`,
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);
        toast.success("Invite link copied! Share it with your parent on WhatsApp.");
      }
    } catch {
      toast.error("Could not copy link. Try again.");
    } finally {
      setCopying(false);
    }
  };

  // If parent already linked — show green confirmation
  if (user?.parent_linked) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-sm ${className}`}>
        <Eye className="w-4 h-4 text-green-600 flex-shrink-0" />
        <p className="text-sm text-green-800 font-medium flex-1">
          Your parent is tracking your MHT-CET progress 👀 — they get daily WhatsApp updates
        </p>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center gap-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-sm ${className}`}>
      <Gift className="w-5 h-5 text-amber-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          Invite a parent → get <span className="text-[#e8341c]">7 days Pro free</span>
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          They'll get daily WhatsApp updates on your rank, accuracy, and college chances.
        </p>
      </div>
      <button
        onClick={handleInvite}
        disabled={copying}
        className="flex-shrink-0 px-3 py-1.5 bg-[#1c1917] text-white text-xs font-bold rounded-sm hover:bg-[#1c1917]/90 transition-colors"
      >
        {copying ? "Copying..." : "Invite →"}
      </button>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-amber-400 hover:text-amber-700 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
