type Status = "COMPLETED" | "FAILED";
type Summary = { advisoryCount: number; changeCount: number };

export function composeNotificationEmail(
  status: Status,
  summary: Summary,
  dashboardUrl: string
): { subject: string; body: string } {
  let subject: string;

  if (status === "FAILED") {
    subject = "Bellwether: Research Run failed — re-trigger from the dashboard";
  } else if (summary.advisoryCount > 0) {
    subject = `Bellwether: ${summary.advisoryCount} Security Advisor${summary.advisoryCount === 1 ? "y" : "ies"} found this month`;
  } else {
    subject = `Bellwether: ${summary.changeCount} change${summary.changeCount === 1 ? "" : "s"} found this month`;
  }

  const body =
    status === "FAILED"
      ? `Your Bellwether Research Run encountered an error. Partial reports may be available.\n\nRe-trigger the run from your dashboard: ${dashboardUrl}`
      : `Your monthly Bellwether Research Run is complete.\n\n${summary.advisoryCount > 0 ? `⚠️  ${summary.advisoryCount} Security ${summary.advisoryCount === 1 ? "Advisory" : "Advisories"} require attention.\n\n` : ""}View your reports: ${dashboardUrl}`;

  return { subject, body };
}
