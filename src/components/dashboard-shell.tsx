"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Search,
  Users,
  Mail,
  Settings,
  LogOut,
  Menu,
  Megaphone,
  Globe,
  Zap,
  BarChart3,
  Star,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Prospector", href: "/prospector", icon: Search },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Campaigns", href: "/campaigns", icon: Mail },
  { name: "Sequences", href: "/sequences", icon: Zap },
  { name: "Generator", href: "/generator", icon: Globe },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Reviews", href: "/reviews", icon: Star },
  { name: "Settings", href: "/settings", icon: Settings },
];

function useTasksCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/prospects");
        if (!res.ok) return;
        const data = await res.json();
        const today = new Date().toISOString().split("T")[0];
        const due = (data.prospects || []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p: any) => p.status === "follow_up" && p.follow_up_date && p.follow_up_date <= today
        ).length;
        setCount(due);
      } catch {
        // fail silently
      }
    }
    fetchCount();
  }, []);

  return count;
}

function SidebarContent({ pathname }: { pathname: string }) {
  const router = useRouter();
  const tasksCount = useTasksCount();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Megaphone className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold">Booked Out</span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.name}</span>
              {item.name === "Tasks" && tasksCount > 0 && (
                <Badge className="h-5 min-w-5 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white hover:bg-red-500">
                  {tasksCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="px-3 py-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 border-r bg-card md:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="flex flex-1 flex-col">
          {/* Mobile header */}
          <header className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Megaphone className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold">Booked Out</span>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/40 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent pathname={pathname} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
