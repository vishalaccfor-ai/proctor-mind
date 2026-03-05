import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useExams, Answer, Question } from "@/contexts/ExamContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock, Flag, ChevronLeft, ChevronRight, AlertTriangle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TakeExam() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { getExam, exams, fetchExams, startAttempt, saveAnswers, submitAttempt } = useExams();
  const { user } = useAuth();

  const [exam, setExam] = useState(getExam(examId || ""));
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [started, setStarted] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  // Load exam if not in context yet
  useEffect(() => {
    if (!exam && examId) {
      fetchExams().then(() => {
        const found = exams.find((e) => e.id === examId);
        if (found) setExam(found);
      });
    }
  }, [exam, examId, exams, fetchExams]);

  // Update exam ref when exams load
  useEffect(() => {
    if (!exam && examId) {
      const found = exams.find((e) => e.id === examId);
      if (found) setExam(found);
    }
  }, [exams, examId, exam]);

  const handleStart = useCallback(async () => {
    if (!exam || !user) return;
    try {
      const id = await startAttempt(exam.id);
      setAttemptId(id);
      const now = new Date().toISOString();
      setStartedAt(now);

      let qs = [...exam.questions];
      if (exam.shuffleQuestions) qs = shuffleArray(qs);
      if (exam.shuffleOptions) qs = qs.map((q) => ({ ...q, options: shuffleArray(q.options) }));
      setQuestions(qs);
      setTimeLeft(exam.duration * 60);
      setActiveSection(exam.subjects[0]?.id || null);
      setStarted(true);
      questionStartTime.current = Date.now();
    } catch (err: any) {
      toast.error(err.message || "Failed to start exam");
    }
  }, [exam, user, startAttempt]);

  // Timer
  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started]);

  // Auto-save every 10 seconds
  useEffect(() => {
    if (!attemptId || !started) return;
    const interval = setInterval(() => {
      saveAnswers(attemptId, answers, tabSwitchCount);
    }, 10000);
    return () => clearInterval(interval);
  }, [answers, attemptId, started, tabSwitchCount, saveAnswers]);

  // Tab switch detection
  useEffect(() => {
    if (!started) return;
    const handler = () => {
      if (document.hidden) {
        setTabSwitchCount((c) => {
          const newCount = c + 1;
          toast.warning(`Tab switch detected! (${newCount} times)`, { duration: 3000 });
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [started]);

  // Prevent right-click & copy
  useEffect(() => {
    if (!started) return;
    const preventContext = (e: MouseEvent) => e.preventDefault();
    const preventCopy = (e: ClipboardEvent) => e.preventDefault();
    const preventRefresh = (e: BeforeUnloadEvent) => e.preventDefault();
    document.addEventListener("contextmenu", preventContext);
    document.addEventListener("copy", preventCopy);
    window.addEventListener("beforeunload", preventRefresh);
    return () => {
      document.removeEventListener("contextmenu", preventContext);
      document.removeEventListener("copy", preventCopy);
      window.removeEventListener("beforeunload", preventRefresh);
    };
  }, [started]);

  const updateTimeSpent = () => {
    const current = questions[currentIndex];
    if (!current) return;
    const elapsed = Math.floor((Date.now() - questionStartTime.current) / 1000);
    setAnswers((prev) => ({
      ...prev,
      [current.id]: {
        ...prev[current.id], questionId: current.id,
        selectedOptionId: prev[current.id]?.selectedOptionId || null,
        markedForReview: prev[current.id]?.markedForReview || false,
        timeSpent: (prev[current.id]?.timeSpent || 0) + elapsed,
      },
    }));
    questionStartTime.current = Date.now();
  };

  const selectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId, selectedOptionId: optionId,
        markedForReview: prev[questionId]?.markedForReview || false,
        timeSpent: prev[questionId]?.timeSpent || 0,
      },
    }));
  };

  const toggleReview = (questionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId], questionId,
        selectedOptionId: prev[questionId]?.selectedOptionId || null,
        markedForReview: !prev[questionId]?.markedForReview,
        timeSpent: prev[questionId]?.timeSpent || 0,
      },
    }));
  };

  const clearAnswer = (questionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId], questionId, selectedOptionId: null,
        markedForReview: prev[questionId]?.markedForReview || false,
        timeSpent: prev[questionId]?.timeSpent || 0,
      },
    }));
  };

  const goToQuestion = (index: number) => {
    updateTimeSpent();
    setCurrentIndex(index);
    questionStartTime.current = Date.now();
  };

  const handleSubmit = useCallback(async () => {
    if (!attemptId || !exam) return;
    updateTimeSpent();
    try {
      const result = await submitAttempt(attemptId, exam, answers, startedAt);
      navigate(`/results/${result.attemptId}`, { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit exam");
    }
  }, [attemptId, exam, submitAttempt, navigate, answers, startedAt]);

  if (!exam) {
    return <div className="p-6 text-center text-muted-foreground">Loading exam...</div>;
  }

  if (!started) {
    return (
      <div className="max-w-lg mx-auto mt-12 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-muted-foreground">{exam.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Duration:</span> {exam.duration} min</div>
              <div><span className="text-muted-foreground">Questions:</span> {exam.questions.length}</div>
              <div><span className="text-muted-foreground">Correct:</span> +{exam.markingScheme.correct}</div>
              <div><span className="text-muted-foreground">Incorrect:</span> {exam.markingScheme.incorrect}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {exam.subjects.map((s) => <Badge key={s.id} variant="secondary">{s.name}</Badge>)}
            </div>
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Important Instructions</p>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>Do not switch tabs during the exam</li>
                  <li>Right-click and copy are disabled</li>
                  <li>Exam will auto-submit when time is up</li>
                  <li>Answers are auto-saved every 10 seconds</li>
                </ul>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={handleStart}>Start Exam</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isLowTime = timeLeft < 300;
  const answered = Object.values(answers).filter((a) => a.selectedOptionId).length;
  const reviewed = Object.values(answers).filter((a) => a.markedForReview).length;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col select-none">
      <div className="border-b px-4 py-2 flex items-center justify-between bg-card">
        <h2 className="font-semibold truncate">{exam.title}</h2>
        <div className="flex items-center gap-4">
          {tabSwitchCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" /> {tabSwitchCount} tab switches
            </Badge>
          )}
          <div className={cn("flex items-center gap-1 font-mono text-lg font-bold", isLowTime && "text-destructive animate-pulse")}>
            <Clock className="h-4 w-4" /> {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
          <Button size="sm" variant="destructive" onClick={() => setShowSubmitDialog(true)}>
            <Send className="h-4 w-4 mr-1" /> Submit
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-auto p-6">
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button size="sm" variant={!activeSection ? "default" : "outline"} onClick={() => setActiveSection(null)}>All</Button>
            {exam.subjects.map((s) => (
              <Button key={s.id} size="sm" variant={activeSection === s.id ? "default" : "outline"} onClick={() => setActiveSection(s.id)}>
                {s.name}
              </Button>
            ))}
          </div>

          {currentQ && (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">Q{currentIndex + 1}/{questions.length}</Badge>
                <Badge variant="secondary" className="capitalize">{currentQ.difficulty}</Badge>
                <Badge variant="outline">{exam.subjects.find((s) => s.id === currentQ.subjectId)?.name}</Badge>
              </div>
              <p className="text-lg mb-6">{currentQ.text}</p>
              <div className="space-y-3 max-w-xl">
                {currentQ.options.map((opt, i) => (
                  <button key={opt.id} className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-colors",
                    answers[currentQ.id]?.selectedOptionId === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )} onClick={() => selectOption(currentQ.id, opt.id)}>
                    <span className="font-medium mr-3 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-6">
                <Button variant="outline" size="sm" onClick={() => toggleReview(currentQ.id)}>
                  <Flag className={cn("h-4 w-4 mr-1", answers[currentQ.id]?.markedForReview && "text-orange-500 fill-orange-500")} />
                  {answers[currentQ.id]?.markedForReview ? "Unmark Review" : "Mark for Review"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => clearAnswer(currentQ.id)}>Clear</Button>
              </div>
              <div className="flex justify-between mt-8">
                <Button variant="outline" disabled={currentIndex === 0} onClick={() => goToQuestion(currentIndex - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button disabled={currentIndex === questions.length - 1} onClick={() => goToQuestion(currentIndex + 1)}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="w-64 border-l bg-card p-4 overflow-auto hidden md:block">
          <h3 className="font-semibold mb-3 text-sm">Question Navigation</h3>
          <div className="flex gap-2 text-xs mb-4 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary" /> Answered ({answered})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-400" /> Review ({reviewed})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-muted border" /> Not visited</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => {
              const a = answers[q.id];
              const isAnswered = !!a?.selectedOptionId;
              const isReview = !!a?.markedForReview;
              const isCurrent = i === currentIndex;
              const isInSection = !activeSection || q.subjectId === activeSection;
              return (
                <button key={q.id} className={cn(
                  "w-full aspect-square rounded-md text-xs font-medium flex items-center justify-center transition-colors",
                  !isInSection && "opacity-30", isCurrent && "ring-2 ring-primary",
                  isReview ? "bg-orange-400 text-white" : isAnswered ? "bg-primary text-primary-foreground" : "bg-muted border",
                )} onClick={() => goToQuestion(i)}>{i + 1}</button>
              );
            })}
          </div>
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answered} out of {questions.length} questions.
              {questions.length - answered > 0 && ` ${questions.length - answered} questions are unattempted.`}
              {reviewed > 0 && ` ${reviewed} questions are marked for review.`}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
