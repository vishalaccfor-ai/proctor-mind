import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";

// ── Plan data ─────────────────────────────────────────────────
const STUDENT_PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "",
    badge: null,
    features: [
      "3 chapter tests per day",
      "Basic score report",
      "Question palette",
      "7-day history",
    ],
    cta: "Current Plan",
    disabled: true,
    color: "border-border",
    headerBg: "bg-muted",
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    period: "/month",
    badge: "Most Popular",
    features: [
      "Unlimited tests",
      "AI feedback on every wrong answer",
      "Readiness score (0–100)",
      "College predictor",
      "Daily streak + QOTD",
      "30-day history",
    ],
    cta: "Start Pro",
    disabled: false,
    color: "border-[#e8c547] border-2",
    headerBg: "bg-[#1c1917]",
    razorpayPlanId: "plan_pro_149",
  },
  {
    id: "max",
    name: "Max",
    price: 299,
    period: "/month",
    badge: null,
    features: [
      "Everything in Pro",
      "Marathi UI (coming soon)",
      "Formula sheets",
      "Parent dashboard access",
      "Priority AI support",
      "Full history",
    ],
    cta: "Start Max",
    disabled: false,
    color: "border-border",
    headerBg: "bg-muted",
    razorpayPlanId: "plan_max_299",
  },
];

const YEARLY_PLAN = {
  name: "Yearly Max",
  price: 1999,
  saving: "Save ₹1,589 vs monthly",
  features: ["Everything in Max", "Priority support", "Exam-week emergency pass"],
  razorpayPlanId: "plan_yearly_1999",
};

const PARENT_PLAN = {
  price: 199,
  features: [
    "Daily WhatsApp update at 9PM",
    "Rank in Maharashtra",
    "College probability tracker",
    "Inactivity alerts",
    "Week-over-week progress report",
  ],
};

const COACHING_PLANS = [
  { name: "Starter", students: 30, price: 1499, highlighted: false },
  { name: "Pro", students: 100, price: 2999, highlighted: true },
  { name: "Growth", students: 300, price: 6999, highlighted: false },
  { name: "Enterprise", students: 1000, price: 14999, highlighted: false },
];

// ── Razorpay handler ─────────────────────────────────────────
function openRazorpay(planName: string, price: number, userEmail: string, onSuccess: () => void) {
  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID ?? "rzp_test_placeholder",
    amount: price * 100,
    currency: "INR",
    name: "Proctor Mind",
    description: `${planName} Plan`,
    prefill: { email: userEmail },
    theme: { color: "#1c1917" },
    handler: () => {
      onSuccess();
      toast.success(`${planName} activated! Refreshing...`);
      setTimeout(() => window.location.reload(), 1500);
    },
  };
  if (typeof window === "undefined" || !(window as any).Razorpay) {
    toast.error("Razorpay is unavailable. Please try again later.");
    return;
  }
  // @ts-ignore — Razorpay loaded via script tag
  const rzp = new window.Razorpay(options);
  rzp.open();
}

