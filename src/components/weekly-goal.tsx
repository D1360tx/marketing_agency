"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target } from "lucide-react";

export function WeeklyGoal({ contacted }: { contacted: number }) {
  const [goal, setGoal] = useState(50);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("50");

  useEffect(() => {
    const stored = localStorage.getItem("weeklyContactGoal");
    if (stored) {
      setGoal(parseInt(stored));
      setDraft(stored);
    }
  }, []);

  function saveGoal() {
    const n = parseInt(draft);
    if (!isNaN(n) && n > 0) {
      setGoal(n);
      localStorage.setItem("weeklyContactGoal", String(n));
    }
    setEditing(false);
  }

  const pct = Math.min(100, Math.round((contacted / goal) * 100));
  const color =
    pct >= 100 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-blue-500";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4" /> Weekly Goal
          </span>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            edit
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-8 w-20 text-sm"
              type="number"
              min="1"
            />
            <Button size="sm" className="h-8" onClick={saveGoal}>
              Save
            </Button>
          </div>
        ) : (
          <div className="text-2xl font-bold">
            {contacted}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              / {goal} contacts
            </span>
          </div>
        )}
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {pct >= 100
            ? "🎉 Goal reached this week!"
            : `${goal - contacted} more to hit your goal`}
        </p>
      </CardContent>
    </Card>
  );
}
