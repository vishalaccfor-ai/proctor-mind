import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { readiness_score, branch, city, target_college, college_type } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Convert readiness score (0-100%) to approximate CET percentile
    // readiness 80% ≈ 95th percentile, 60% ≈ 85th, 40% ≈ 70th
    const approxPercentile = Math.round(readiness_score * 0.8 + 30);

    // Query colleges the student can reach (cutoff <= percentile + 10 buffer)
    let query = supabase
      .from("college_predictor_data")
      .select("*")
      .lte("cutoff_2024", approxPercentile + 10)
      .order("cutoff_2024", { ascending: false })
      .limit(30);

    if (branch) query = query.eq("branch", branch);
    if (city && city !== "Any") query = query.eq("city", city);
    if (college_type && college_type !== "Any") query = query.eq("type", college_type);

    const { data: colleges, error } = await query;
    if (error) throw error;

    // Calculate probability and gap for each college
    const results = (colleges ?? []).map((college) => {
      const cutoff = college.cutoff_2024 ?? 80;
      const diff = approxPercentile - cutoff;
      let probability: number;

      if (diff >= 10)       probability = 90 + Math.min(diff - 10, 8);
      else if (diff >= 5)   probability = 75 + diff;
      else if (diff >= 0)   probability = 60 + diff * 3;
      else if (diff >= -5)  probability = 40 + diff * 4 + 20;
      else if (diff >= -10) probability = 20 + (diff + 10) * 2;
      else                  probability = Math.max(5, 20 + diff * 2);

      probability = Math.min(98, Math.max(3, Math.round(probability)));

      const gap_marks = diff < 0 ? Math.abs(diff) : 0;

      return {
        college_name: college.college_name,
        city: college.city,
        branch: college.branch,
        type: college.type,
        cutoff_2024: college.cutoff_2024,
        probability,
        gap_marks,
      };
    });

    // Sort by probability desc
    results.sort((a, b) => b.probability - a.probability);

    // Calculate gap to target college
    let gap_to_target = null;
    if (target_college) {
      const target = colleges?.find((c) => c.college_name === target_college);
      if (target) {
        gap_to_target = Math.max(0, (target.cutoff_2024 ?? 80) - approxPercentile);
      }
    }

    return new Response(
      JSON.stringify({ colleges: results, gap_to_target, approximate_percentile: approxPercentile }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
