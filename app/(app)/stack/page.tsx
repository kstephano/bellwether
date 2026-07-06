import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research Configuration",
};

export default function StackPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-black tracking-tight">
        Research Configuration
      </h1>
      <p className="mt-4 max-w-prose text-muted-foreground">
        Choose what Bellwether researches: Stack Entries grouped by Category,
        Free-text Topics, and the Sources that feed them. Configuration arrives
        in the next slice.
      </p>
    </div>
  );
}
