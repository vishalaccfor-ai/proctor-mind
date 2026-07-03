import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question_id, selected_answer, correct_answer, question, subject, topic } = await req.json();

    const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not configured");

    // If question_id provided, fetch full question text from DB
    let questionText = question ?? "";
    let questionSubject = subject ?? "General";
    let questionTopic = topic ?? "";

    if (question_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: q } = await supabase
        .from("questions")
        .select("text, difficulty, subjects(name), topics(name)")
        .eq("id", question_id)
        .single();

      if (q) {
        questionText = q.text;
        questionSubject = (q.subjects as Record<string, string>)?.name ?? subject ?? "General";
        questionTopic = (q.topics as Record<string, string>)?.name ?? topic ?? "";
      }
    }

    const prompt = `You are an expert MHT-CET tutor. A Maharashtra Class 12 student answered a question incorrectly.

Subject: ${questionSubject}
Topic: ${questionTopic}
Question: ${questionText}
Student answered: ${selected_answer}
Correct answer: ${correct_answer}

Give a SHORT, specific diagnosis in 2-3 sentences. Focus on:
1. WHY the student likely chose the wrong answer (what misconception or gap)
2. ONE specific tip to fix this

Respond in JSON format only:
{
  "question": "short question summary (max 80 chars)",
  "subject": "${questionSubject}",
  "diagnosis": "specific explanation of the mistake and its root cause",
  "tip": "one actionable tip to prevent this mistake next time"
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 400,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";

    let feedback;
    try {
      feedback = JSON.parse(raw);
    } catch {
      feedback = {
        question: questionText.slice(0, 80),
        subject: questionSubject,
        diagnosis: raw,
        tip: "Review this topic in your NCERT/MHT-CET guide.",
      };
    }

    return new Response(
      JSON.stringify({ feedback }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
