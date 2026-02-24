"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme === "light" ? "light" : "dark"}
      toastOptions={{
        classNames: {
          toast: "!bg-card !border-border !text-foreground",
          title: "!text-foreground",
          description: "!text-muted-foreground",
          success: "!border-emerald-500/30",
          error: "!border-destructive/30",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <ThemedToaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
