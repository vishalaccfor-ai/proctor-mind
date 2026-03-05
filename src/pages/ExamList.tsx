import { useEffect } from "react";
import { useExams } from "@/contexts/ExamContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, HelpCircle, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ExamList() {
  const { exams, loading, fetchExams } = useExams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchExams(); }, [fetchExams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Available Exams</h1>
          <p className="text-muted-foreground">{loading ? "Loading..." : `${exams.length} exams available`}</p>
        </div>
        {user?.role === "admin" && (
          <Button onClick={() => navigate("/admin/exam-builder")}>Create Exam</Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{exam.title}</CardTitle>
              <CardDescription>{exam.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {exam.subjects.map((s) => (
                  <Badge key={s.id} variant="secondary">{s.name}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{exam.duration} min</span>
                <span className="flex items-center gap-1"><HelpCircle className="h-4 w-4" />{exam.questions.length} Qs</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Marking: +{exam.markingScheme.correct} / {exam.markingScheme.incorrect} per question
              </div>
              {user?.role === "student" && (
                <Button className="w-full" onClick={() => navigate(`/exam/${exam.id}`)}>
                  <BookOpen className="h-4 w-4 mr-2" /> Start Exam
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
