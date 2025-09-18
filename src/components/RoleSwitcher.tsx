import { Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleSwitcherProps {
  currentRole: "teacher" | "student";
  onRoleChange: (role: "teacher" | "student") => void;
}

export const RoleSwitcher = ({ currentRole, onRoleChange }: RoleSwitcherProps) => {
  return (
    <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg">
      <Button
        variant={currentRole === "teacher" ? "default" : "ghost"}
        size="sm"
        onClick={() => onRoleChange("teacher")}
        className="flex items-center gap-2 transition-smooth"
      >
        <Users className="h-4 w-4" />
        Teacher
      </Button>
      <Button
        variant={currentRole === "student" ? "default" : "ghost"}
        size="sm"
        onClick={() => onRoleChange("student")}
        className="flex items-center gap-2 transition-smooth"
      >
        <GraduationCap className="h-4 w-4" />
        Student
      </Button>
    </div>
  );
};