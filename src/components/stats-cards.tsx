import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Search, Mail, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalProspects: number;
    newLeads: number;
    campaignsSent: number;
    conversionRate: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Prospects",
      value: stats.totalProspects.toLocaleString(),
      icon: Search,
      description: "Businesses found",
    },
    {
      title: "New Leads",
      value: stats.newLeads.toLocaleString(),
      icon: Users,
      description: "Ready for outreach",
    },
    {
      title: "Campaigns Sent",
      value: stats.campaignsSent.toLocaleString(),
      icon: Mail,
      description: "Email campaigns",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      description: "Leads to clients",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
