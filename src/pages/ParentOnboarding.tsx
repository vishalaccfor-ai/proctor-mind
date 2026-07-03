import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ParentOnboarding() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signup, login } = useAuth();

  const token = params.get("token") ?? "";
  const studentName = params.get("student") ?? "your child";

  const [step, setStep] = useState(1);
  const [isLogin, setIsLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const handleAuth = async () => {
    if (!email || !password) { toast.error("Enter email and password"); return; }
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name) { toast.error("Enter your name"); return; }
        await signup(email, password, name, "parent");
      }
      setStep(2);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Auth failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkStudent = async () => {
    if (!token) {
      toast.error("Invalid invite link. Ask your child to re-share.");
      return;
    }
    if (!whatsapp) { toast.error("Enter your WhatsApp number for daily updates"); return; }

    setSubmitting(true);
    try {
      // Find student by invite token
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, name")
        .eq("parent_invite_token", token)
        .single();

      if (pErr || !profile) {
        toast.error("Invite link expired or invalid. Ask your child to reshare.");
        setSubmitting(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not logged in"); setSubmitting(false); return; }

      // Create parent link
      const { error: linkErr } = await supabase.from("parent_links").insert({
        parent_id: session.user.id,
        student_id: profile.user_id,
        whatsapp_number: whatsapp.replace(/\D/g, ""),
        digest_opt_in: true,
        nudge_opt_in: true,
      });

      if (linkErr) throw linkErr;

      // Update student's parent_linked flag
      await supabase
        .from("profiles")
        .update({ parent_linked: true })
        .eq("user_id", profile.user_id);

      toast.success(`Linked to ${profile.name}! You'll get daily WhatsApp updates.`);
      setStep(3);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Linking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#1c1917] flex items-center justify-center text-[#e8c547] font-black text-xl mx-auto mb-4">⚡</div>
          <h1 className="text-2xl font-black text-foreground">Proctor Mind</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track <strong>{studentName}'s</strong> MHT-CET preparation
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`flex-1 h-1 rounded-full transition-colors ${step >= n ? "bg-[#1c1917]" : "bg-muted"}`} />
          ))}
        </div>

        {/* ── Step 1: Auth ── */}
        {step === 1 && (
          <div className="border border-border bg-card p-6 rounded-sm space-y-4">
            <h2 className="font-black text-lg text-foreground">
              {isLogin ? "Welcome back" : "Create your parent account"}
            </h2>

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Name</label>
                <Input placeholder="e.g. Meena Patil" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</label>
              <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</label>
              <Input type="password" placeholder="min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <Button
              className="w-full bg-[#1c1917] text-white hover:bg-[#1c1917]/90"
              onClick={handleAuth}
              disabled={submitting}
            >
              {submitting ? "Please wait..." : isLogin ? "Sign In →" : "Create Account →"}
            </Button>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-xs text-center text-muted-foreground hover:text-foreground"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        )}

        {/* ── Step 2: Link student + WhatsApp ── */}
        {step === 2 && (
          <div className="border border-border bg-card p-6 rounded-sm space-y-4">
            <h2 className="font-black text-lg text-foreground">Set up daily updates</h2>
            <p className="text-sm text-muted-foreground">
              We'll send you a WhatsApp message every evening at 9PM with {studentName}'s progress, rank, and college chances.
            </p>

            {token ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-sm text-sm text-green-800">
                ✅ Invite link verified — linked to {studentName}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-sm text-sm text-amber-800">
                ⚠️ No invite link found. Ask your child to share their invite link.
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your WhatsApp Number
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 border border-border bg-muted rounded-sm text-sm text-muted-foreground">+91</div>
                <Input
                  type="tel"
                  placeholder="98765 43210"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">Daily 9PM update · Inactivity alerts · College progress</p>
            </div>

            <Button
              className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold"
              onClick={handleLinkStudent}
              disabled={submitting || !token}
            >
              {submitting ? "Linking..." : "Start Tracking →"}
            </Button>
          </div>
        )}

        {/* ── Step 3: Success ── */}
        {step === 3 && (
          <div className="border border-green-200 bg-green-50 p-6 rounded-sm space-y-4 text-center">
            <div className="text-4xl">✅</div>
            <h2 className="font-black text-xl text-green-900">You're all set!</h2>
            <p className="text-sm text-green-800">
              You'll receive your first WhatsApp update tonight at 9PM. You can track {studentName}'s progress anytime in the app.
            </p>
            <Button
              className="w-full bg-[#1c1917] text-white hover:bg-[#1c1917]/90"
              onClick={() => navigate("/parent/dashboard")}
            >
              Go to Dashboard →
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6">
          ₹199/month · Cancel anytime · No commitments
        </p>
      </div>
    </div>
  );
}
