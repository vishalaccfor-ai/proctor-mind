import React, { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";
import { sampleExams } from "@/data/sampleExams";

// Types matching our DB schema
export interface Subject { id: string; name: string; }
export interface Topic { id: string; name: string; subjectId: string; }
export interface QuestionOption { id: string; text: string; }
export interface Question {
  id: string; text: string; options: QuestionOption[];
  correctOptionId: string; difficulty: string;
  subjectId: string; topicId: string; imageUrl?: string;
}
export interface Exam {
  id: string; title: string; description: string; duration: number;
  subjects: Subject[]; topics: Topic[]; questions: Question[];
  markingScheme: { correct: number; incorrect: number; unattempted: number };
  shuffleQuestions: boolean; shuffleOptions: boolean;
  createdBy: string; createdAt: string; isPublished: boolean;
}
export interface Answer {
  questionId: string; selectedOptionId: string | null;
  markedForReview: boolean; timeSpent: number;
}
export interface SubjectResult {
  subjectId: string; subjectName: string; subject?: string; totalQuestions: number;
  attempted: number; correct: number; incorrect: number;
  score: number; maxScore: number; accuracy: number; avgTimePerQuestion: number;
  percentage?: number;
}
export interface QuestionResult {
  questionId: string; isCorrect: boolean; isAttempted: boolean;
  marksAwarded: number; timeSpent: number; subjectId: string; topicId: string;
  selectedOptionId: string | null; correctOptionId: string;
}
export interface ExamResult {
  attemptId: string; examId: string; examTitle: string;
  totalScore: number; maxScore: number; percentage: number;
  totalQuestions: number; attempted: number; correct: number;
  incorrect: number; unattempted: number;
  subjectResults: SubjectResult[]; questionResults: QuestionResult[];
  timeTaken: number; submittedAt: string;
}

interface ExamContextType {
  exams: Exam[];
  results: ExamResult[];
  loading: boolean;
  fetchExams: () => Promise<void>;
  fetchResults: () => Promise<void>;
  createExam: (exam: Omit<Exam, "id" | "createdAt">) => Promise<string>;
  startAttempt: (examId: string) => Promise<string>;
  saveAnswers: (attemptId: string, answers: Record<string, Answer>, tabSwitchCount: number) => Promise<void>;
  submitAttempt: (attemptId: string, exam: Exam, answers: Record<string, Answer>, startedAt: string) => Promise<ExamResult>;
  getExam: (id: string) => Exam | undefined;
  getResultsForUser: () => ExamResult[];
}

const ExamContext = createContext<ExamContextType | null>(null);

function calculateResult(exam: Exam, answers: Record<string, Answer>, attemptId: string, startedAt: string): ExamResult {
  const questionResults: QuestionResult[] = exam.questions.map((q) => {
    const answer = answers[q.id];
    const isAttempted = !!answer?.selectedOptionId;
    const isCorrect = isAttempted && answer.selectedOptionId === q.correctOptionId;
    const marksAwarded = !isAttempted
      ? exam.markingScheme.unattempted
      : isCorrect ? exam.markingScheme.correct : exam.markingScheme.incorrect;
    return {
      questionId: q.id,
      isCorrect,
      isAttempted,
      marksAwarded,
      timeSpent: answer?.timeSpent || 0,
      subjectId: q.subjectId,
      topicId: q.topicId,
      selectedOptionId: answer?.selectedOptionId ?? null,
      correctOptionId: q.correctOptionId,
    };
  });

  const subjectMap = new Map<string, QuestionResult[]>();
  questionResults.forEach((qr) => {
    const list = subjectMap.get(qr.subjectId) || [];
    list.push(qr);
    subjectMap.set(qr.subjectId, list);
  });

  const subjectResults: SubjectResult[] = Array.from(subjectMap.entries()).map(([subjectId, qrs]) => {
    const subject = exam.subjects.find((s) => s.id === subjectId);
    const attempted = qrs.filter((q) => q.isAttempted).length;
    const correct = qrs.filter((q) => q.isCorrect).length;
    const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;
    return {
      subjectId,
      subjectName: subject?.name || "Unknown",
      subject: subject?.name || "Unknown",
      totalQuestions: qrs.length,
      attempted,
      correct,
      incorrect: attempted - correct,
      score: qrs.reduce((s, q) => s + q.marksAwarded, 0),
      maxScore: qrs.length * exam.markingScheme.correct,
      accuracy,
      percentage: accuracy,
      avgTimePerQuestion: qrs.length > 0 ? qrs.reduce((s, q) => s + q.timeSpent, 0) / qrs.length : 0,
    };
  });

  const totalScore = questionResults.reduce((s, q) => s + q.marksAwarded, 0);
  const maxScore = exam.questions.length * exam.markingScheme.correct;
  const attempted = questionResults.filter((q) => q.isAttempted).length;
  const correct = questionResults.filter((q) => q.isCorrect).length;
  const now = new Date().toISOString();
  const timeTaken = Math.floor((new Date(now).getTime() - new Date(startedAt).getTime()) / 1000);

  return {
    attemptId, examId: exam.id, examTitle: exam.title, totalScore, maxScore,
    percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0,
    totalQuestions: exam.questions.length, attempted, correct, incorrect: attempted - correct,
    unattempted: exam.questions.length - attempted, subjectResults, questionResults, timeTaken, submittedAt: now,
  };
}

export function ExamProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper to timeout a promise and return a fallback value
  const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    const timeout = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms));
    return Promise.race([promise, timeout] as const) as Promise<T>;
  };

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await withTimeout(
        supabase.from("exams").select("*"),
        3000,
        { data: null, error: new Error("timeout") }
      );
      const examRows = res?.data;
      const error = res?.error;
      if (error || !examRows || examRows.length === 0) {
        setExams(sampleExams);
        return;
      }

      const examIds = examRows.map((e) => e.id);
      const { data: questionRows } = await supabase.from("questions").select("*").in("exam_id", examIds);
      const { data: subjectRows } = await supabase.from("subjects").select("*");
      const { data: topicRows } = await supabase.from("topics").select("*");

      const subjectsMap = new Map((subjectRows || []).map((s) => [s.id, s]));
      const topicsMap = new Map((topicRows || []).map((t) => [t.id, t]));

      const fullExams: Exam[] = examRows.map((e) => {
        const qs = (questionRows || []).filter((q) => q.exam_id === e.id);
        const subjectIds = [...new Set(qs.map((q) => q.subject_id))];
        const topicIds = [...new Set(qs.map((q) => q.topic_id))];

        return {
          id: e.id, title: e.title, description: e.description, duration: e.duration,
          subjects: subjectIds.map((sid) => ({ id: sid, name: subjectsMap.get(sid)?.name || "Unknown" })),
          topics: topicIds.map((tid) => ({ id: tid, name: topicsMap.get(tid)?.name || "Unknown", subjectId: topicsMap.get(tid)?.subject_id || "" })),
          questions: qs.map((q) => ({
            id: q.id, text: q.text,
            options: (q.options as any[]) || [],
            correctOptionId: q.correct_option_id, difficulty: q.difficulty,
            subjectId: q.subject_id, topicId: q.topic_id, imageUrl: q.image_url || undefined,
          })),
          markingScheme: { correct: Number(e.marking_correct), incorrect: Number(e.marking_incorrect), unattempted: Number(e.marking_unattempted) },
          shuffleQuestions: e.shuffle_questions, shuffleOptions: e.shuffle_options,
          createdBy: e.created_by, createdAt: e.created_at, isPublished: e.is_published,
        };
      });
      setExams(fullExams);
    } catch (err) {
      console.warn("Could not fetch exams from backend. Using sample exams.", err);
      setExams(sampleExams);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResults = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("exam_results").select("*").eq("user_id", user.id).order("submitted_at", { ascending: false });
    if (error || !data) return;
    setResults(data.map((r) => {
      const subjectResults = (r.subject_results as any[]) || [];
      const normalizedSubjectResults = subjectResults.map((sr) => {
        const attempted = sr.attempted ?? sr.attempted_count ?? 0;
        const correct = sr.correct ?? 0;
        const totalQuestions = sr.totalQuestions ?? sr.total_questions ?? sr.total_questions_count ?? 0;
        const accuracy = sr.accuracy ?? (attempted > 0 ? (correct / attempted) * 100 : 0);
        return {
          subjectId: sr.subjectId ?? sr.subject_id ?? "",
          subjectName: sr.subjectName ?? sr.subject_name ?? sr.subject ?? "Unknown",
          subject: sr.subject ?? sr.subjectName ?? sr.subject_name ?? "Unknown",
          totalQuestions,
          attempted,
          correct,
          incorrect: sr.incorrect ?? (attempted - correct),
          score: sr.score ?? 0,
          maxScore: sr.maxScore ?? sr.max_score ?? 0,
          accuracy,
          percentage: sr.percentage ?? accuracy,
          avgTimePerQuestion: sr.avgTimePerQuestion ?? sr.avg_time_per_question ?? 0,
        };
      });

      return {
        attemptId: r.attempt_id, examId: r.exam_id, examTitle: r.exam_title,
        totalScore: Number(r.total_score), maxScore: Number(r.max_score), percentage: Number(r.percentage),
        totalQuestions: r.total_questions, attempted: r.attempted, correct: r.correct,
        incorrect: r.incorrect, unattempted: r.unattempted,
        subjectResults: normalizedSubjectResults,
        questionResults: (r.question_results as any[]) || [],
        timeTaken: r.time_taken, submittedAt: r.submitted_at,
      };
    }));
  }, [user]);

  const createExam = useCallback(async (exam: Omit<Exam, "id" | "createdAt">): Promise<string> => {
    if (!user) throw new Error("Not authenticated");

    // Insert subjects/topics first (upsert)
    for (const s of exam.subjects) {
      await supabase.from("subjects").upsert({ id: s.id, name: s.name }, { onConflict: "name" });
    }
    for (const t of exam.topics) {
      await supabase.from("topics").upsert({ id: t.id, name: t.name, subject_id: t.subjectId });
    }

    const { data: examData, error: examError } = await supabase.from("exams").insert({
      title: exam.title, description: exam.description, duration: exam.duration,
      marking_correct: exam.markingScheme.correct, marking_incorrect: exam.markingScheme.incorrect,
      marking_unattempted: exam.markingScheme.unattempted,
      shuffle_questions: exam.shuffleQuestions, shuffle_options: exam.shuffleOptions,
      is_published: exam.isPublished, created_by: user.id,
    }).select("id").single();
    if (examError || !examData) throw examError || new Error("Failed to create exam");

    // Insert questions
    const questionInserts = exam.questions.map((q, i) => ({
      exam_id: examData.id, text: q.text,
      options: q.options as unknown as Json,
      correct_option_id: q.correctOptionId, difficulty: q.difficulty,
      subject_id: q.subjectId, topic_id: q.topicId,
      image_url: q.imageUrl || null, sort_order: i,
    }));
    const { error: qError } = await supabase.from("questions").insert(questionInserts);
    if (qError) throw qError;

    await fetchExams();
    return examData.id;
  }, [user, fetchExams]);

  const startAttempt = useCallback(async (examId: string): Promise<string> => {
    if (!user) {
      // Allow local attempt for demo/guest users
      console.warn("Starting local attempt for unauthenticated user");
      return `local-attempt-${examId}-${Date.now()}`;
    }
    try {
      const { data, error } = await supabase.from("exam_attempts").insert({
        exam_id: examId, user_id: user.id, status: "in-progress",
      }).select("id").single();
      if (error || !data) throw error || new Error("Failed to start attempt");
      return data.id;
    } catch (err) {
      console.warn("Could not start attempt on backend. Falling back to local attempt.", err);
      return `local-attempt-${examId}-${Date.now()}`;
    }
  }, [user]);

  const saveAnswers = useCallback(async (attemptId: string, answers: Record<string, Answer>, tabSwitchCount: number) => {
    try {
      await supabase.from("exam_attempts").update({
        answers: answers as unknown as Json,
        tab_switch_count: tabSwitchCount,
      }).eq("id", attemptId);
    } catch (err) {
      console.warn("Could not save answers to backend. Progress will remain local.", err);
    }
  }, []);

  const submitAttempt = useCallback(async (
    attemptId: string, exam: Exam, answers: Record<string, Answer>, startedAt: string
  ): Promise<ExamResult> => {
    // Allow submission even when user is not authenticated (local/demo mode)
    const now = new Date().toISOString();

    // Update attempt
    try {
      await supabase.from("exam_attempts").update({
        answers: answers as unknown as Json,
        submitted_at: now, status: "submitted",
      }).eq("id", attemptId);
    } catch (err) {
      console.warn("Could not update attempt status on backend.", err);
    }

    // Calculate result
    const result = calculateResult(exam, answers, attemptId, startedAt);

    // Save result (to backend when available, otherwise keep local)
    try {
      if (user) {
        await supabase.from("exam_results").insert({
          attempt_id: attemptId, exam_id: exam.id, user_id: user.id,
          exam_title: exam.title, total_score: result.totalScore, max_score: result.maxScore,
          percentage: result.percentage, total_questions: result.totalQuestions,
          attempted: result.attempted, correct: result.correct, incorrect: result.incorrect,
          unattempted: result.unattempted,
          subject_results: result.subjectResults as unknown as Json,
          question_results: result.questionResults as unknown as Json,
          time_taken: result.timeTaken, submitted_at: now,
        });
      }
    } catch (err) {
      console.warn("Could not save exam result to backend. Result will remain local.", err);
    }

    setResults((prev) => [result, ...prev]);
    return result;
  }, [user]);

  const getExam = useCallback((id: string) => exams.find((e) => e.id === id), [exams]);
  const getResultsForUser = useCallback(() => results, [results]);

  // Fetch exams once when provider mounts so UI has data immediately
  React.useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  return (
    <ExamContext.Provider value={{
      exams, results, loading, fetchExams, fetchResults, createExam,
      startAttempt, saveAnswers, submitAttempt, getExam, getResultsForUser,
    }}>
      {children}
    </ExamContext.Provider>
  );
}

// Automatically fetch exams on provider mount so pages have data immediately
// This keeps the app usable even when navigating directly to exam pages.
export function ExamProviderAutoFetchWrapper({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(ExamContext);
  React.useEffect(() => {
    // If provider exists and has fetchExams, trigger it.
    if (ctx && ctx.fetchExams) ctx.fetchExams();
  }, [ctx]);
  return <>{children}</>;
}

export function useExams() {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error("useExams must be used within ExamProvider");
  return ctx;
}
