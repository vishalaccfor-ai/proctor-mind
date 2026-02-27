import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, User, Shield } from "lucide-react";

export default function Login() {
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">ExamPro</CardTitle>
          <CardDescription>AI-Powered Online Examination Platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground text-center mb-4">Select a role to continue (Demo Mode)</p>
          <Button className="w-full h-12 text-base gap-3" onClick={() => login("student")}>
            <User className="h-5 w-5" />
            Continue as Student
          </Button>
          <Button variant="outline" className="w-full h-12 text-base gap-3" onClick={() => login("admin")}>
            <Shield className="h-5 w-5" />
            Continue as Admin
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
