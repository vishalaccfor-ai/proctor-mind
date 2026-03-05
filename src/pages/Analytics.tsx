import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExams } from "@/contexts/ExamContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from "recharts";

export default function Analytics() {
  const { user } = useAuth();
  const { results, fetchResults } = useExams();

  useEffect(() => { fetchResults(); }, [fetchResults]);

  if (results.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Card><CardContent className="p-6 text-center text-muted-foreground">No data available. Complete an exam to see your analytics.</CardContent></Card>
      </div>
    );
  }

  const subjectMap = new Map<string, { name: string; correct: number; total: number; time: number }>();
  results.forEach((r) => {
    r.subjectResults.forEach((sr) => {
      const existing = subjectMap.get(sr.subjectId) || { name: sr.subjectName, correct: 0, total: 0, time: 0 };
      existing.correct += sr.correct;
      existing.total += sr.totalQuestions;
      existing.time += sr.avgTimePerQuestion * sr.totalQuestions;
      subjectMap.set(sr.subjectId, existing);
    });
  });

  const subjectData = Array.from(subjectMap.values()).map((s) => ({
    name: s.name, accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    avgTime: s.total > 0 ? Math.round(s.time / s.total) : 0,
  }));

  const radarData = subjectData.map((s) => ({ subject: s.name, score: s.accuracy, fullMark: 100 }));
  const trendData = [...results].reverse().map((r, i) => ({ attempt: `Attempt ${i + 1}`, score: Math.round(r.percentage), name: r.examTitle }));

  const weakSubjects = subjectData.filter((s) => s.accuracy < 50).map((s) => s.name);
  const strongSubjects = subjectData.filter((s) => s.accuracy >= 70).map((s) => s.name);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Performance Analytics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Subject-wise Accuracy</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Strength Profile</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {results.length > 1 && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-lg">Performance Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attempt" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-lg">Avg Time per Question (by Subject)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis unit="s" />
                <Tooltip />
                <Bar dataKey="avgTime" fill="hsl(var(--accent-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">📋 AI Study Plan (Mock)</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-1">7-Day Priority Topics</p>
              {weakSubjects.length > 0 ? (
                <ol className="list-decimal pl-5 space-y-1">
                  {weakSubjects.map((s, i) => (
                    <li key={s}>Day {i * 2 + 1}-{i * 2 + 2}: Focus on <strong>{s}</strong> — review concepts and practice 20 questions daily</li>
                  ))}
                  <li>Day {weakSubjects.length * 2 + 1}-7: Mixed revision across all subjects</li>
                </ol>
              ) : (
                <p className="text-muted-foreground">No weak areas detected. Keep up the great work!</p>
              )}
            </div>
            <div>
              <p className="font-medium mb-1">Strategy Recommendations</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Spend more time on accuracy over speed</li>
                <li>Attempt all questions — skip penalty is low</li>
                {strongSubjects.length > 0 && <li>Leverage strengths in {strongSubjects.join(", ")} for quick marks</li>}
                <li>Practice timed mock tests to improve time management</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground italic">* This is a mock AI study plan. Real AI integration coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
