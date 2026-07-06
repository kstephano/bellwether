"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCategoryAction, deleteCategoryAction } from "./actions";
import { fieldClass } from "./field";

export function CustomCategoryHeader({
  category,
  count,
}: {
  category: { id: string; name: string };
  count: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      setError(result.error);
    });
  }

  return (
    <>
      <div className="group flex items-baseline justify-between border-b-2 border-foreground pb-2">
        <h2 className="kicker text-foreground">{category.name}</h2>
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{count}</span>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label={`Delete category ${category.name}`}
            disabled={pending}
            className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            onClick={remove}
          >
            <Trash2 />
          </Button>
        </span>
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </>
  );
}

export function AddCategoryForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add(formData: FormData) {
    startTransition(async () => {
      const result = await createCategoryAction(String(formData.get("name") ?? ""));
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Plus data-icon="inline-start" />
        New category
      </Button>
    );
  }

  return (
    <div>
      <form action={add} className="flex flex-wrap items-center gap-2">
        <input
          name="name"
          placeholder="Category name"
          required
          autoFocus
          className={`${fieldClass} w-56`}
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creating…" : "Create"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setError(null);
            setOpen(false);
          }}
        >
          Cancel
        </Button>
      </form>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
