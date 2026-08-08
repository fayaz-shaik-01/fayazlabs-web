"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { LogIn, LogOut } from "lucide-react";

export function UserMenu() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (isLoading) {
    return (
      <div className="h-8 w-8 rounded-[2px] bg-muted animate-pulse" />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-8 w-8 items-center justify-center rounded-[2px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <LogIn className="h-3.5 w-3.5" />
        <span className="sr-only">Sign in</span>
      </Link>
    );
  }

  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-[2px] overflow-hidden border border-border bg-muted text-xs font-semibold text-foreground transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName ?? user.email}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg z-50">
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-sm font-medium truncate">
              {user.displayName ?? "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await logout();
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
