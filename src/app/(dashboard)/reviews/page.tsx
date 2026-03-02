"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Star, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ReviewsPage() {
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    business_name: "",
    google_review_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/reviews/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send review request");
        return;
      }

      setSent(true);
      toast.success("Review request sent!");
      setForm({ customer_name: "", customer_email: "", business_name: "", google_review_url: "" });
      setTimeout(() => setSent(false), 4000);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review Requests</h1>
        <p className="text-muted-foreground">
          Send customers a quick email asking them to leave a Google review.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Send Review Request
            </CardTitle>
            <CardDescription>
              Fill in the customer details and their Google review link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  placeholder="John Smith"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_email">Customer Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  placeholder="john@example.com"
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  placeholder="Mike's Plumbing"
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_review_url">Google Review Link</Label>
                <Input
                  id="google_review_url"
                  type="url"
                  placeholder="https://g.page/r/..."
                  value={form.google_review_url}
                  onChange={(e) => setForm({ ...form, google_review_url: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || sent}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                ) : sent ? (
                  <><CheckCircle className="mr-2 h-4 w-4" /> Sent!</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Send Review Request</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>What the customer receives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
              <p>Customer receives a branded email from <strong>diego@trybookedout.com</strong></p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
              <p>Email thanks them for their business and includes a big <strong>"Leave a Review"</strong> button</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
              <p>One click takes them directly to the <strong>Google review page</strong> — no searching required</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
              <p>More reviews = better Google ranking = happy client = recurring revenue 💰</p>
            </div>
            <div className="mt-4 rounded-md bg-muted p-3">
              <p className="font-medium text-foreground">💡 Pro tip</p>
              <p className="mt-1">Send within 24 hours of job completion for the highest response rates.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
