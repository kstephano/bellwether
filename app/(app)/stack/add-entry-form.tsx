"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createStackEntryAction } from "./actions";
import { fieldClass } from "./field";

export function AddEntryForm({ categoryId }: { categoryId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function add(formData: FormData) {
    startTransition(async () => {
      const result = await createStackEntryAction({
        categoryId,
        technology: String(formData.get("technology") ?? ""),
        version: String(formData.get("version") ?? "").trim() || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      formRef.current?.reset();
      formRef.current?.querySelector<HTMLInputElement>("input[name=technology]")?.focus();
    });
  }

  if (!open) {
    return (
      <Button
        size="xs"
        variant="ghost"
        className="mt-2 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Plus data-icon="inline-start" />
        Add entry
      </Button>
    );
  }

  return (
    <div className="mt-2.5">
      <form ref={formRef} action={add} className="flex flex-wrap items-center gap-2">
        <input
          name="technology"
          placeholder="Technology"
          required
          autoFocus
          className={`${fieldClass} w-44`}
        />
        <input
          name="version"
          placeholder="Version (optional)"
          className={`${fieldClass} w-32 font-mono text-xs`}
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add"}
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
          Done
        </Button>
      </form>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
