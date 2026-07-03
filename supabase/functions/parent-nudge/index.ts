import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WATI_API_URL   = Deno.env.get("WATI_API_URL")   ?? "";
const WATI_API_TOKEN  = Deno.env.get("WATI_API_TOKEN")  ?? "";
const APP_URL         = Deno.env.get("APP_URL")          ?? "https://proctormind.in";
const EXAM_DATE = new Date("2026-05-05");

function daysLeft() {
  return Math.max(0, Math.ceil((EXAM_DATE.getTime() - Date.now()) / 86400000));
}

async function sendWatiMessage(phone: string, params: Record<string, string>) {
  if (!WATI_API_URL || !WATI_API_TOKEN) return { success: false };

  const res = await fetch(
    `${WATI_API_URL}/api/v1/sendTemplateMessage?whatsappNumber=${phone}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WATI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_name: "proctor_mind_inactivity_nudge",
        broadcast_name: `nudge_${Date.now()}`,
        parameters: Object.entries(params).map(([name, value]) => ({ name, value })),
      }),
    }
  );
  const data = await res.json();
  return { success: res.ok, wati_id: data?.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find students inactive for 48+ hours
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split("T")[0];

    const { data: links } = await supabase
      .from("parent_links")
      .select(`
        id, parent_id, student_id, whatsapp_number,
        profiles!parent_links_student_id_fkey(name, last_active_date, city, target_college)
      `)
      .eq("is_active", true)
      .eq("nudge_opt_in", true)
      .not("whatsapp_number", "is", null);

    const results: { student_id: string; status: string }[] = [];

    for (const link of links ?? []) {
      try {
        const profile = link.profiles as Record<string, unknown>;
        const lastActive = profile?.last_active_date as string ?? null;

        // Check if student is actually inactive
        if (lastActive && lastActive >= cutoff) {
          results.push({ student_id: link.student_id, status: "active_skip" });
          continue;
        }

        // Don't nudge more than once per 48h
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data: recentNudge } = await supabase
          .from("whatsapp_logs")
          .select("id")
          .eq("recipient_id", link.parent_id)
          .eq("message_type", "nudge")
          .gte("sent_at", fortyEightHoursAgo)
          .maybeSingle();

        if (recentNudge) {
          results.push({ student_id: link.student_id, status: "recently_nudged_skip" });
          continue;
        }

        const daysSinceActive = lastActive
          ? Math.floor((Date.now() - new Date(lastActive).getTime()) / 86400000)
          : 3;

        const sendResult = await sendWatiMessage(link.whatsapp_number, {
          student_name: profile?.name as string ?? "your child",
          days_inactive: String(daysSinceActive),
          days_left: String(daysLeft()),
          dashboard_link: `${APP_URL}/parent/dashboard`,
          city: profile?.city as string ?? "Maharashtra",
        });

        await supabase.from("whatsapp_logs").insert({
          recipient_id: link.parent_id,
          phone_number: link.whatsapp_number,
          message_type: "nudge",
          content: { student_id: link.student_id, days_inactive: daysSinceActive },
          wati_message_id: sendResult.wati_id ?? null,
          status: sendResult.success ? "sent" : "failed",
        });

        results.push({ student_id: link.student_id, status: sendResult.success ? "sent" : "failed" });
      } catch (err) {
        console.error("Nudge error for link", link.id, err);
        results.push({ student_id: link.student_id, status: "error" });
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: links?.length ?? 0, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
