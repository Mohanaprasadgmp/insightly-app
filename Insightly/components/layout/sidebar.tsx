"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          collapsed ? "justify-center" : "gap-2.5"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 shadow-lg">
          <BarChart3 className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-foreground">
              Reportiq
            </span>
            <span className="text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
              report + intelligence
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-gradient-to-r from-brand-500/20 to-cyan-500/10 text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator bar */}
              {isActive && !collapsed && (
                <span className="absolute left-0 h-8 w-0.5 rounded-r-full bg-gradient-to-b from-brand-400 to-cyan-500" />
              )}

              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-brand-400" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-accent transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
    </aside>
  );
}
