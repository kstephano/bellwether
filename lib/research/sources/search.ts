// Web-search client backed by Tavily. Used by the research pipeline as the
// `search` client.

type TavilyResult = { title: string; url: string; content: string };
type TavilyResponse = { answer?: string; results?: TavilyResult[] };

export async function search(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set");
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, query }),
  });
  const data = (await res.json()) as TavilyResponse;

  const parts: string[] = [];
  if (data.answer) {
    parts.push(data.answer);
  }
  for (const result of data.results ?? []) {
    parts.push(`${result.title} (${result.url})\n${result.content}`.trim());
  }

  return parts.join("\n\n");
}
