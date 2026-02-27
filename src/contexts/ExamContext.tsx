import React, { createContext, useContext, useState, useCallback } from "react";
import { Exam, ExamAttempt, ExamResult, Question, Subject, Topic, MarkingScheme } from "@/types/exam";
import { sampleExams } from "@/data/sampleExams";

interface ExamContextType {
  exams: Exam[];
  attempts: ExamAttempt[];
  results: ExamResult[];
  addExam: (exam: Exam) => void;
  startAttempt: (examId: string, userId: string) => ExamAttempt;
  updateAttempt: (attempt: ExamAttempt) => void;
  submitAttempt: (attemptId: string) => ExamResult;
  getExam: (id: string) => Exam | undefined;
  getAttempt: (id: string) => ExamAttempt | undefined;
  getResultsForUser: (userId: string) => ExamResult[];
}

const ExamContext = createContext<ExamContextType | null>(null);

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function calculateResult(exam: Exam, attempt: ExamAttempt): ExamResult {
  const questionResults = exam.questions.map((q) => {
    const answer = attempt.answers[q.id];
    const isAttempted = !!answer?.selectedOptionId;
    const isCorrect = isAttempted && answer.selectedOptionId === q.correctOptionId;
    const marksAwarded = !isAttempted
      ? exam.markingScheme.unattempted
      : isCorrect
      ? exam.markingScheme.correct
      : exam.markingScheme.incorrect;

    return {
      questionId: q.id,
      isCorrect,
      isAttempted,
      marksAwarded,
      timeSpent: answer?.timeSpent || 0,
      subjectId: q.subjectId,
      topicId: q.topicId,
    };
  });

  const subjectMap = new Map<string, typeof questionResults>();
  questionResults.forEach((qr) => {
    const list = subjectMap.get(qr.subjectId) || [];
    list.push(qr);
    subjectMap.set(qr.subjectId, list);
  });

  const subjectResults = Array.from(subjectMap.entries()).map(([subjectId, qrs]) => {
    const subject = exam.subjects.find((s) => s.id === subjectId);
    const attempted = qrs.filter((q) => q.isAttempted).length;
    const correct = qrs.filter((q) => q.isCorrect).length;
    const incorrect = attempted - correct;
    const score = qrs.reduce((sum, q) => sum + q.marksAwarded, 0);
    const maxScore = qrs.length * exam.markingScheme.correct;
    return {
      subjectId,
      subjectName: subject?.name || "Unknown",
      totalQuestions: qrs.length,
      attempted,
      correct,
      incorrect,
      score,
      maxScore,
      accuracy: attempted > 0 ? (correct / attempted) * 100 : 0,
      avgTimePerQuestion: qrs.length > 0 ? qrs.reduce((s, q) => s + q.timeSpent, 0) / qrs.length : 0,
    };
  });

  const totalScore = questionResults.reduce((s, q) => s + q.marksAwarded, 0);
  const maxScore = exam.questions.length * exam.markingScheme.correct;
  const attempted = questionResults.filter((q) => q.isAttempted).length;
  const correct = questionResults.filter((q) => q.isCorrect).length;

  const startTime = new Date(attempt.startedAt).getTime();
  const endTime = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() : Date.now();

  return {
    attemptId: attempt.id,
    examId: exam.id,
    examTitle: exam.title,
    totalScore,
    maxScore,
    percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0,
    totalQuestions: exam.questions.length,
    attempted,
    correct,
    incorrect: attempted - correct,
    unattempted: exam.questions.length - attempted,
    subjectResults,
    questionResults,
    timeTaken: Math.floor((endTime - startTime) / 1000),
    submittedAt: attempt.submittedAt || new Date().toISOString(),
  };
}

export function ExamProvider({ children }: { children: React.ReactNode }) {
  const [exams, setExams] = useState<Exam[]>(sampleExams);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);

  const addExam = useCallback((exam: Exam) => {
    setExams((prev) => [...prev, exam]);
  }, []);

  const getExam = useCallback((id: string) => exams.find((e) => e.id === id), [exams]);

  const startAttempt = useCallback((examId: string, userId: string): ExamAttempt => {
    const attempt: ExamAttempt = {
      id: `attempt-${Date.now()}`,
      examId,
      userId,
      answers: {},
      startedAt: new Date().toISOString(),
      submittedAt: null,
      tabSwitchCount: 0,
      status: "in-progress",
    };
    setAttempts((prev) => [...prev, attempt]);
    return attempt;
  }, []);

  const updateAttempt = useCallback((updated: ExamAttempt) => {
    setAttempts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }, []);

  const submitAttempt = useCallback(
    (attemptId: string): ExamResult => {
      const attempt = attempts.find((a) => a.id === attemptId);
      if (!attempt) throw new Error("Attempt not found");
      const exam = exams.find((e) => e.id === attempt.examId);
      if (!exam) throw new Error("Exam not found");

      const submitted = { ...attempt, submittedAt: new Date().toISOString(), status: "submitted" as const };
      setAttempts((prev) => prev.map((a) => (a.id === attemptId ? submitted : a)));

      const result = calculateResult(exam, submitted);
      setResults((prev) => [...prev, result]);
      return result;
    },
    [attempts, exams]
  );

  const getAttempt = useCallback((id: string) => attempts.find((a) => a.id === id), [attempts]);

  const getResultsForUser = useCallback(
    (userId: string) => {
      const userAttemptIds = new Set(attempts.filter((a) => a.userId === userId).map((a) => a.id));
      return results.filter((r) => userAttemptIds.has(r.attemptId));
    },
    [attempts, results]
  );

  return (
    <ExamContext.Provider
      value={{ exams, attempts, results, addExam, startAttempt, updateAttempt, submitAttempt, getExam, getAttempt, getResultsForUser }}
    >
      {children}
    </ExamContext.Provider>
  );
}

export function useExams() {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error("useExams must be used within ExamProvider");
  return ctx;
}
