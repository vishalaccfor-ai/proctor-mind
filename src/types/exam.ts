export interface Subject {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  name: string;
  subjectId: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  correctOptionId: string;
  difficulty: "easy" | "medium" | "hard";
  subjectId: string;
  topicId: string;
  imageUrl?: string;
}

export interface MarkingScheme {
  correct: number;
  incorrect: number; // negative value for negative marking, 0 for no penalty
  unattempted: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  markingScheme: MarkingScheme;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Answer {
  questionId: string;
  selectedOptionId: string | null;
  markedForReview: boolean;
  timeSpent: number; // seconds
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  answers: Record<string, Answer>;
  startedAt: string;
  submittedAt: string | null;
  tabSwitchCount: number;
  status: "in-progress" | "submitted";
}

export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  isAttempted: boolean;
  marksAwarded: number;
  timeSpent: number;
  subjectId: string;
  topicId: string;
}

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  score: number;
  maxScore: number;
  accuracy: number;
  avgTimePerQuestion: number;
}

export interface ExamResult {
  attemptId: string;
  examId: string;
  examTitle: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  subjectResults: SubjectResult[];
  questionResults: QuestionResult[];
  timeTaken: number; // seconds
  submittedAt: string;
}

export type UserRole = "student" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
