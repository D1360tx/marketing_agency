"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  TrendingUp,
  Mail,
  Eye,
  MousePointer,
  MessageSquare,
  Users,
  UserCheck,
  Target,
  ArrowRight,
} from "lucide-react";

interface Analytics {
  funnel: {
    prospects: number;
    contacted: number;
    interested: number;
    clients: number;
  };
  emailStats: {
    total_sent: number;
    total_opened: number;
    total_replied: number;
    total_clicks: number;
    open_rate: number;
    reply_rate: number;
    click_rate: number;
  };
  campaignStats: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    created_at: string;
    stats: {
      sent: number;
      opened: number;
      replied: number;
      open_rate: number;
      reply_rate: number;
    };
  }>;
  sequenceStats: Array<{
    id: string;
    name: string;
    channel: string;
    status: string;
    stats: {
      total_enrolled: number;
      active: number;
      completed: number;
    };
  }>;
  activityTimeline: Array<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }>;
  totals: {
    prospects: number;
    campaigns: number;
    sequences: number;
    enrollments: number;
    uniqueOpens: number;
    uniqueClicks: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        setData(json);
      } catch {
        console.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Failed to load analytics
      </div>
    );
  }

  const { funnel, emailStats, campaignStats, sequenceStats, activityTimeline } =
    data;

  // Find max value for the activity chart bars
  const maxActivity = Math.max(
    ...activityTimeline.map((d) => d.sent + d.opened + d.clicked),
    1
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your outreach performance and conversion funnel
        </p>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Conversion Funnel
          </CardTitle>
          <CardDescription>
            How prospects move through your pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            {[
              {
                label: "Prospects",
                value: funnel.prospects,
                icon: Users,
                color: "bg-blue-100 text-blue-700",
              },
              {
                label: "Contacted",
                value: funnel.contacted,
                icon: Mail,
                color: "bg-yellow-100 text-yellow-700",
              },
              {
                label: "Interested",
                value: funnel.interested,
                icon: TrendingUp,
                color: "bg-orange-100 text-orange-700",
              },
              {
                label: "Clients",
                value: funnel.clients,
                icon: UserCheck,
                color: "bg-green-100 text-green-700",
              },
            ].map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex flex-col items-center justify-center rounded-lg p-4 flex-1 ${stage.color}`}
                >
                  <stage.icon className="h-6 w-6 mb-1" />
                  <div className="text-2xl font-bold">{stage.value}</div>
                  <div className="text-xs font-medium">{stage.label}</div>
                  {i > 0 && funnel.prospects > 0 && (
                    <div className="text-[10px] mt-1 opacity-70">
                      {Math.round((stage.value / funnel.prospects) * 100)}%
                    </div>
                  )}
                </div>
                {i < 3 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Performance */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailStats.total_sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailStats.open_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {emailStats.total_opened} opened
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailStats.click_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {emailStats.total_clicks} clicks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailStats.reply_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {emailStats.total_replied} replies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline (last 30 days) */}
      <Card>
        <CardHeader>
          <CardTitle>Activity (Last 30 Days)</CardTitle>
          <CardDescription>
            Daily sent, opened, and clicked metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-[2px] h-40">
            {activityTimeline.map((day) => {
              const total = day.sent + day.opened + day.clicked;
              const height = maxActivity > 0 ? (total / maxActivity) * 100 : 0;

              return (
                <div
                  key={day.date}
                  className="flex-1 group relative"
                  title={`${day.date}: ${day.sent} sent, ${day.opened} opened, ${day.clicked} clicked`}
                >
                  <div className="flex flex-col justify-end h-40">
                    {day.clicked > 0 && (
                      <div
                        className="bg-emerald-500 rounded-t-sm min-h-[2px]"
                        style={{
                          height: `${(day.clicked / maxActivity) * 100}%`,
                        }}
                      />
                    )}
                    {day.opened > 0 && (
                      <div
                        className="bg-blue-500 min-h-[2px]"
                        style={{
                          height: `${(day.opened / maxActivity) * 100}%`,
                        }}
                      />
                    )}
                    {day.sent > 0 && (
                      <div
                        className="bg-gray-300 min-h-[2px]"
                        style={{
                          height: `${(day.sent / maxActivity) * 100}%`,
                        }}
                      />
                    )}
                    {total === 0 && (
                      <div className="bg-gray-100 min-h-[1px] rounded-t-sm" />
                    )}
                  </div>
                  {/* Tooltip on hover */}
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                    {day.date.slice(5)}: {day.sent}s {day.opened}o {day.clicked}c
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>{activityTimeline[0]?.date.slice(5)}</span>
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                Sent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Opened
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Clicked
              </span>
            </div>
            <span>{activityTimeline[activityTimeline.length - 1]?.date.slice(5)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      {campaignStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Open Rate</TableHead>
                  <TableHead>Replied</TableHead>
                  <TableHead>Reply Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignStats.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.type}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.status}</Badge>
                    </TableCell>
                    <TableCell>{c.stats.sent}</TableCell>
                    <TableCell>{c.stats.opened}</TableCell>
                    <TableCell>
                      <span
                        className={
                          c.stats.open_rate >= 30
                            ? "text-green-600 font-medium"
                            : c.stats.open_rate >= 15
                              ? "text-yellow-600"
                              : "text-red-500"
                        }
                      >
                        {c.stats.open_rate}%
                      </span>
                    </TableCell>
                    <TableCell>{c.stats.replied}</TableCell>
                    <TableCell>
                      <span
                        className={
                          c.stats.reply_rate >= 5
                            ? "text-green-600 font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {c.stats.reply_rate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sequence Performance */}
      {sequenceStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Drip Sequence Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sequence</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Completion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sequenceStats.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.channel}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.status}</Badge>
                    </TableCell>
                    <TableCell>{s.stats.total_enrolled}</TableCell>
                    <TableCell>{s.stats.active}</TableCell>
                    <TableCell>{s.stats.completed}</TableCell>
                    <TableCell>
                      {s.stats.total_enrolled > 0
                        ? Math.round(
                            (s.stats.completed / s.stats.total_enrolled) * 100
                          )
                        : 0}
                      %
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
