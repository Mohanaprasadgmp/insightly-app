import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely, resolving conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert a string to a URL-safe slug */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Format a date range for report titles */
export function formatDateRange(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const endStr = end.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  return startStr === endStr ? startStr : `${startStr} – ${endStr}`;
}

/** Format large numbers with commas */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/** Format a number as a percentage */
export function formatPercent(n: number, decimals = 1): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`;
}

/** Get initials from a name (up to 2 letters) */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Map a ReportStatus to a display-friendly badge variant */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "bg-zinc-500/15 text-zinc-400",
    GENERATING: "bg-yellow-500/15 text-yellow-400",
    READY: "bg-blue-500/15 text-blue-400",
    APPROVED: "bg-brand-500/15 text-brand-400",
    SENT: "bg-emerald-500/15 text-emerald-400",
    SCHEDULED: "bg-orange-500/15 text-orange-400",
    CONNECTED: "bg-emerald-500/15 text-emerald-400",
    DISCONNECTED: "bg-zinc-500/15 text-zinc-400",
    PENDING: "bg-yellow-500/15 text-yellow-400",
    ERROR: "bg-red-500/15 text-red-400",
  };
  return map[status] ?? "bg-zinc-500/15 text-zinc-400";
}
