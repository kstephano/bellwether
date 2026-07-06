import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
};

export default function ReportsPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-black tracking-tight">
        Reports
      </h1>
      <p className="mt-4 max-w-prose text-muted-foreground">
        Each Research Run produces one Report per target — Delta Section first,
        then Change Digest, Current State, Strategic Outlook, and Security
        Advisories. The reading surface arrives in a later slice.
      </p>
    </div>
  );
}
