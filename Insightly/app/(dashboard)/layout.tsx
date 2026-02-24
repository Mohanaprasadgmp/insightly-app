"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { SignInToast } from "@/components/sign-in-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect unauthenticated users to login
  if (status === "unauthenticated") {
    redirect("/login");
  }

  // Show loading skeleton while session loads
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-brand-500" />
          <span className="text-sm">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav
          user={session!.user}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        <SignInToast />
      </div>
    </div>
  );
}
