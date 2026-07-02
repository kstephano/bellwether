// Curated-source client: combines GitHub release notes with NVD security
// advisories for a given technology. Used by the research pipeline as the
// `fetchCurated` client.

type GitHubRepoSearch = { items?: { full_name: string }[] };
type GitHubRelease = { tag_name: string; body?: string };
type NvdResponse = {
  vulnerabilities?: { cve: { id: string; descriptions?: { value: string }[] } }[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Curated source request failed (${res.status}): ${url}`);
  }
  return (await res.json()) as T;
}

export async function fetchCurated(
  technology: string,
  version?: string | null
): Promise<string> {
  const sections: string[] = [];

  if (version) {
    sections.push(`Pinned version: ${version}`);
  }

  // 1. Find the most relevant GitHub repository for this technology.
  const search = await fetchJson<GitHubRepoSearch>(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(technology)}`
  );
  const repo = search.items?.[0]?.full_name;

  // 2. Pull that repo's release notes.
  if (repo) {
    const releases = await fetchJson<GitHubRelease[]>(
      `https://api.github.com/repos/${repo}/releases`
    );
    for (const release of releases ?? []) {
      sections.push(`${release.tag_name}\n${release.body ?? ""}`.trim());
    }
  }

  // 3. Pull NVD security advisories for this technology.
  const nvd = await fetchJson<NvdResponse>(
    `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(technology)}`
  );
  for (const vuln of nvd.vulnerabilities ?? []) {
    const description = vuln.cve.descriptions?.[0]?.value ?? "";
    sections.push(`${vuln.cve.id}: ${description}`.trim());
  }

  return sections.join("\n\n");
}
