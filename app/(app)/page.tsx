import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { listResearchRuns } from "@/lib/db/repository";
import {
  ResearchRunsPanel,
  type ResearchRunView,
} from "@/components/research-runs-panel";
import { DeltaDigest } from "./delta-digest";

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

  const dateline = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-10">
      <p className="kicker">{dateline}</p>
      {userId && <DeltaDigest userId={userId} />}
      <ResearchRunsPanel initialRuns={runViews} />
    </div>
  );
}
