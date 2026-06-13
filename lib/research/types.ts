export type SecurityAdvisory = {
  id: string;
  summary: string;
};

export type ChangeItem = {
  description: string;
};

export type ReportSections = {
  changeDigest: { items: ChangeItem[] };
  currentState: { summary: string; gotchas: string[] };
  strategicOutlook: { risks: string[]; opportunities: string[] };
  securityAdvisories: { advisories: SecurityAdvisory[] };
};

export type DeltaSection = {
  newAdvisories: SecurityAdvisory[];
  resolvedAdvisories: SecurityAdvisory[];
  newChanges: ChangeItem[];
};

export type ResearchClients = {
  fetchCurated: (technology: string, version?: string | null) => Promise<string>;
  fetchUserSources: (urls: string[]) => Promise<string[]>;
  search: (query: string) => Promise<string>;
  synthesise: (raw: string) => Promise<ReportSections>;
  log: (service: "TAVILY" | "ANTHROPIC", characterCount: number) => Promise<void>;
};
