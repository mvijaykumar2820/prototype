import { useState } from "react";
import { GraduationCap, Users, BookOpen, Brain, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WelcomePageProps {
  onLogin: (role: "teacher" | "student") => void;
}

export const WelcomePage = ({ onLogin }: WelcomePageProps) => {
  const [loginMode, setLoginMode] = useState<"select" | "teacher" | "student">("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const features = [
    {
      icon: BookOpen,
      title: "Adaptive Content",
      description: "Smart streaming based on your connection quality"
    },
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Intelligent notes and flashcards generation"
    },
    {
      icon: Users,
      title: "Collaborative Platform",
      description: "Connect teachers and students seamlessly"
    }
  ];

  const handleLogin = () => {
    // For demo purposes, we'll just call onLogin
    // In real app, this would authenticate with Supabase
    if (loginMode === "teacher" || loginMode === "student") {
      onLogin(loginMode);
    }
  };

  if (loginMode === "teacher" || loginMode === "student") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 hero-gradient">
        <Card className="w-full max-w-md card-glass text-white">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full gradient-glass flex items-center justify-center">
              {loginMode === "teacher" ? (
                <Users className="h-8 w-8 text-white" />
              ) : (
                <GraduationCap className="h-8 w-8 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                {loginMode === "teacher" ? "Teacher Login" : "Student Login"}
              </CardTitle>
              <CardDescription className="text-white/80">
                Welcome back! Please sign in to continue
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleLogin}
                className="w-full bg-white text-primary hover:bg-white/90 transition-smooth"
                size="lg"
              >
                Sign In
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setLoginMode("select")}
                className="w-full text-white hover:bg-white/10"
              >
                Back to Role Selection
              </Button>
            </div>

            <p className="text-center text-sm text-white/60">
              Don't have an account?{" "}
              <button className="text-white hover:underline font-medium">
                Contact Administrator
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Modern Learning Platform
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                Learn <span className="text-gradient">Smarter</span>,<br />
                Teach <span className="text-gradient">Better</span>
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                Professional educational platform with adaptive streaming, AI-powered content, 
                and seamless collaboration between teachers and students.
              </p>
            </div>

            {/* Role Selection Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12">
              <Card 
                className="card-glass cursor-pointer group transition-bounce hover:scale-105"
                onClick={() => setLoginMode("teacher")}
              >
                <CardHeader className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full gradient-secondary flex items-center justify-center group-hover:shadow-glow transition-smooth">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white">I'm a Teacher</CardTitle>
                    <CardDescription className="text-white/70">
                      Create content, manage students, and track progress
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-white text-secondary hover:bg-white/90 group-hover:shadow-medium transition-smooth">
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="card-glass cursor-pointer group transition-bounce hover:scale-105"
                onClick={() => setLoginMode("student")}
              >
                <CardHeader className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full gradient-accent flex items-center justify-center group-hover:shadow-glow transition-smooth">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white">I'm a Student</CardTitle>
                    <CardDescription className="text-white/70">
                      Access courses, learn adaptively, and track your progress
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-white text-accent hover:bg-white/90 group-hover:shadow-medium transition-smooth">
                    Start Learning
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-background/5 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold text-white">Why Choose Our Platform?</h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Built for modern education with accessibility, performance, and user experience at its core.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="card-glass text-center group hover:scale-105 transition-bounce">
                <CardHeader className="space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-lg gradient-primary flex items-center justify-center group-hover:shadow-glow transition-smooth">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-white/70">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};