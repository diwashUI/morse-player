// Data layer: fetches public GitHub data (no API key needed) and turns it
// into "Wrapped" stats. Runs on the server inside our API route.

const GH_API = "https://api.github.com";
const HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "github-wrapped-demo",
};

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
  Java: "#b07219", "C++": "#f34b7d", C: "#555555", "C#": "#178600",
  Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516", PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", HTML: "#e34c26",
  CSS: "#563d7c", Shell: "#89e051", Vue: "#41b883", Svelte: "#ff3e00",
  Lua: "#000080", R: "#198CE7", Scala: "#c22d40", Elixir: "#6e4a7e",
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface WrappedProfile {
  login: string;
  name: string;
  avatarUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  accountYears: number;
}

export interface LanguageStat {
  language: string;
  repos: number;
  pct: number;
  color: string;
}

export interface TopRepo {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  url: string;
  language: string | null;
}

export interface WrappedStats {
  profile: WrappedProfile;
  totalStars: number;
  languages: LanguageStat[];
  topRepos: TopRepo[];
  peakHour: number;
  peakDay: string;
  pushEvents: number;
  persona: { title: string; blurb: string };
}

export class WrappedError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(`${GH_API}${path}`, { headers: HEADERS, cache: "no-store" });
  if (res.status === 404) throw new WrappedError("GitHub user not found.", 404);
  if (res.status === 403) {
    throw new WrappedError(
      "GitHub rate limit hit (60 requests/hour for keyless use). Try again in a few minutes.",
      429
    );
  }
  if (!res.ok) throw new WrappedError("GitHub API error. Try again shortly.", 502);
  return res.json() as Promise<T>;
}

interface GhUser {
  login: string; name: string | null; avatar_url: string; bio: string | null;
  public_repos: number; followers: number; following: number; created_at: string;
}

interface GhRepo {
  name: string; description: string | null; stargazers_count: number;
  forks_count: number; language: string | null; html_url: string; fork: boolean;
}

interface GhEvent {
  type: string; created_at: string;
  payload: { commits?: { sha: string }[] };
}

function pickPersona(s: Omit<WrappedStats, "persona">): WrappedStats["persona"] {
  const h = s.peakHour;
  if (h >= 22 || h <= 4)
    return { title: "The Midnight Merger", blurb: "Your best code ships when the rest of the world is asleep." };
  if (h >= 5 && h <= 8)
    return { title: "The Early Bird", blurb: "Commits before coffee. The codebase fears your mornings." };
  if (s.languages.length >= 5)
    return { title: "The Polyglot", blurb: `${s.languages.length} languages and counting. Monolingual codebases bore you.` };
  if (s.totalStars >= 100)
    return { title: "The Star Collector", blurb: `${s.totalStars} stars and rising. People actually use what you build.` };
  if (s.pushEvents >= 40)
    return { title: "The Relentless Shipper", blurb: "Push, push, push. Momentum is your love language." };
  return { title: "The Steady Builder", blurb: "Quiet, consistent, dangerous. Brick by brick." };
}

function hourLabel(h: number): string {
  const suffix = h < 12 ? "AM" : "PM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${suffix}`;
}

export { hourLabel };

export async function getWrapped(username: string): Promise<WrappedStats> {
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
    throw new WrappedError("That doesn't look like a valid GitHub username.", 400);
  }

  // 3 free, keyless API calls. Profile + repos + recent public activity.
  const [user, repos, events] = await Promise.all([
    gh<GhUser>(`/users/${username}`),
    gh<GhRepo[]>(`/users/${username}/repos?per_page=100&type=owner&sort=updated`),
    gh<GhEvent[]>(`/users/${username}/events?per_page=100`),
  ]);

  const owned = repos.filter((r) => !r.fork);
  const totalStars = owned.reduce((sum, r) => sum + r.stargazers_count, 0);

  // Languages: aggregate each repo's primary language.
  const langCount = new Map<string, number>();
  for (const r of owned) {
    if (r.language) langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1);
  }
  const langTotal = [...langCount.values()].reduce((a, b) => a + b, 0) || 1;
  const languages: LanguageStat[] = [...langCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([language, count]) => ({
      language,
      repos: count,
      pct: Math.round((count / langTotal) * 100),
      color: LANGUAGE_COLORS[language] ?? "#8b949e",
    }));

  const topRepos: TopRepo[] = [...owned]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 3)
    .map((r) => ({
      name: r.name,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      url: r.html_url,
      language: r.language,
    }));

  // Activity rhythm from recent public push events (last ~90 days).
  const pushes = events.filter((e) => e.type === "PushEvent");
  const hourHist = new Array(24).fill(0) as number[];
  const dayHist = new Array(7).fill(0) as number[];
  for (const e of pushes) {
    const d = new Date(e.created_at);
    hourHist[d.getUTCHours()]++;
    dayHist[d.getUTCDay()]++;
  }
  const peakHour = hourHist.indexOf(Math.max(...hourHist));
  const peakDay = WEEKDAYS[dayHist.indexOf(Math.max(...dayHist))];

  const accountYears = Math.max(
    0,
    Math.floor((Date.now() - new Date(user.created_at).getTime()) / (365.25 * 24 * 3600 * 1000))
  );

  const partial = {
    profile: {
      login: user.login,
      name: user.name ?? user.login,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      accountYears,
    },
    totalStars,
    languages,
    topRepos,
    peakHour,
    peakDay,
    pushEvents: pushes.length,
  };

  return { ...partial, persona: pickPersona(partial) };
}
