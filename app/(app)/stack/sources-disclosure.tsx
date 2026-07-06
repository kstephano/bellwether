"use client";

import { useRef, useState, useTransition } from "react";
import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { addSourceAction, removeSourceAction } from "./actions";
import { fieldClass, selectClass } from "./field";

export type SourceView = {
  id: string;
  type: "RSS" | "URL" | "GITHUB_REPO";
  url: string;
};

const TYPE_LABELS: Record<SourceView["type"], string> = {
  RSS: "RSS",
  URL: "URL",
  GITHUB_REPO: "GitHub repo",
};

export function SourcesDisclosure({
  targetId,
  targetType,
  sources,
}: {
  targetId: string;
  targetType: "STACK_ENTRY" | "FREE_TEXT_TOPIC";
  sources: SourceView[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function add(formData: FormData) {
    startTransition(async () => {
      const result = await addSourceAction({
        targetId,
        targetType,
        type: String(formData.get("type")) as SourceView["type"],
        url: String(formData.get("url") ?? ""),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      formRef.current?.reset();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await removeSourceAction(id);
      setError(result.error);
    });
  }

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="kicker inline-flex items-center gap-1 transition-colors hover:text-foreground"
      >
        <ChevronRight
          className={cn("size-3 transition-transform", open && "rotate-90")}
          aria-hidden
        />
        Sources
        <span className="ml-1 rounded-full border px-1.5 font-mono text-[10px] leading-4">
          {sources.length}
        </span>
      </button>

      {open && (
        <div className="mt-2 ml-4 border-l pl-4">
          <p className="text-xs text-muted-foreground">
            Curated: GitHub Releases · NVD/CVE · Official changelogs
            <span className="kicker ml-2 text-[10px]">always on</span>
          </p>

          {sources.length > 0 && (
            <ul className="mt-2 space-y-1">
              {sources.map((source) => (
                <li key={source.id} className="group flex items-center gap-2 text-xs">
                  <span className="kicker w-20 shrink-0 text-[10px]">
                    {TYPE_LABELS[source.type]}
                  </span>
                  <span className="truncate font-mono text-muted-foreground">
                    {source.url}
                  </span>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Remove source ${source.url}`}
                    disabled={pending}
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                    onClick={() => remove(source.id)}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <form
            ref={formRef}
            action={add}
            className="mt-2.5 flex flex-wrap items-center gap-2"
          >
            <select
              name="type"
              defaultValue="RSS"
              aria-label="Source type"
              className={`${selectClass} h-7 text-xs`}
            >
              <option value="RSS">RSS</option>
              <option value="URL">URL</option>
              <option value="GITHUB_REPO">GitHub repo</option>
            </select>
            <input
              name="url"
              type="url"
              placeholder="https://…"
              required
              className={`${fieldClass} h-7 w-72 font-mono text-xs`}
            />
            <Button type="submit" size="xs" variant="outline" disabled={pending}>
              {pending ? "Adding…" : "Add source"}
            </Button>
          </form>
          {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
