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
import { Search, Mail, Users } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch stats
  const [prospectsResult, campaignsResult] = await Promise.all([
    supabase
      .from("prospects")
      .select("status", { count: "exact", head: false }),
    supabase
      .from("campaigns")
      .select("sent_count", { count: "exact", head: false }),
  ]);

  const prospects = prospectsResult.data || [];
  const campaigns = campaignsResult.data || [];

  const totalProspects = prospects.length;
  const newLeads = prospects.filter((p) => p.status === "new").length;
  const clients = prospects.filter((p) => p.status === "client").length;
  const campaignsSent = campaigns.length;
  const conversionRate =
    totalProspects > 0 ? Math.round((clients / totalProspects) * 100) : 0;

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
