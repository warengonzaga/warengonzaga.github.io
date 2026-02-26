export interface Project {
  name: string;
  description: string;
  url: string;
  stars: number;
  language: string;
  homepage: string;
  topics: string[];
  featured: boolean;
  category: string[];
}

// Language colors from GitHub
export const langColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  PHP: "#4F5D95",
  SCSS: "#c6538c",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Batchfile: "#C1F12E",
  Python: "#3572A5",
  Shell: "#89e051",
  Go: "#00ADD8",
  Rust: "#dea584",
};

// Featured projects from profile README
const FEATURED_NAMES = [
  "css-text-portrait-builder",
  "wifi-passview",
  "tinyclaw",
  "magic-commit",
  "magic-release",
  "buymeacoffee.js",
  "gathertown.js",
  "wrn-cleaner",
  "fork-corner",
  "thirdweb-wp",
  "daisy.js",
  "awesome-thirdweb",
];

// Category tagging
function categorize(repo: { name: string; description: string; topics: string[] }): string[] {
  const cats: string[] = [];
  const text = `${repo.name} ${repo.description} ${repo.topics.join(" ")}`.toLowerCase();

  if (/\bai\b|magic-|tinyclaw|gpt|llm|autonomous/.test(text)) cats.push("ai");
  if (/thirdweb|web3|nft|blockchain|crypto|ipfs|relay/.test(text)) cats.push("web3");
  if (/sdk|\.js$|api|client|library/.test(text)) cats.push("sdk");
  if (/tool|cli|util|clean|fix|batch|pass|extension|banner|faucet/.test(text)) cats.push("tools");

  if (cats.length === 0) cats.push("tools");
  return cats;
}

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  homepage: string | null;
  topics: string[];
  fork: boolean;
  archived: boolean;
}

export async function fetchProjects(): Promise<Project[]> {
  const pages = [1, 2, 3];
  const results = await Promise.all(
    pages.map((page) =>
      fetch(
        `https://api.github.com/users/warengonzaga/repos?per_page=100&sort=stars&direction=desc&type=owner&page=${page}`
      ).then((r) => r.json() as Promise<GitHubRepo[]>)
    )
  );

  const repos = results.flat();

  return repos
    .filter((r) => !r.fork && !r.archived && r.name !== "warengonzaga")
    .map((r) => ({
      name: r.name,
      description: (r.description || "").replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2700}-\u{27BF}]/gu, "").trim(),
      url: r.html_url,
      stars: r.stargazers_count,
      language: r.language || "",
      homepage: r.homepage || "",
      topics: r.topics || [],
      featured: FEATURED_NAMES.includes(r.name),
      category: categorize({
        name: r.name,
        description: r.description || "",
        topics: r.topics || [],
      }),
    }))
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.stars - a.stars;
    });
}
