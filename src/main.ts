import "./style.css";
import gsap from "gsap";
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

  // +1 for Tiny Claw (displayed in its own highlight section)
  const total = activeFilter === "all" && !searchQuery ? filtered.length + 1 : filtered.length;
  projectCount.textContent = `${total} project${total !== 1 ? "s" : ""}`;

  if (filtered.length === 0) {
    grid.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  // Sort: featured first, then isNew projects, then the rest
  const sorted = [...filtered].sort((a, b) => {
    const aWeight = a.category === "featured" ? 0 : a.isNew ? 1 : 2;
    const bWeight = b.category === "featured" ? 0 : b.isNew ? 1 : 2;
    return aWeight - bWeight;
  });

  grid.innerHTML = sorted
    .map((p, i) => {
      const meta = categoryMeta[p.category];
      const langColor = p.language ? langColors[p.language] || "#666" : null;
      const [owner] = p.repo.split("/");

      return `
      <div class="project-card${p.category === "featured" ? " featured" : ""}"
           style="animation-delay: ${Math.min(i * 30, 600)}ms">
        ${p.isNew ? `<span class="new-badge">new</span>` : ""}
        <div class="card-banner">
          <div class="card-emoji">${p.emoji}</div>
          <div class="card-actions">
            <a href="https://github.com/${p.repo}" target="_blank" rel="noopener noreferrer" class="icon-btn" title="View on GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>${p.website ? `
            <a href="${p.website}" target="_blank" rel="noopener noreferrer" class="icon-btn" title="Visit Website">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </a>` : ""}
          </div>
        </div>
        <div class="card-body">
          <div class="card-header">
            <span class="category-badge" style="--badge-color: ${meta.color}">${meta.label}</span>
            ${owner !== "warengonzaga" ? `<span class="org-label">${owner}</span>` : ""}
          </div>
          <h3 class="card-title">${escapeHtml(p.name)}</h3>
          <p class="card-desc">${escapeHtml(p.description)}</p>
          <div class="card-footer">
            <div class="card-lang">
              ${langColor ? `<span class="lang-dot" style="background:${langColor}"></span>${p.language}` : ""}
            </div>
          </div>
        </div>
      </div>`;
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

// --- Name hover animation (GSAP letter wave bounce) ---
const heroName = document.querySelector(".hero-name") as HTMLElement;
if (heroName) {
  const originalText = heroName.textContent || "";
  let isAnimating = false;

  heroName.addEventListener("mouseenter", () => {
    if (isAnimating) return;
    isAnimating = true;

    // Step 1: Measure every character's exact position in the original kerned text
    const textNode = heroName.firstChild as Text;
    const range = document.createRange();
    const charPositions: number[] = [];
    for (let i = 0; i < originalText.length; i++) {
      range.setStart(textNode, i);
      range.setEnd(textNode, i + 1);
      charPositions.push(range.getBoundingClientRect().left);
    }
    const totalWidth = heroName.offsetWidth;

    // Step 2: Disable parent gradient so it doesn't ghost behind letter spans
    // Expand padding for animation headroom (base CSS is 0 10px, expand to 10px 20px)
    // Negative margin compensates for the EXTRA padding to prevent layout shift
    heroName.style.background = "none";
    heroName.style.webkitTextFillColor = "transparent";
    heroName.style.padding = "10px 30px";
    heroName.style.margin = "-10px -20px";

    // Split into letter spans (1 span per character)
    heroName.innerHTML = originalText
      .split("")
      .map((ch) =>
        ch === " "
          ? `<span class="name-space">\u00A0</span>`
          : `<span class="name-letter">${ch}</span>`,
      )
      .join("");

    // Step 3: Measure ALL span positions and calculate kerning offsets
    const allSpans = Array.from(
      heroName.querySelectorAll<HTMLElement>(".name-letter, .name-space"),
    );
    const kernOffsets: number[] = [];
    allSpans.forEach((span, i) => {
      const spanLeft = span.getBoundingClientRect().left;
      kernOffsets.push(charPositions[i] - spanLeft);
      gsap.set(span, { x: charPositions[i] - spanLeft });
    });

    // Step 4: Set gradient slices on letter spans only
    const letters = heroName.querySelectorAll<HTMLElement>(".name-letter");
    letters.forEach((letter) => {
      const offset = letter.offsetLeft;
      letter.style.backgroundSize = `${totalWidth}px 100%`;
      letter.style.backgroundPosition = `-${offset}px 0`;
    });

    // Step 5: Animate (letters only, space stays put)
    const tl = gsap.timeline({
      onComplete: () => {
        heroName.textContent = originalText;
        heroName.style.background = "";
        heroName.style.webkitTextFillColor = "";
        heroName.style.padding = "";
        heroName.style.margin = "";
        isAnimating = false;
      },
    });

    // Collect letter-only kern offsets and find word boundary for spread
    const letterIndices: number[] = [];
    let spaceIndex = -1; // index in allSpans where the space is
    allSpans.forEach((span, i) => {
      if (span.classList.contains("name-letter")) letterIndices.push(i);
      if (span.classList.contains("name-space")) spaceIndex = i;
    });

    // Letters before the space go left, letters after go right
    // Count how many letters are before the space in the allSpans order
    const lettersBeforeSpace = spaceIndex >= 0
      ? letterIndices.filter((idx) => idx < spaceIndex).length
      : Math.floor(letters.length / 2);

    // Per-letter spread: each letter spreads outward from the overall center
    const spreadPx = 2.5; // px per letter from center
    const center = (letters.length - 1) / 2;
    const getSpread = (_i: number) => (_i - center) * spreadPx;

    // Phase 1: Bounce up + spread apart
    tl.to(letters, {
      y: -14,
      x: (_i: number) => kernOffsets[letterIndices[_i]] + getSpread(_i),
      scale: 1.12,
      duration: 0.3,
      ease: "back.out(2.5)",
      stagger: { each: 0.04 },
    });

    // Phase 2: Hold spread briefly so spacing is visible before tilt
    tl.to(letters, {
      duration: 0.12,
    });

    // Phase 3: Tilt alternating directions while spread
    tl.to(letters, {
      rotation: (_i: number) => (_i % 2 === 0 ? -12 : 12),
      duration: 0.25,
      ease: "power2.out",
      stagger: { each: 0.03 },
    });

    // Phase 4: Drop back down, remove tilt, return to kerned positions
    tl.to(
      letters,
      {
        y: 0,
        rotation: 0,
        scale: 1,
        x: (_i: number) => kernOffsets[letterIndices[_i]],
        duration: 0.4,
        ease: "elastic.out(1, 0.4)",
        stagger: { each: 0.03 },
      },
      ">-0.1",
    );
  });
}

// --- Init ---
render();
