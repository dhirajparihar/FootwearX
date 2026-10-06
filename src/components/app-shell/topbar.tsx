"use client";

import { LogOut, Store, User } from "lucide-react";
import { logout } from "@/app/actions/auth";

export function Topbar({ user, shopName }: { user: { name: string; role: string }, shopName: string }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center gap-x-2 text-sm font-semibold leading-6">
          <div className="md:hidden flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <span className="text-primary text-xs">{shopName.charAt(0)}</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span>Good evening, {user.name}</span>
              <span className="text-muted-foreground text-xs font-normal">{shopName}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="hidden md:flex items-center gap-2 text-sm font-semibold leading-6 text-foreground">
            <Store className="h-5 w-5 text-muted-foreground" />
            {shopName}
          </div>
          
          <div className="hidden md:block h-6 w-px bg-border" aria-hidden="true" />
          
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
