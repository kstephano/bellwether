"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/stack", label: "Stack" },
  { href: "/reports", label: "Reports" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b-2 border-foreground">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="flex items-baseline justify-between border-b py-2">
          <p className="kicker">A monthly technology dispatch</p>
          <p className="font-mono text-[11px] text-muted-foreground">{email}</p>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 py-5">
          <Link
            href="/"
            className="font-heading text-4xl font-black tracking-tight text-foreground"
          >
            Bellwether
          </Link>

          <nav aria-label="Primary">
            <ul className="flex items-baseline gap-7">
              {LINKS.map(({ href, label }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "kicker pb-1 transition-colors hover:text-foreground",
                        active &&
                          "border-b-2 border-foreground text-foreground"
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
