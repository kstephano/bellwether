"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateStackEntryAction, deleteStackEntryAction } from "./actions";
import { fieldClass, selectClass } from "./field";
import { SourcesDisclosure, type SourceView } from "./sources-disclosure";

export type CategoryOption = { id: string; name: string };

export type StackEntryView = {
  id: string;
  technology: string;
  version: string | null;
  categoryId: string;
};

export function StackEntryRow({
  entry,
  categories,
  sources,
}: {
  entry: StackEntryView;
  categories: CategoryOption[];
  sources: SourceView[];
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await updateStackEntryAction(entry.id, {
        technology: String(formData.get("technology") ?? ""),
        version: String(formData.get("version") ?? "").trim() || null,
        categoryId: String(formData.get("categoryId") ?? entry.categoryId),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setEditing(false);
    });
  }

  function remove() {
    if (!window.confirm(`Delete ${entry.technology}? Its Report history will no longer be reachable from the Stack.`)) {
      return;
    }
    startTransition(async () => {
      await deleteStackEntryAction(entry.id);
    });
  }

  if (editing) {
    return (
      <li className="border-b py-2.5">
        <form action={save} className="flex flex-wrap items-center gap-2">
          <input
            name="technology"
            defaultValue={entry.technology}
            placeholder="Technology"
            required
            autoFocus
            className={`${fieldClass} w-full max-w-md flex-1`}
          />
          <input
            name="version"
            defaultValue={entry.version ?? ""}
            placeholder="Version (optional)"
            className={`${fieldClass} w-full max-w-64 flex-1 font-mono text-xs`}
          />
          <select
            name="categoryId"
            defaultValue={entry.categoryId}
            aria-label="Category"
            className={selectClass}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setError(null);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </form>
        {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
      </li>
    );
  }

  return (
    <li className="border-b py-2.5">
      <div className="group flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium">
          {entry.technology}
          {entry.version && (
            <span className="ml-2.5 font-mono text-xs text-muted-foreground">
              {entry.version}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label={`Edit ${entry.technology}`}
            onClick={() => setEditing(true)}
          >
            <Pencil />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label={`Delete ${entry.technology}`}
            disabled={pending}
            onClick={remove}
          >
            <Trash2 />
          </Button>
        </span>
      </div>
      <SourcesDisclosure
        targetId={entry.id}
        targetType="STACK_ENTRY"
        sources={sources}
      />
    </li>
  );
}
