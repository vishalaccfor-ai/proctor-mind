import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useExams } from "@/contexts/ExamContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, MinusCircle, Clock, ArrowLeft, BarChart3 } from "lucide-react";

export default function Results() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { results, fetchResults } = useExams();
  const { user } = useAuth();

  useEffect(() => { fetchResults(); }, [fetchResults]);

  if (!attemptId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Results</h1>
        {results.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No exam results yet. Take an exam to see your results here.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {results.map((r) => (
              <Card key={r.attemptId} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/results/${r.attemptId}`)}>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="font-semibold text-lg">{r.examTitle}</p>
                    <p className="text-sm text-muted-foreground">{new Date(r.submittedAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{r.percentage.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">{r.totalScore}/{r.maxScore} marks</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  const result = results.find((r) => r.attemptId === attemptId);
  if (!result) return <div className="text-center text-muted-foreground p-6">Result not found</div>;

  const scorePct = Math.max(0, result.percentage);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/results")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{result.examTitle}</h1>
          <p className="text-sm text-muted-foreground">Submitted {new Date(result.submittedAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                  strokeDasharray={`${scorePct} 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{result.percentage.toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-lg font-semibold">{result.totalScore} / {result.maxScore}</p>
            <p className="text-sm text-muted-foreground">Total Score</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-lg">Summary</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div><p className="text-xl font-bold">{result.correct}</p><p className="text-sm text-muted-foreground">Correct</p></div>
            </div>
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-destructive" />
              <div><p className="text-xl font-bold">{result.incorrect}</p><p className="text-sm text-muted-foreground">Incorrect</p></div>
            </div>
            <div className="flex items-center gap-3">
              <MinusCircle className="h-5 w-5 text-muted-foreground" />
              <div><p className="text-xl font-bold">{result.unattempted}</p><p className="text-sm text-muted-foreground">Unattempted</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div><p className="text-xl font-bold">{Math.round(result.timeTaken / 60)}m</p><p className="text-sm text-muted-foreground">Time Taken</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Section-wise Breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {result.subjectResults.map((sr) => (
            <div key={sr.subjectId} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{sr.subjectName}</span>
                <span className="text-sm text-muted-foreground">
                  {sr.correct}/{sr.totalQuestions} correct · {sr.accuracy.toFixed(0)}% accuracy · Avg {sr.avgTimePerQuestion.toFixed(0)}s/Q
                </span>
              </div>
              <Progress value={sr.accuracy} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg text-green-600">Strong Areas</CardTitle></CardHeader>
          <CardContent>
            {result.subjectResults.filter((s) => s.accuracy >= 50).length === 0 ? (
              <p className="text-muted-foreground text-sm">No strong areas identified yet.</p>
            ) : (
              <div className="space-y-2">
                {result.subjectResults.filter((s) => s.accuracy >= 50).map((s) => (
                  <div key={s.subjectId} className="flex justify-between">
                    <span>{s.subjectName}</span>
                    <Badge variant="secondary">{s.accuracy.toFixed(0)}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg text-destructive">Weak Areas</CardTitle></CardHeader>
          <CardContent>
            {result.subjectResults.filter((s) => s.accuracy < 50).length === 0 ? (
              <p className="text-muted-foreground text-sm">No weak areas — great job!</p>
            ) : (
              <div className="space-y-2">
                {result.subjectResults.filter((s) => s.accuracy < 50).map((s) => (
                  <div key={s.subjectId} className="flex justify-between">
                    <span>{s.subjectName}</span>
                    <Badge variant="destructive">{s.accuracy.toFixed(0)}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Button variant="outline" onClick={() => navigate("/analytics")}><BarChart3 className="h-4 w-4 mr-2" /> View Full Analytics</Button>
    </div>
  );
}