// ── Component ─────────────────────────────────────────────────
export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStudentPlan = (plan: typeof STUDENT_PLANS[0]) => {
    if (plan.disabled || !plan.razorpayPlanId) return;
    if (!user) { navigate("/login"); return; }
    openRazorpay(plan.name, plan.price, user.email, () => {});
  };

  const handleParentPlan = () => {
    if (!user) { navigate("/parent/register"); return; }
    openRazorpay("Parent Pass", PARENT_PLAN.price, user.email, () => {});
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="border-b border-border px-6 py-4 flex items-center gap-2 sticky top-0 bg-background z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </button>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-6 h-6 bg-[#1c1917] flex items-center justify-center text-[#e8c547] font-black text-xs">⚡</div>
          <span className="font-black text-sm">Proctor Mind</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-10 space-y-14">

        {/* ── Hero ── */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-foreground mb-2">Simple, transparent pricing</h1>
          <p className="text-muted-foreground">Maharashtra's only MHT-CET platform with AI diagnosis. No hidden fees.</p>
        </div>

        {/* ── Student plans ── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5">For Students</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STUDENT_PLANS.map((plan) => (
              <div key={plan.id} className={`border rounded-sm overflow-hidden ${plan.color}`}>
                {/* Header */}
                <div className={`${plan.headerBg} px-5 py-4`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-black ${plan.headerBg === "bg-[#1c1917]" ? "text-white" : "text-foreground"}`}>
                      {plan.name}
                    </span>
                    {plan.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#e8c547] text-[#1c1917] rounded">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-baseline gap-0.5 ${plan.headerBg === "bg-[#1c1917]" ? "text-white" : "text-foreground"}`}>
                    <span className="text-3xl font-black">
                      {plan.price === 0 ? "Free" : `₹${plan.price}`}
                    </span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="px-5 py-4 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="px-5 pb-5">
                  <button
                    onClick={() => handleStudentPlan(plan)}
                    disabled={plan.disabled || user?.subscription === plan.id}
                    className={`w-full py-2.5 text-sm font-bold rounded-sm transition-colors ${
                      plan.disabled || user?.subscription === plan.id
                        ? "bg-muted text-muted-foreground cursor-default"
                        : plan.id === "pro"
                          ? "bg-[#1c1917] text-[#e8c547] hover:bg-[#1c1917]/90"
                          : "bg-foreground text-background hover:bg-foreground/90"
                    }`}
                  >
                    {user?.subscription === plan.id ? "Current Plan ✓" : plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Yearly */}
          <div className="mt-4 border border-[#e8341c] rounded-sm p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-[#e8341c]" />
                <span className="font-black text-foreground">Yearly Max</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-[#e8341c] border border-red-200 rounded">BEST VALUE</span>
              </div>
              <p className="text-sm text-muted-foreground">{YEARLY_PLAN.saving}</p>
            </div>
            <div className="text-2xl font-black text-foreground">₹{YEARLY_PLAN.price.toLocaleString()}/yr</div>
            <button
              onClick={() => openRazorpay("Yearly Max", YEARLY_PLAN.price, user?.email ?? "", () => {})}
              className="px-5 py-2.5 bg-[#e8341c] text-white text-sm font-bold rounded-sm hover:bg-[#e8341c]/90 transition-colors whitespace-nowrap"
            >
              Get Yearly Max →
            </button>
          </div>
        </section>

        {/* ── Parent plan ── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5">For Parents</h2>
          <div className="border-2 border-[#25D366] rounded-sm overflow-hidden max-w-md">
            <div className="px-5 py-4 bg-[#25D366]/10 border-b border-[#25D366]/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📱</span>
                <span className="font-black text-foreground">Parent Pass</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-black text-foreground">₹{PARENT_PLAN.price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
            </div>
            <div className="px-5 py-4 space-y-2.5">
              {PARENT_PLAN.features.map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-3.5 h-3.5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
              <button
                onClick={handleParentPlan}
                className="w-full mt-4 py-2.5 bg-[#25D366] text-white text-sm font-bold rounded-sm hover:bg-[#25D366]/90 transition-colors"
              >
                Start Parent Pass →
              </button>
            </div>
          </div>
        </section>

        {/* ── Coaching plans ── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">For Coaching Centres</h2>
          <p className="text-sm text-muted-foreground mb-5">Teacher dashboard + batch analytics. Students still subscribe separately.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {COACHING_PLANS.map((plan) => (
              <div key={plan.name} className={`border rounded-sm p-4 ${plan.highlighted ? "border-[#1c1917] border-2" : "border-border"}`}>
                <div className="font-black text-foreground text-sm mb-0.5">{plan.name}</div>
                <div className="text-xs text-muted-foreground mb-2">Up to {plan.students} students</div>
                <div className="text-xl font-black text-foreground">₹{plan.price.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">/month</div>
                <button
                  onClick={() => toast.info("Contact us at hello@proctormind.in for a demo")}
                  className={`w-full mt-3 py-1.5 text-xs font-bold rounded-sm transition-colors ${
                    plan.highlighted
                      ? "bg-[#1c1917] text-white hover:bg-[#1c1917]/90"
                      : "border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Contact Us
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQs ── */}
        <section className="border-t border-border pt-10 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Common Questions</h2>
          {[
            ["Can I cancel anytime?", "Yes. Monthly plans cancel instantly. No questions asked."],
            ["Is there a free trial for Pro?", "Invite a parent and get 7 days of Pro free. No card required."],
            ["What payment methods are accepted?", "UPI, net banking, credit/debit cards via Razorpay. Fully secure."],
            ["Is the content MHT-CET specific?", "Yes. Every question, every AI explanation is mapped to MHT-CET syllabus (PCM/PCB)."],
          ].map(([q, a]) => (
            <div key={q} className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{q}</p>
              <p className="text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
