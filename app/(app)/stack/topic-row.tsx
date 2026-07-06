"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateFreetextTopicAction, deleteFreetextTopicAction } from "./actions";
import { fieldClass } from "./field";

export type FreetextTopicView = {
  id: string;
  text: string;
};

export function TopicRow({ topic }: { topic: FreetextTopicView }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await updateFreetextTopicAction(
        topic.id,
        String(formData.get("text") ?? "")
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setEditing(false);
    });
  }

  function remove() {
    if (!window.confirm(`Delete topic “${topic.text}”?`)) return;
    startTransition(async () => {
      await deleteFreetextTopicAction(topic.id);
    });
  }

  if (editing) {
    return (
      <li className="border-b py-2.5">
        <form action={save} className="flex flex-wrap items-center gap-2">
          <input
            name="text"
            defaultValue={topic.text}
            placeholder="Topic"
            required
            autoFocus
            className={`${fieldClass} w-full max-w-md flex-1`}
          />
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
    <li className="group flex items-baseline justify-between gap-4 border-b py-2.5">
      <span className="text-sm font-medium">{topic.text}</span>
      <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`Edit topic ${topic.text}`}
          onClick={() => setEditing(true)}
        >
          <Pencil />
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`Delete topic ${topic.text}`}
          disabled={pending}
          onClick={remove}
        >
          <Trash2 />
        </Button>
      </span>
    </li>
  );
}
