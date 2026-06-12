"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BookOpen, FolderTree, Images, Inbox, LayoutDashboard, LogOut, Package, Quote, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Catalogues", href: "/admin/catalogues", icon: BookOpen },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Collections", href: "/admin/collections", icon: BarChart3 },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Media", href: "/admin/media", icon: Images },
  { label: "Enquiries", href: "/admin/enquiries", icon: Inbox },
  { label: "Quotes", href: "/admin/quotes", icon: Quote }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return children;

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-dark text-white lg:block">
        <div className="flex h-full flex-col p-5">
          <Link href="/admin/dashboard" className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-[0.18em]">CITIPLY</span>
              <span className="text-xs text-white/50">Catalogue Admin</span>
            </span>
          </Link>
          <nav className="mt-7 grid gap-1.5">
            {links.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/68 transition hover:bg-white/10 hover:text-white",
                    active && "bg-white text-text-primary hover:bg-white hover:text-text-primary"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">Workspace</p>
            <p className="mt-2 text-sm text-white/72">Supabase connected dashboard for catalogue operations.</p>
            <button className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm text-white/70 hover:text-white" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-border bg-background/92 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Admin Console</p>
              <p className="mt-1 text-sm text-text-secondary">Manage catalogue content, media, and quote requests.</p>
            </div>
            <Link className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-text-primary shadow-sm hover:border-accent hover:text-accent" href="/">
              View Site
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
