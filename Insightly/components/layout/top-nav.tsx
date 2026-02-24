"use client";

import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { LogOut, User, Settings, CreditCard, Sun, Moon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

interface TopNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  pageTitle?: string;
}

export function TopNav({ user, pageTitle }: TopNavProps) {
  const initials = user.name ? getInitials(user.name) : "?";
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      {/* Page title */}
      <div>
        {pageTitle && (
          <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none text-foreground">
                  {user.name ?? "User"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/billing" className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
