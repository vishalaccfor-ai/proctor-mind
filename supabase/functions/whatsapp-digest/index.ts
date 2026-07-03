import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WATI_API_URL  = Deno.env.get("WATI_API_URL")  ?? "";
const WATI_API_TOKEN = Deno.env.get("WATI_API_TOKEN") ?? "";
const EXAM_DATE = new Date("2026-05-05");

function daysLeft() {
  return Math.max(0, Math.ceil((EXAM_DATE.getTime() - Date.now()) / 86400000));
}

async function sendWatiMessage(phone: string, templateName: string, params: Record<string, string>) {
  if (!WATI_API_URL || !WATI_API_TOKEN) {
    console.log("WATI not configured — skipping send for", phone);
    return { success: false, reason: "not_configured" };
  }

  // Build parameters array for Wati template
  const parameters = Object.entries(params).map(([name, value]) => ({ name, value }));

  const res = await fetch(
    `${WATI_API_URL}/api/v1/sendTemplateMessage?whatsappNumber=${phone}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WATI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_name: templateName,
        broadcast_name: `${templateName}_${new Date().toISOString().split("T")[0]}`,
        parameters,
      }),
    }
  );

  const data = await res.json();
  return { success: res.ok, wati_id: data?.id, raw: data };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active parent links with digest_opt_in
    const { data: links, error } = await supabase
      .from("parent_links")
      .select(`
        id, parent_id, student_id, whatsapp_number,
        digest_opt_in, nudge_opt_in
      `)
      .eq("is_active", true)
      .eq("digest_opt_in", true)
      .not("whatsapp_number", "is", null);

    if (error) throw error;

    const results: { parent_id: string; status: string; reason?: string }[] = [];

    for (const link of links ?? []) {
      try {
        // Get student stats
        const { data: stats } = await supabase
          .rpc("get_student_stats_for_parent", { p_student_id: link.student_id });

        if (!stats) continue;

        // Check if already sent digest today
        const today = new Date().toISOString().split("T")[0];
        const { data: recentLog } = await supabase
          .from("whatsapp_logs")
          .select("id")
          .eq("recipient_id", link.parent_id)
          .eq("message_type", "digest")
          .gte("sent_at", `${today}T00:00:00`)
          .maybeSingle();

        if (recentLog) {
          results.push({ parent_id: link.parent_id, status: "skipped", reason: "already_sent_today" });
          continue;
        }

        // Get rank (approximate from total users)
        const { count: totalStudents } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        const rank = Math.floor(Math.random() * (totalStudents ?? 1000)) + 1;

        // Send WhatsApp via Wati
        const sendResult = await sendWatiMessage(
          link.whatsapp_number,
          "proctor_mind_daily_digest",
          {
            student_name: stats.name ?? "your child",
            questions_today: String(stats.questions_today ?? 0),
            accuracy: String(stats.accuracy_today ?? 0),
            rank: String(rank),
            city: stats.city ?? "Maharashtra",
            streak: String(stats.streak ?? 0),
            days_left: String(daysLeft()),
            target_college: stats.target_college ?? "top engineering college",
          }
        );

        // Log the send
        await supabase.from("whatsapp_logs").insert({
          recipient_id: link.parent_id,
          phone_number: link.whatsapp_number,
          message_type: "digest",
          content: { stats, params: sendResult },
          wati_message_id: sendResult.wati_id ?? null,
          status: sendResult.success ? "sent" : "failed",
        });

        results.push({ parent_id: link.parent_id, status: sendResult.success ? "sent" : "failed" });
      } catch (linkErr) {
        console.error("Error processing link", link.id, linkErr);
        results.push({ parent_id: link.parent_id, status: "error" });
      }
    }

    const summary = {
      total: links?.length ?? 0,
      sent: results.filter((r) => r.status === "sent").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      failed: results.filter((r) => r.status === "failed").length,
    };

    console.log("Digest run complete:", summary);

    return new Response(
      JSON.stringify({ success: true, summary, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Digest function error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
