# Proctor Mind — B2P Code Changes
## How to apply these files to your repo

---

## STEP 1 — Run DB Migration
Open Supabase → SQL Editor → paste and run:
`supabase/migrations/002_b2p_parent_strategy.sql`

This adds: parent_links, user_subscriptions, whatsapp_logs, college_predictor_data tables
+ alters profiles table with 9 new columns (streak_count, onboarding_complete, etc.)

---

## STEP 2 — Replace these files entirely (MODIFY)

| File in this zip | Replace in your repo |
|---|---|
| src/contexts/AuthContext.tsx | src/contexts/AuthContext.tsx |
| src/App.tsx | src/App.tsx |
| src/components/AppSidebar.tsx | src/components/AppSidebar.tsx |
| src/pages/Dashboard.tsx | src/pages/Dashboard.tsx |
| src/pages/Results.tsx | src/pages/Results.tsx |
| supabase/functions/generate-feedback/index.ts | supabase/functions/generate-feedback/index.ts |

---

## STEP 3 — Add these NEW files to your repo

| File in this zip | Where in your repo |
|---|---|
| src/pages/Onboarding.tsx | src/pages/Onboarding.tsx |
| src/pages/ParentDashboard.tsx | src/pages/ParentDashboard.tsx |
| src/pages/ParentOnboarding.tsx | src/pages/ParentOnboarding.tsx |
| src/pages/Pricing.tsx | src/pages/Pricing.tsx |
| src/pages/CollegePredictor.tsx | src/pages/CollegePredictor.tsx |
| src/components/StreakBadge.tsx | src/components/StreakBadge.tsx |
| src/components/ParentCTA.tsx | src/components/ParentCTA.tsx |
| src/components/ShareCard.tsx | src/components/ShareCard.tsx |
| src/components/CollegePredictorWidget.tsx | src/components/CollegePredictorWidget.tsx |
| supabase/functions/college-predictor/index.ts | supabase/functions/college-predictor/index.ts |
| supabase/functions/whatsapp-digest/index.ts | supabase/functions/whatsapp-digest/index.ts |
| supabase/functions/parent-nudge/index.ts | supabase/functions/parent-nudge/index.ts |

---

## STEP 4 — Add environment variables

### Frontend (.env)
```
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
```

### Supabase Edge Functions (via Supabase Dashboard → Settings → Edge Functions → Secrets)
```
OPENAI_API_KEY=sk-...
WATI_API_URL=https://live-server-XXXXX.wati.io
WATI_API_TOKEN=your_wati_token
APP_URL=https://proctormind.in
```

---

## STEP 5 — Deploy edge functions
```bash
npx supabase functions deploy college-predictor
npx supabase functions deploy whatsapp-digest
npx supabase functions deploy parent-nudge
npx supabase functions deploy generate-feedback
```

---

## STEP 6 — Add Razorpay script to index.html
Add this inside <head> tag of your index.html:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## DO NOT TOUCH (these files are unchanged)
- src/pages/TakeExam.tsx
- src/pages/ExamList.tsx
- src/pages/ExamBuilder.tsx
- src/contexts/ExamContext.tsx
- src/components/ui/* (all shadcn components)

---

## WATI WhatsApp Setup (needed for parent digests)
1. Sign up at wati.io
2. Connect a WhatsApp Business number
3. Create 3 templates:
   - proctor_mind_daily_digest
   - proctor_mind_inactivity_nudge
   - proctor_mind_college_alert
4. Get API token from Wati dashboard → add to Supabase secrets

---

## Recommended build order
1. DB migration (Step 1) — everything depends on this
2. Replace AuthContext.tsx — subscription + onboarding flags
3. Replace App.tsx + AppSidebar.tsx — new routes
4. Add Onboarding.tsx — new signups must hit this
5. Replace Dashboard.tsx — streak, parent CTA, college widget
6. Add ParentOnboarding.tsx + ParentDashboard.tsx
7. Deploy whatsapp-digest edge function
8. Replace Results.tsx — ShareCard + AI debrief
9. Add Pricing.tsx + Razorpay setup
10. Add CollegePredictor.tsx
