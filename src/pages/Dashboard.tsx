import { useAuth } from "@/contexts/AuthContext";
import { useExams } from "@/contexts/ExamContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const { exams, getResultsForUser } = useExams();
  const navigate = useNavigate();

  const results = user ? getResultsForUser(user.id) : [];
  const avgScore = results.length > 0 ? results.reduce((s, r) => s + r.percentage, 0) / results.length : 0;

  const stats = [
    { label: "Available Exams", value: exams.length, icon: BookOpen, color: "text-blue-600" },
    { label: "Exams Taken", value: results.length, icon: CheckCircle, color: "text-green-600" },
    { label: "Avg Score", value: `${avgScore.toFixed(1)}%`, icon: TrendingUp, color: "text-orange-600" },
    { label: "Total Time", value: `${Math.round(results.reduce((s, r) => s + r.timeTaken, 0) / 60)}m`, icon: Clock, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground">
          {user?.role === "admin" ? "Manage exams and view analytics" : "Take exams and track your progress"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={() => navigate("/exams")}>
          {user?.role === "admin" ? "Manage Exams" : "Browse Exams"}
        </Button>
        {user?.role === "admin" && (
          <Button variant="outline" onClick={() => navigate("/admin/exam-builder")}>Create New Exam</Button>
        )}
        {results.length > 0 && (
          <Button variant="outline" onClick={() => navigate("/analytics")}>View Analytics</Button>
        )}
      </div>

      {results.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Results</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.slice(-3).reverse().map((r) => (
                <div key={r.attemptId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{r.examTitle}</p>
                    <p className="text-sm text-muted-foreground">{new Date(r.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{r.percentage.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">{r.correct}/{r.totalQuestions} correct</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
