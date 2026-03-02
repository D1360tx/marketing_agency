"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, ArrowLeft, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface StepForm {
  delay_days: number;
  subject_template: string;
  body_template: string;
}

const DEFAULT_STEPS: StepForm[] = [
  {
    delay_days: 0,
    subject_template:
      "{{business_name}} — Your website could be costing you customers",
    body_template: `Hi there,

I came across {{business_name}} while researching {{business_type}} businesses in {{city}} and noticed your website might be holding you back.

Your current site scored a {{website_grade}} — which means potential customers may be leaving before they ever contact you.

I help local businesses like yours get a modern, fast, mobile-friendly website that actually converts visitors into calls and bookings.

Would you be open to a quick 5-minute chat about how we could improve your online presence?

Best regards`,
  },
  {
    delay_days: 3,
    subject_template: "Quick follow-up — {{business_name}}",
    body_template: `Hi again,

Just following up on my note from a few days ago about {{business_name}}'s website.

I've actually put together a preview of what a refreshed site could look like for you — modern design, fast loading, and optimized for mobile.

If you'd like to see it, just reply and I'll send over the link. No obligation at all.

Best regards`,
  },
  {
    delay_days: 7,
    subject_template: "Last note — free website preview for {{business_name}}",
    body_template: `Hi,

I wanted to reach out one last time. I built a free preview of what a new website could look like for {{business_name}} — no strings attached.

Here are a few things it includes:
• Mobile-optimized design that loads in under 2 seconds
• Clear calls-to-action so customers can reach you easily
• Professional look that builds trust with new visitors

If you'd like to see it, just reply with "Send it over" and I'll share the link.

Either way, I wish you all the best with {{business_name}}!

Best regards`,
  },
];

export default function NewSequencePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [steps, setSteps] = useState<StepForm[]>(DEFAULT_STEPS);
  const [saving, setSaving] = useState(false);

  function addStep() {
    const lastStep = steps[steps.length - 1];
    setSteps([
      ...steps,
      {
        delay_days: (lastStep?.delay_days || 0) + 3,
        subject_template: "",
        body_template: "",
      },
    ]);
  }

  function removeStep(index: number) {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  }

  function updateStep(index: number, field: keyof StepForm, value: string | number) {
    setSteps(
      steps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Sequence name is required");
      return;
    }

    if (steps.some((s) => !s.body_template.trim())) {
      toast.error("All steps must have a message body");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/drip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          channel,
          steps: steps.map((s) => ({
            delay_days: s.delay_days,
            subject_template:
              channel === "email" ? s.subject_template || null : null,
            body_template: s.body_template,
          })),
        }),
      });

      if (res.ok) {
        toast.success("Sequence created!");
        router.push("/sequences");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create sequence");
      }
    } catch {
      toast.error("Failed to create sequence");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            New Drip Sequence
          </h1>
          <p className="text-muted-foreground">
            Create a multi-step automated outreach sequence
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sequence Details</CardTitle>
            <CardDescription>
              Name your sequence and choose the outreach channel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sequence Name</Label>
              <Input
                id="name"
                placeholder="e.g., Plumber Outreach - Austin TX"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Brief description of this sequence"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select
                value={channel}
                onValueChange={(v) => setChannel(v as "email" | "sms")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sequence Steps</CardTitle>
            <CardDescription>
              Each step sends a message after a delay. Use {"{{business_name}}"},{" "}
              {"{{city}}"}, {"{{website_grade}}"}, {"{{rating}}"} as template
              variables.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="space-y-4">
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold">
                      Step {index + 1}
                    </h4>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                    >
                      {step.delay_days === 0
                        ? "Immediately"
                        : `Day ${step.delay_days}`}
                    </Badge>
                  </div>
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                  <div className="space-y-2">
                    <Label>Delay (days)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={step.delay_days}
                      onChange={(e) =>
                        updateStep(
                          index,
                          "delay_days",
                          parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    {channel === "email" && (
                      <>
                        <Label>Subject Line</Label>
                        <Input
                          placeholder="Email subject..."
                          value={step.subject_template}
                          onChange={(e) =>
                            updateStep(
                              index,
                              "subject_template",
                              e.target.value
                            )
                          }
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Message Body</Label>
                  <Textarea
                    rows={8}
                    placeholder="Write your message..."
                    value={step.body_template}
                    onChange={(e) =>
                      updateStep(index, "body_template", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addStep}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Create Sequence
          </Button>
        </div>
      </form>
    </div>
  );
}
