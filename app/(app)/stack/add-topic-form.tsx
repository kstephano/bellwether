"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createFreetextTopicAction } from "./actions";
import { fieldClass } from "./field";

export function AddTopicForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function add(formData: FormData) {
    startTransition(async () => {
      const result = await createFreetextTopicAction(
        String(formData.get("text") ?? "")
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      formRef.current?.reset();
      formRef.current?.querySelector<HTMLInputElement>("input[name=text]")?.focus();
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
        Add topic
      </Button>
    );
  }

  return (
    <div className="mt-2.5">
      <form ref={formRef} action={add} className="flex flex-wrap items-center gap-2">
        <input
          name="text"
          placeholder="e.g. AI coding assistants landscape"
          required
          autoFocus
          className={`${fieldClass} w-full max-w-md flex-1`}
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
