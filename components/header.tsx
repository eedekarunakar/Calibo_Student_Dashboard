"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase";

export function Header() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/students" className="font-semibold">Calibo Student Dashboard</Link>
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="main-navigation"
          className="rounded border px-3 py-2 text-sm md:hidden"
        >
          {isMenuOpen ? "Close" : "Menu"}
        </button>
        <nav id="main-navigation" aria-label="Main navigation" className={`${isMenuOpen ? "block" : "hidden"} absolute left-0 right-0 top-[65px] z-10 border-b bg-white px-6 py-4 md:static md:block md:border-0 md:bg-transparent md:p-0`}>
          <div className="flex flex-col gap-4 text-sm md:flex-row md:items-center">
            <Link href="/students" className="underline-offset-4 hover:underline" onClick={() => setIsMenuOpen(false)}>Students</Link>
            <Link href="/modules" className="underline-offset-4 hover:underline" onClick={() => setIsMenuOpen(false)}>Modules</Link>
            <Link href="/analytics" className="underline-offset-4 hover:underline" onClick={() => setIsMenuOpen(false)}>Analytics</Link>
            <div className="relative">
              <button type="button" onClick={() => setIsAdminOpen((open) => !open)} aria-expanded={isAdminOpen} className="flex items-center gap-1 font-medium">
                Admin <span aria-hidden="true">▾</span>
              </button>
              {isAdminOpen && (
                <div className="mt-2 flex flex-col gap-2 border-l pl-3 md:absolute md:right-0 md:mt-3 md:w-48 md:rounded md:border md:bg-white md:p-3 md:shadow-sm md:border-l-0">
                  <Link href="/admin/students" onClick={() => { setIsAdminOpen(false); setIsMenuOpen(false); }}>Students</Link>
                  <Link href="/admin/assessments" onClick={() => { setIsAdminOpen(false); setIsMenuOpen(false); }}>Assessments</Link>
                  <Link href="/admin/diagnostics" onClick={() => { setIsAdminOpen(false); setIsMenuOpen(false); }}>Diagnostics</Link>
                  <Link href="/admin/qpm-weightage" onClick={() => { setIsAdminOpen(false); setIsMenuOpen(false); }}>QPM Weightage</Link>
                </div>
              )}
            </div>
            <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="rounded border px-3 py-2 text-left disabled:opacity-50">
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}