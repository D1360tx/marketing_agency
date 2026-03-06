import { createClient } from "@/lib/supabase/server";
import { StatsCards } from "@/components/stats-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, Mail, Users, Phone, TrendingUp, CalendarClock } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [prospectsResult, campaignsResult, weekActivitiesResult, followUpsTodayResult] =
    await Promise.all([
      supabase.from("prospects").select("status", { count: "exact", head: false }),
      supabase.from("campaigns").select("sent_count", { count: "exact", head: false }),
      supabase
        .from("prospect_activities")
        .select("id, metadata")
        .eq("activity_type", "status_changed")
        .gte("created_at", weekAgo.toISOString()),
      supabase
        .from("prospects")
        .select("id", { count: "exact", head: false })
        .eq("status", "follow_up")
        .lte("follow_up_date", new Date().toISOString().split("T")[0]),
    ]);

  const prospects = prospectsResult.data || [];
  const campaigns = campaignsResult.data || [];

  const totalProspects = prospects.length;
  const newLeads = prospects.filter((p) => p.status === "new").length;
  const clients = prospects.filter((p) => p.status === "client").length;
  const campaignsSent = campaigns.length;
  const conversionRate =
    totalProspects > 0 ? Math.round((clients / totalProspects) * 100) : 0;

  const contactedThisWeek = (weekActivitiesResult.data || []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a) => (a.metadata as any)?.new_status === "contacted"
  ).length;

  const warmLeads = prospects.filter((p) =>
    ["interested", "follow_up"].includes(p.status)
  ).length;

  const followUpsToday = followUpsTodayResult.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{user?.email ? `, ${user.email}` : ""}
        </p>
      </div>

      <StatsCards
        stats={{
          totalProspects,
          newLeads,
          campaignsSent,
          conversionRate,
        }}
      />

      {/* Outreach Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Follow-ups Due Today
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{followUpsToday}</div>
            <Link href="/tasks" className="text-xs text-primary hover:underline">
              View tasks →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Warm Leads
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warmLeads}</div>
            <p className="text-xs text-muted-foreground">Interested + follow up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contacted This Week
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactedThisWeek}</div>
            <p className="text-xs text-muted-foreground">Status moved to contacted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Prospects
            </CardTitle>
            <CardDescription>
              Search Google Maps for businesses that need your services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/prospector">
              <Button className="w-full">Start Searching</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Leads
            </CardTitle>
            <CardDescription>
              Track your prospects through the sales pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/leads">
              <Button variant="outline" className="w-full">
                View Pipeline
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Run Campaigns
            </CardTitle>
            <CardDescription>
              Send personalized outreach to your prospects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/campaigns">
              <Button variant="outline" className="w-full">
                Create Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
