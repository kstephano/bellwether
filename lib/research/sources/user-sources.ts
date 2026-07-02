// User-source client: fetches the raw content of user-defined source URLs
// (RSS feeds, changelogs, GitHub repos). Used by the research pipeline as the
// `fetchUserSources` client.

export async function fetchUserSources(urls: string[]): Promise<string[]> {
  const contents: string[] = [];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      contents.push(await res.text());
    } catch {
      // A dead user source must not kill the whole research run.
    }
  }
  return contents;
}
