import "./style.css";
import gsap from "gsap";
import { projects, categoryMeta, langColors, statusLabel, type Category, type Project } from "./projects";

// --- DOM refs ---
const catalog = document.getElementById("projects-catalog")!;
const empty = document.getElementById("projects-empty")!;
const catalogCount = document.getElementById("catalog-count")!;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const filterTabs = document.getElementById("filter-tabs")!;
const projectCount = document.getElementById("project-count")!;

let activeFilter: Category | "all" = "all";
let searchQuery = "";

const chapters: { title: string; summary: string; categories: Category[]; legacy?: boolean; current?: boolean }[] = [
  {
    title: "Current",
    summary: "A few projects beside Rove, the focus above.",
    categories: ["featured"],
    current: true,
  },
  {
    title: "Side projects",
    summary: "Labs, support bots, and community tools.",
    categories: ["labs", "community"],
  },
  {
    title: "Other projects",
    summary: "Utilities, SDKs, and smaller experiments.",
    categories: ["projects"],
  },
  {
    title: "Legacy work",
    summary: "Earlier work, kept public and marked legacy.",
    categories: ["legacy"],
    legacy: true,
  },
];

// --- Render ---
function getFiltered() {
  return projects.filter((p) => {
    const matchesCategory = activeFilter === "all" || p.category === activeFilter;
    const haystack = [p.name, p.description, p.language, p.focus, p.status ? statusLabel[p.status] : ""]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = !searchQuery || haystack.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });
}

