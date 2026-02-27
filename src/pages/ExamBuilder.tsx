import { useState } from "react";
import { useExams } from "@/contexts/ExamContext";
import { useAuth } from "@/contexts/AuthContext";
import { Exam, Subject, Topic, Question, QuestionOption, MarkingScheme } from "@/types/exam";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

function genId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function ExamBuilder() {
  const { addExam } = useExams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [correctMark, setCorrectMark] = useState(4);
  const [incorrectMark, setIncorrectMark] = useState(-1);
  const [shuffleQ, setShuffleQ] = useState(false);
  const [shuffleO, setShuffleO] = useState(false);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState("");

  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [newTopicSubject, setNewTopicSubject] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);

  // Question form
  const [qText, setQText] = useState("");
  const [qOpts, setQOpts] = useState(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState(0);
  const [qDifficulty, setQDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [qSubject, setQSubject] = useState("");
  const [qTopic, setQTopic] = useState("");

  const addSubject = () => {
    if (!newSubject.trim()) return;
    setSubjects((prev) => [...prev, { id: genId(), name: newSubject.trim() }]);
    setNewSubject("");
  };

  const addTopic = () => {
    if (!newTopic.trim() || !newTopicSubject) return;
    setTopics((prev) => [...prev, { id: genId(), name: newTopic.trim(), subjectId: newTopicSubject }]);
    setNewTopic("");
  };

  const addQuestion = () => {
    if (!qText.trim() || qOpts.some((o) => !o.trim()) || !qSubject) {
      toast.error("Please fill all question fields");
      return;
    }
    const opts: QuestionOption[] = qOpts.map((text, i) => ({ id: genId(), text: text.trim() }));
    const q: Question = {
      id: genId(), text: qText.trim(), options: opts, correctOptionId: opts[qCorrect].id,
      difficulty: qDifficulty, subjectId: qSubject, topicId: qTopic || "",
    };
    setQuestions((prev) => [...prev, q]);
    setQText(""); setQOpts(["", "", "", ""]); setQCorrect(0);
    toast.success("Question added");
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) { toast.error("Exam title is required"); return; }
    if (questions.length === 0) { toast.error("Add at least one question"); return; }
    if (subjects.length === 0) { toast.error("Add at least one subject"); return; }

    const exam: Exam = {
      id: genId(), title: title.trim(), description: description.trim(), duration,
      subjects, topics, questions,
      markingScheme: { correct: correctMark, incorrect: incorrectMark, unattempted: 0 },
      shuffleQuestions: shuffleQ, shuffleOptions: shuffleO,
      createdBy: user?.id || "", createdAt: new Date().toISOString(),
    };
    addExam(exam);
    toast.success("Exam created successfully!");
    navigate("/exams");
  };

  const filteredTopics = topics.filter((t) => t.subjectId === qSubject);

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Create New Exam</h1>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Exam Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. General Aptitude Test 2025" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the exam" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(+e.target.value)} min={1} />
            </div>
            <div className="space-y-2">
              <Label>Correct (+)</Label>
              <Input type="number" value={correctMark} onChange={(e) => setCorrectMark(+e.target.value)} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Incorrect (-)</Label>
              <Input type="number" value={incorrectMark} onChange={(e) => setIncorrectMark(+e.target.value)} max={0} />
            </div>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2"><Switch checked={shuffleQ} onCheckedChange={setShuffleQ} /><Label>Shuffle Questions</Label></div>
            <div className="flex items-center gap-2"><Switch checked={shuffleO} onCheckedChange={setShuffleO} /><Label>Shuffle Options</Label></div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Subjects</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Subject name" onKeyDown={(e) => e.key === "Enter" && addSubject()} />
            <Button onClick={addSubject} size="sm"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <Badge key={s.id} variant="secondary" className="gap-1">
                {s.name}
                <button onClick={() => setSubjects((prev) => prev.filter((x) => x.id !== s.id))} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Topics */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Topics</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Select value={newTopicSubject} onValueChange={setNewTopicSubject}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="Topic name" className="flex-1" onKeyDown={(e) => e.key === "Enter" && addTopic()} />
            <Button onClick={addTopic} size="sm"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <Badge key={t.id} variant="outline" className="gap-1">
                {subjects.find((s) => s.id === t.subjectId)?.name}: {t.name}
                <button onClick={() => setTopics((prev) => prev.filter((x) => x.id !== t.id))} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Question */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Add Question</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Question Text</Label>
            <Textarea value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Enter the question" />
          </div>
          <div className="space-y-2">
            {qOpts.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${i === qCorrect ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
                  onClick={() => setQCorrect(i)}
                >
                  {String.fromCharCode(65 + i)}
                </button>
                <Input value={opt} onChange={(e) => { const n = [...qOpts]; n[i] = e.target.value; setQOpts(n); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} className="flex-1" />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Click the letter to mark the correct answer</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={qDifficulty} onValueChange={(v) => setQDifficulty(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={qSubject} onValueChange={setQSubject}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Select value={qTopic} onValueChange={setQTopic}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{filteredTopics.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addQuestion}><Plus className="h-4 w-4 mr-1" /> Add Question</Button>
        </CardContent>
      </Card>

      {/* Questions List */}
      {questions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Questions ({questions.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground mt-1">Q{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{q.text}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">{q.difficulty}</Badge>
                    <Badge variant="secondary" className="text-xs">{subjects.find((s) => s.id === q.subjectId)?.name}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeQuestion(q.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button size="lg" onClick={handleSave} disabled={!title.trim() || questions.length === 0}>
          <CheckCircle className="h-4 w-4 mr-2" /> Save Exam
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate("/exams")}>Cancel</Button>
      </div>
    </div>
  );
}
