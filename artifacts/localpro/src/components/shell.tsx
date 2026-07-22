import React from "react";
import { LanguageToggle } from "./language-toggle";
import { BottomNav } from "./bottom-nav";

interface ShellProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  title?: string;
  hideHeader?: boolean;
}

export function Shell({ children, showBottomNav = true, title, hideHeader = false }: ShellProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative max-w-md mx-auto shadow-2xl overflow-hidden sm:border-x sm:border-border">
      {!hideHeader && (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
          <h1 className="font-serif font-bold text-xl text-primary">{title || "UrbanrisePro"}</h1>
          <LanguageToggle />
        </header>
      )}
      
      <main className="flex-1 overflow-y-auto pb-20 no-scrollbar">
        {children}
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  );
}

export function AdminShell({ children, title }: { children: React.ReactNode, title: string }) {
  // Desktop-first for Admin
  return (
    <div className="min-h-[100dvh] flex bg-background">
      <aside className="w-64 bg-card border-r border-border p-4 flex flex-col gap-4">
        <h1 className="font-serif font-bold text-2xl text-primary mb-6">UrbanrisePro Admin</h1>
        <nav className="flex flex-col gap-2 flex-1">
          <a href="/admin/metrics" className="text-sm font-medium px-3 py-2 rounded-md hover:bg-muted">Metrics</a>
          <a href="/admin/verify" className="text-sm font-medium px-3 py-2 rounded-md hover:bg-muted">Verification</a>
          <a href="/admin/disputes" className="text-sm font-medium px-3 py-2 rounded-md hover:bg-muted">Disputes</a>
          <a href="/admin/partners" className="text-sm font-medium px-3 py-2 rounded-md hover:bg-muted">Partners</a>
        </nav>
        <LanguageToggle />
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <h2 className="font-serif text-3xl font-bold mb-6">{title}</h2>
        {children}
      </main>
    </div>
  );
}
