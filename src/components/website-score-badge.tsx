import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WebsiteGrade } from "@/types";

const gradeColors: Record<WebsiteGrade, string> = {
  A: "bg-emerald-100 text-emerald-800 border-emerald-200",
  B: "bg-blue-100 text-blue-800 border-blue-200",
  C: "bg-amber-100 text-amber-800 border-amber-200",
  D: "bg-orange-100 text-orange-800 border-orange-200",
  F: "bg-red-100 text-red-800 border-red-200",
};

interface WebsiteScoreBadgeProps {
  grade: WebsiteGrade | null;
  size?: "sm" | "lg";
}

export function WebsiteScoreBadge({
  grade,
  size = "sm",
}: WebsiteScoreBadgeProps) {
  if (!grade) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        N/A
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        gradeColors[grade],
        size === "lg" && "px-3 py-1 text-lg font-bold"
      )}
    >
      {grade}
    </Badge>
  );
}

export function NoWebsiteBadge() {
  return (
    <Badge
      variant="outline"
      className="border-red-200 bg-red-50 text-red-700"
    >
      No Website
    </Badge>
  );
}
