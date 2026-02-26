import "./style.css";
import { projects, categoryMeta, langColors, type Category } from "./projects";

// --- DOM refs ---
const grid = document.getElementById("projects-grid")!;
const empty = document.getElementById("projects-empty")!;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const filterTabs = document.getElementById("filter-tabs")!;
const projectCount = document.getElementById("project-count")!;

let activeFilter: Category | "all" = "all";
let searchQuery = "";

// --- Render ---
function getFiltered() {
  return projects.filter((p) => {
    const matchesCategory = activeFilter === "all" || p.category === activeFilter;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery) ||
      (p.language?.toLowerCase().includes(searchQuery) ?? false);
    return matchesCategory && matchesSearch;
  });
}

function render() {
  const filtered = getFiltered();

  projectCount.textContent = `${filtered.length} project${filtered.length !== 1 ? "s" : ""}`;

  if (filtered.length === 0) {
    grid.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  grid.innerHTML = filtered
    .map((p, i) => {
      const meta = categoryMeta[p.category];
      const langColor = p.language ? langColors[p.language] || "#666" : null;
      const [owner] = p.repo.split("/");

      return `
      <a href="https://github.com/${p.repo}" target="_blank" rel="noopener noreferrer"
         class="project-card${p.category === "featured" ? " featured" : ""}"
         style="animation-delay: ${Math.min(i * 30, 600)}ms">
        <div class="card-header">
          <span class="category-badge" style="--badge-color: ${meta.color}">${meta.label}</span>
          <svg class="card-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
        </div>
        <h3 class="card-title">${escapeHtml(p.name)}</h3>
        <p class="card-desc">${escapeHtml(p.description)}</p>
        <div class="card-footer">
          <div class="card-lang">
            ${langColor ? `<span class="lang-dot" style="background:${langColor}"></span>${p.language}` : ""}
          </div>
          ${owner !== "warengonzaga" ? `<span class="org-label">${owner}</span>` : ""}
        </div>
      </a>`;
    })
    .join("");
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// --- Events ---
filterTabs.addEventListener("click", (e) => {
  const tab = (e.target as HTMLElement).closest(".filter-tab") as HTMLElement;
  if (!tab) return;

  filterTabs.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  activeFilter = (tab.dataset.filter || "all") as Category | "all";
  render();
});

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.toLowerCase().trim();
  render();
});

// --- Init ---
render();
