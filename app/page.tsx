import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { listResearchRuns } from "@/lib/db/repository";
import { ResearchRunsPanel, type ResearchRunView } from "./research-runs-panel";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  const userId = session.user?.email;
  const runs = userId ? await listResearchRuns(getDb(), userId) : [];
  const runViews: ResearchRunView[] = runs.map((run) => ({
    id: run.id,
    status: run.status,
    triggeredBy: run.triggeredBy,
    startedAt: run.startedAt?.toISOString() ?? null,
    completedAt: run.completedAt?.toISOString() ?? null,
  }));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-3xl font-semibold tracking-tight">Bellwether</h1>
      <p className="mt-4 text-muted-foreground">
        Signed in as {session.user?.email}
      </p>
      <ResearchRunsPanel initialRuns={runViews} />
    </main>
  );
}
