import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { getDb } from "@/lib/db/client";
import {
  listCategories,
  listFreetextTopics,
  listStackEntries,
} from "@/lib/db/repository";
import { StackEntryRow, type StackEntryView } from "./stack-entry-row";
import { AddEntryForm } from "./add-entry-form";
import { TopicRow } from "./topic-row";
import { AddTopicForm } from "./add-topic-form";

export const metadata: Metadata = {
  title: "Research Configuration",
};

// Fixed display order for the seven default Categories (issue #13);
// custom Categories follow in creation order.
const DEFAULT_CATEGORY_ORDER = [
  "Front End",
  "Back End",
  "Infrastructure",
  "AI",
  "Environment",
  "Data Platform",
  "Security",
];

export default async function StackPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }
  const userId = session.user.email;

  const db = getDb();
  const [allCategories, entries, topics] = await Promise.all([
    listCategories(db),
    listStackEntries(db, userId),
    listFreetextTopics(db, userId),
  ]);

  const defaults = DEFAULT_CATEGORY_ORDER.flatMap((name) =>
    allCategories.filter((cat) => cat.isDefault && cat.name === name)
  );
  const customs = allCategories.filter((cat) => !cat.isDefault);
  const orderedCategories = [...defaults, ...customs];
  const categoryOptions = orderedCategories.map(({ id, name }) => ({ id, name }));

  const entriesByCategory = new Map<string, StackEntryView[]>();
  for (const entry of entries) {
    const view: StackEntryView = {
      id: entry.id,
      technology: entry.technology,
      version: entry.version,
      categoryId: entry.categoryId,
    };
    const list = entriesByCategory.get(entry.categoryId) ?? [];
    list.push(view);
    entriesByCategory.set(entry.categoryId, list);
  }

  return (
    <div className="max-w-3xl">
      <header>
        <h1 className="font-heading text-3xl font-black tracking-tight">
          Research Configuration
        </h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          Everything below is researched on every Research Run — Stack Entries
          by Category, each with an optional version pin.
        </p>
      </header>

      <div className="mt-10 space-y-10">
        {orderedCategories.map((category) => {
          const categoryEntries = entriesByCategory.get(category.id) ?? [];
          return (
            <section key={category.id} aria-label={category.name}>
              <div className="flex items-baseline justify-between border-b-2 border-foreground pb-2">
                <h2 className="kicker text-foreground">{category.name}</h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {categoryEntries.length}
                </span>
              </div>
              {categoryEntries.length > 0 ? (
                <ul>
                  {categoryEntries.map((entry) => (
                    <StackEntryRow
                      key={entry.id}
                      entry={entry}
                      categories={categoryOptions}
                    />
                  ))}
                </ul>
              ) : (
                <p className="border-b py-2.5 font-heading text-sm italic text-muted-foreground">
                  Nothing tracked yet.
                </p>
              )}
              <AddEntryForm categoryId={category.id} />
            </section>
          );
        })}
      </div>

      <section aria-label="Free-text Topics" className="mt-16 border-t-2 border-foreground pt-6">
        <h2 className="font-heading text-2xl font-black tracking-tight">
          Free-text Topics
        </h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Uncategorised technologies or standalone research subjects, researched
          alongside your Stack Entries on every Research Run.
        </p>

        <div
          role="note"
          className="mt-5 flex items-start gap-3 border-y border-foreground/60 py-3"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="font-heading text-sm italic leading-relaxed">
            Topic strings are sent to third-party APIs (Tavily, Anthropic).
            Include only public technology names — never proprietary system
            names, internal endpoints, or project codenames.
          </p>
        </div>

        <div className="mt-4">
          {topics.length > 0 ? (
            <ul>
              {topics.map((topic) => (
                <TopicRow key={topic.id} topic={{ id: topic.id, text: topic.text }} />
              ))}
            </ul>
          ) : (
            <p className="border-b py-2.5 font-heading text-sm italic text-muted-foreground">
              No topics yet.
            </p>
          )}
          <AddTopicForm />
        </div>
      </section>
    </div>
  );
}
