import "./style.css";
import { fetchProjects, langColors, type Project } from "./projects";

// --- DOM refs ---
const grid = document.getElementById("projects-grid")!;
const empty = document.getElementById("projects-empty")!;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const filterTabs = document.getElementById("filter-tabs")!;
const statRepos = document.getElementById("stat-repos")!;
const statStars = document.getElementById("stat-stars")!;
const statLangs = document.getElementById("stat-languages")!;

let allProjects: Project[] = [];
let activeFilter = "all";
let searchQuery = "";

// --- Render ---
function renderProjects(projects: Project[]) {
  if (projects.length === 0) {
    grid.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  grid.innerHTML = projects
    .map(
      (p, i) => `
    <a href="${p.url}" target="_blank" rel="noopener"
       class="project-card${p.featured ? " featured" : ""}"
       style="animation-delay: ${Math.min(i * 0.04, 0.8)}s">
      <div class="card-header">
        <div class="card-title-group">
          <span class="card-title">${escapeHtml(p.name)}</span>
          ${p.featured ? '<span class="card-featured-badge">&#9733; Featured</span>' : ""}
        </div>
        ${
          p.stars > 0
            ? `<span class="card-stars">
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>
                ${p.stars}
              </span>`
            : ""
        }
      </div>
      <p class="card-desc">${escapeHtml(p.description) || "No description yet."}</p>
      <div class="card-footer">
        <div class="card-lang">
          ${p.language ? `<span class="lang-dot" style="background:${langColors[p.language] || "#666"}"></span>${escapeHtml(p.language)}` : ""}
        </div>
        <svg class="card-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </div>
    </a>
  `
    )
    .join("");
}

function filterAndRender() {
  const filtered = allProjects.filter((p) => {
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "featured" && p.featured) ||
      p.category.includes(activeFilter);

    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery) ||
      p.language.toLowerCase().includes(searchQuery) ||
      p.topics.some((t) => t.includes(searchQuery));

    return matchesFilter && matchesSearch;
  });

  renderProjects(filtered);
}

function updateStats(projects: Project[]) {
  const totalStars = projects.reduce((a, p) => a + p.stars, 0);
  const languages = new Set(projects.map((p) => p.language).filter(Boolean));

  animateCounter(statRepos, projects.length);
  animateCounter(statStars, totalStars);
  animateCounter(statLangs, languages.size);
}

function animateCounter(el: HTMLElement, target: number) {
  const duration = 1200;
  const start = performance.now();

  function tick(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toString();
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// --- Skeleton loaders ---
function showSkeletons() {
  grid.innerHTML = Array.from({ length: 9 })
    .map(
      () => `
    <div class="skeleton-card">
      <div class="skeleton-line w60"></div>
      <div class="skeleton-line w100"></div>
      <div class="skeleton-line w80"></div>
      <div class="skeleton-line w40"></div>
    </div>
  `
    )
    .join("");
}

// --- Events ---
filterTabs.addEventListener("click", (e) => {
  const tab = (e.target as HTMLElement).closest(".filter-tab") as HTMLElement;
  if (!tab) return;

  filterTabs.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  activeFilter = tab.dataset.filter || "all";
  filterAndRender();
});

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.toLowerCase().trim();
  filterAndRender();
});

// --- Init ---
async function init() {
  showSkeletons();

  try {
    allProjects = await fetchProjects();
    updateStats(allProjects);
    filterAndRender();
  } catch (err) {
    console.error("Failed to fetch projects:", err);
    grid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px;">Failed to load projects. Please refresh the page.</p>`;
  }
}

init();