function cardHtml(p: Project, i: number) {
  const meta = categoryMeta[p.category];
  const langColor = p.language ? langColors[p.language] || "#8ec5ff" : null;
  const [owner] = p.repo.split("/");
  const classes = [
    "project-card",
    p.category === "featured" ? "featured" : "",
    p.category === "legacy" ? "legacy" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
      <article class="${classes}" style="animation-delay: ${Math.min(i * 30, 600)}ms">
        ${p.isNew ? `<span class="new-badge">new</span>` : ""}
        <div class="card-banner">
          <div class="card-emoji" aria-hidden="true">${p.emoji}</div>
          <div class="card-actions">
            <a href="https://github.com/${p.repo}" target="_blank" rel="noopener noreferrer" class="icon-btn" aria-label="View ${escapeHtml(p.name)} on GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>${p.website ? `
            <a href="${p.website}" target="_blank" rel="noopener noreferrer" class="icon-btn" aria-label="Visit ${escapeHtml(p.name)} website">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </a>` : ""}
          </div>
        </div>
        <div class="card-body">
          <div class="card-header">
            <span class="category-badge" style="--badge-color: ${meta.color}">${meta.label}</span>
            ${owner !== "warengonzaga" ? `<span class="org-label">${escapeHtml(owner)}</span>` : ""}
          </div>
          <h3 class="card-title">${escapeHtml(p.name)}</h3>
          <p class="card-desc">${escapeHtml(p.description)}</p>
          <div class="card-footer">
            <div class="card-meta">
              ${langColor ? `<span class="card-lang"><span class="lang-dot" style="background:${langColor}"></span>${escapeHtml(p.language!)}</span>` : ""}
              ${p.focus ? `<span class="focus-pill">${escapeHtml(p.focus)}</span>` : ""}
            </div>
            ${p.status ? `<span class="status-note">${statusLabel[p.status]}</span>` : ""}
          </div>
        </div>
      </article>`;
}

function currentLists(items: Project[]) {
  const shown = items.filter((project) => project.lead);
  if (shown.length === 0) return { shown: items, more: [] as Project[] };
  return { shown, more: items.filter((project) => !project.lead) };
}

function chapterHtml(title: string, summary: string, items: Project[], current = false) {
  const { shown, more } = current ? currentLists(items) : { shown: items, more: [] as Project[] };
  const moreHtml = more.length
    ? `<details class="chapter-more">
        <summary><span>More current work</span><span class="chapter-count">${more.length}</span></summary>
        <div class="projects-grid">${more.map(cardHtml).join("")}</div>
      </details>`
    : "";

  return `
    <section class="catalog-chapter">
      <div class="chapter-head">
        <div class="chapter-title-row">
          <h2 class="chapter-title">${title}</h2>
          <span class="chapter-count">${shown.length}</span>
        </div>
        <p class="chapter-summary">${summary}</p>
      </div>
      <div class="projects-grid">${shown.map(cardHtml).join("")}</div>
      ${moreHtml}
    </section>`;
}

function render() {
  const filtered = getFiltered();
  const showChapters =
    (activeFilter === "all" && !searchQuery) ||
    activeFilter === "legacy" ||
    (activeFilter === "featured" && !searchQuery);

  if (filtered.length === 0) {
    catalog.innerHTML = "";
    catalogCount.style.display = "none";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  if (showChapters) {
    catalogCount.style.display = "none";
    const visible =
      activeFilter === "legacy" ? chapters.filter((chapter) => chapter.legacy)
      : activeFilter === "featured" ? chapters.filter((chapter) => chapter.current)
      : chapters;
    catalog.innerHTML = visible
      .map((chapter) => {
        const items = filtered.filter((p) => chapter.categories.includes(p.category));
        return items.length ? chapterHtml(chapter.title, chapter.summary, items, chapter.current) : "";
      })
      .join("");
    return;
  }

  catalogCount.style.display = "block";
  catalogCount.textContent = `${filtered.length} project${filtered.length === 1 ? "" : "s"}`;
  catalog.innerHTML = `<div class="projects-grid">${filtered.map(cardHtml).join("")}</div>`;
}

function setTabCounts() {
  const counts: Record<string, number> = { all: projects.length };
  for (const project of projects) counts[project.category] = (counts[project.category] ?? 0) + 1;
  filterTabs.querySelectorAll<HTMLElement>(".filter-tab").forEach((tab) => {
    const key = tab.dataset.filter || "all";
    const count = tab.querySelector(".tab-count");
    if (count) count.textContent = String(counts[key] ?? 0);
  });
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

  filterTabs.querySelectorAll<HTMLElement>(".filter-tab").forEach((t) => {
    t.classList.remove("active");
    t.setAttribute("aria-pressed", "false");
  });
  tab.classList.add("active");
  tab.setAttribute("aria-pressed", "true");
  activeFilter = (tab.dataset.filter || "all") as Category | "all";
  render();
  if (catalog.getBoundingClientRect().top < 72) {
    catalog.scrollIntoView({ block: "start" });
  }
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

// --- Rainbow & Unicorn click effect (fountain style) ---
(() => {
  const unicorns = ["🦄", "🌈", "✨", "💖", "⭐", "🌟", "💫"];
  const rainbowColors = [
    "#ff0000", "#ff4500", "#ff8c00", "#ffd700",
    "#32cd32", "#00bfff", "#8a2be2", "#ff69b4",
  ];

  const MAX_PARTICLES = 60;
  let activeParticles = 0;
  let holdTimer: ReturnType<typeof setInterval> | null = null;
  let isHolding = false;
  let holdX = 0;
  let holdY = 0;

  // Fountain: particles arc upward then fall, a single tween with physics-like cubic bezier
  function spawnFountain(x: number, y: number, count: number) {
    const toSpawn = Math.min(count, MAX_PARTICLES - activeParticles);
    if (toSpawn <= 0) return;

    for (let i = 0; i < toSpawn; i++) {
      activeParticles++;
      const el = document.createElement("div");
      const useEmoji = Math.random() < 0.4;

      if (useEmoji) {
        const emoji = unicorns[Math.floor(Math.random() * unicorns.length)];
        el.className = "click-particle click-particle-emoji";
        el.textContent = emoji;
        el.style.fontSize = `${14 + Math.random() * 14}px`;
      } else {
        el.className = "click-particle click-particle-dot";
        const color = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
        const size = 4 + Math.random() * 7;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.background = color;
        el.style.boxShadow = `0 0 ${size}px ${color}`;
      }

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      document.body.appendChild(el);

      const dx = (Math.random() - 0.5) * 260;        // wide horizontal spread
      const peakY = -(40 + Math.random() * 60);      // low arc: 40-100px up
      const rotation = (Math.random() - 0.5) * 300;
      const dur = 0.8 + Math.random() * 0.5;

      // Horizontal: linear drift
      gsap.to(el, { x: dx, duration: dur, ease: "none" });

      // Rotation: linear spin
      gsap.to(el, { rotation, duration: dur, ease: "none" });

      // Vertical: single tween, up then down using a bezier-like custom ease
      // cubic-bezier(0.2, 0.8, 0.6, -0.2) gives a natural throw arc
      gsap.to(el, {
        keyframes: [
          { y: peakY, duration: dur * 0.35, ease: "power2.out" },
          { y: 60 + Math.random() * 60, duration: dur * 0.65, ease: "power2.in" },
        ],
      });

      // Fade: stay visible most of the flight, fade at the end
      gsap.to(el, {
        opacity: 0,
        scale: 0.4,
        duration: dur * 0.4,
        delay: dur * 0.6,
        ease: "power1.in",
        onComplete: () => {
          el.remove();
          activeParticles--;
        },
      });
    }
  }

  function isInteractive(target: HTMLElement) {
    return !!target.closest("a, button, input, summary, .filter-tab, .icon-btn");
  }

  function startHold(x: number, y: number) {
    holdX = x;
    holdY = y;
    isHolding = true;
    spawnFountain(holdX, holdY, 8);
    holdTimer = setInterval(() => {
      if (!isHolding) return;
      spawnFountain(holdX, holdY, 2);
    }, 100);
  }

  function stopHold() {
    isHolding = false;
    if (holdTimer) {
      clearInterval(holdTimer);
      holdTimer = null;
    }
  }

  // Mouse events
  document.addEventListener("mousedown", (e) => {
    if (isInteractive(e.target as HTMLElement)) return;
    startHold(e.clientX, e.clientY);
  });

  document.addEventListener("mousemove", (e) => {
    if (isHolding) { holdX = e.clientX; holdY = e.clientY; }
  });

  document.addEventListener("mouseup", stopHold);
  document.addEventListener("mouseleave", stopHold);

  // Touch events
  document.addEventListener("touchstart", (e) => {
    if (isInteractive(e.target as HTMLElement)) return;
    const t = e.touches[0];
    startHold(t.clientX, t.clientY);
  }, { passive: true });

  document.addEventListener("touchmove", (e) => {
    if (isHolding) {
      const t = e.touches[0];
      holdX = t.clientX;
      holdY = t.clientY;
    }
  }, { passive: true });

  document.addEventListener("touchend", stopHold);
  document.addEventListener("touchcancel", stopHold);
})();

// --- Init ---
projectCount.textContent = `${projects.length} projects`;
setTabCounts();
render();
