"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportMarkdownButton({
  markdown,
  filename,
}: {
  markdown: string;
  filename: string;
}) {
  function download() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={download}>
      <Download data-icon="inline-start" />
      Export Markdown
    </Button>
  );
}
