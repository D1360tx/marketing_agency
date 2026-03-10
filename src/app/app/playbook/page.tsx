"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  PhoneCall,
  ShieldAlert,
  DollarSign,
  HelpCircle,
  Mail,
  Loader2,
} from "lucide-react";

type PlaybookSection = {
  id: string;
  category: string;
  title: string;
  content: string;
  sort_order: number;
};

const CATEGORIES = [
  { key: "scripts", label: "Call Scripts", icon: PhoneCall, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { key: "objections", label: "Objection Handling", icon: ShieldAlert, color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { key: "pricing", label: "Pricing & Packages", icon: DollarSign, color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { key: "faqs", label: "FAQs", icon: HelpCircle, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { key: "templates", label: "Follow-up Templates", icon: Mail, color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
] as const;

export default function PlaybookPage() {
  const [sections, setSections] = useState<PlaybookSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchSections() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("playbook_sections")
        .select("*")
        .order("category")
        .order("sort_order");

      if (!error && data) {
        setSections(data);
      }
      setLoading(false);
    }
    fetchSections();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q)
    );
  }, [sections, search]);

  const grouped = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: filtered.filter((s) => s.category === cat.key),
    }));
  }, [filtered]);

  const hasResults = grouped.some((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Playbook</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scripts, objection handling, pricing &amp; templates — everything you need during a sales call.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search playbook..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading playbook...
        </div>
      ) : !hasResults ? (
        <div className="py-16 text-center text-muted-foreground">
          {search ? `No results for "${search}"` : "No playbook content yet. Run the Supabase migration to seed data."}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((cat) => {
            if (cat.items.length === 0) return null;
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="rounded-lg border bg-card">
                {/* Category header */}
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${cat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="font-semibold">{cat.label}</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {cat.items.length}
                  </Badge>
                </div>

                {/* Accordion items */}
                <Accordion type="multiple" className="px-1">
                  {cat.items.map((item) => (
                    <AccordionItem key={item.id} value={item.id} className="border-b last:border-0">
                      <AccordionTrigger className="px-3 py-3 text-sm font-medium hover:no-underline">
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-4">
                        <div className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm leading-relaxed text-muted-foreground">
                          {item.content}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
