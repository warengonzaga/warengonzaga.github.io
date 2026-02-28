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

// --- Wandering Star with sparkle trail ---
const _wanderingStar = document.getElementById("wandering-star");
const hero = document.querySelector(".hero") as HTMLElement;

if (_wanderingStar && hero) {
  const wanderingStar = _wanderingStar; // capture as non-null for closures
  const sparkleColors = ["#fa3768", "#79e2ff", "#fff", "#fac832", "#8b5cf6"];
  let isMoving = false;

  // Safe zones around the edges, avoiding center content and scroll indicator.
  // Ordered clockwise so adjacent zones share edges (no crossing the center).
  const zones = [
    { top: [5, 15],  left: [5, 40] },    // 0: top-left
    { top: [5, 15],  left: [60, 95] },   // 1: top-right
    { top: [20, 55], left: [82, 95] },   // 2: right-upper
    { top: [58, 78], left: [80, 95] },   // 3: right-lower
    { top: [58, 78], left: [3, 18] },    // 4: left-lower
    { top: [20, 55], left: [3, 16] },    // 5: left-upper
  ];
  let lastZone = 2; // start from right side (matches CSS initial left: 88%)
  let currentSpeed = 0; // track travel speed for sparkle/glow intensity

  function randomPos() {
    // Pick an adjacent zone (±1 or ±2 steps) to avoid crossing center
    const step = Math.random() < 0.6
      ? (Math.random() < 0.5 ? 1 : -1)   // 60%: move 1 step
      : (Math.random() < 0.5 ? 2 : -2);  // 40%: move 2 steps
    lastZone = (lastZone + step + zones.length) % zones.length;
    const zone = zones[lastZone];
    return {
      top: zone.top[0] + Math.random() * (zone.top[1] - zone.top[0]),
      left: zone.left[0] + Math.random() * (zone.left[1] - zone.left[0]),
    };
  }

  const glowEl = wanderingStar.querySelector(".wandering-star-glow") as HTMLElement;

  // Move to a random spot, rest, repeat
  function wanderStep() {
    if (wanderingStar.classList.contains("open")) {
      setTimeout(wanderStep, 500);
      return;
    }

    const pos = randomPos();
    const speed = 2.5 + Math.random() * 3; // 2.5–5.5s travel time
    const rest = 2 + Math.random() * 3; // 2–5s rest at destination

    // Speed intensity: shorter duration = faster movement = higher value (0–1)
    currentSpeed = 1 - (speed - 2.5) / 3; // 1.0 at fastest (2.5s), 0.0 at slowest (5.5s)

    isMoving = true;

    // Scale glow size with speed — faster = bigger glow
    const glowSize = 60 + currentSpeed * 60; // 60px at rest → 120px at max speed
    gsap.to(glowEl, {
      width: glowSize,
      height: glowSize,
      opacity: 0.5 + currentSpeed * 0.5,
      duration: 0.6,
      ease: "power2.out",
    });

    gsap.to(wanderingStar, {
      top: `${pos.top}%`,
      left: `${pos.left}%`,
      duration: speed,
      ease: "sine.inOut",
      onComplete: () => {
        isMoving = false;
        currentSpeed = 0;

        // Shrink glow back to resting size
        gsap.to(glowEl, {
          width: 60,
          height: 60,
          opacity: 0.5,
          duration: 1,
          ease: "power2.out",
        });

        setTimeout(wanderStep, rest * 1000);
      },
    });
  }

  // Start after initial appear delay
  setTimeout(wanderStep, 2000);

  // Spawn sparkle particles — size & spread scale with movement speed
  function spawnSparkle() {
    if (wanderingStar.classList.contains("open")) return;

    const rect = wanderingStar.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();

    const sparkle = document.createElement("div");
    sparkle.className = "sparkle-particle";
    const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];

    // Scale size with speed: 2-4px at rest → up to 3-9px at max speed
    const size = 2 + currentSpeed * 3 + Math.random() * (2 + currentSpeed * 3);
    const spread = 8 + currentSpeed * 12; // spawn spread around star center
    const x = rect.left - heroRect.left + rect.width / 2 + (Math.random() - 0.5) * spread;
    const y = rect.top - heroRect.top + rect.height / 2 + (Math.random() - 0.5) * spread;

    const glowRadius = size * (2 + currentSpeed * 2);
    sparkle.style.cssText = `
      left: ${x}px; top: ${y}px;
      width: ${size}px; height: ${size}px;
      background: ${color};
      box-shadow: 0 0 ${glowRadius}px ${color};
    `;
    hero.appendChild(sparkle);

    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * 30 + currentSpeed * 20; // faster = fling farther
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;

    gsap.to(sparkle, {
      x: dx,
      y: dy,
      opacity: 0,
      scale: 0,
      duration: 0.5 + Math.random() * 0.6 + currentSpeed * 0.3,
      ease: "power2.out",
      onComplete: () => sparkle.remove(),
    });
  }

  // Sparkle rate: scales with speed — faster movement = more frequent sparkles
  function sparkleLoop() {
    spawnSparkle();
    // At max speed (1.0): ~60ms delay. At rest (0.0): ~450ms delay.
    const delay = isMoving
      ? 60 + (1 - currentSpeed) * 200 + Math.random() * 60
      : 400 + Math.random() * 150;
    setTimeout(sparkleLoop, delay);
  }
  setTimeout(sparkleLoop, 1500);

  // Click to show popup, pause wandering
  const popup = document.getElementById("wandering-star-popup")!;

  wanderingStar.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpening = !wanderingStar.classList.contains("open");
    wanderingStar.classList.toggle("open");

    if (isOpening) {
      // Kill active movement so star stays put
      gsap.killTweensOf(wanderingStar);
      gsap.killTweensOf(glowEl);
      isMoving = false;
      currentSpeed = 0;

      // Reset glow to resting state
      gsap.to(glowEl, { width: 60, height: 60, opacity: 0.5, duration: 0.4 });

      // Flip popup below star if near the top of the hero
      const starRect = wanderingStar.getBoundingClientRect();
      const heroRect = hero.getBoundingClientRect();
      const spaceAbove = starRect.top - heroRect.top;

      if (spaceAbove < 140) {
        popup.style.bottom = "auto";
        popup.style.top = "calc(100% + 16px)";
        popup.classList.add("flipped");
      } else {
        popup.style.bottom = "calc(100% + 16px)";
        popup.style.top = "auto";
        popup.classList.remove("flipped");
      }
    } else {
      // Resume wandering after closing
      setTimeout(wanderStep, 1000);
    }
  });

  document.addEventListener("click", (e) => {
    if (!wanderingStar.contains(e.target as Node) && wanderingStar.classList.contains("open")) {
      wanderingStar.classList.remove("open");
      setTimeout(wanderStep, 1000);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && wanderingStar.classList.contains("open")) {
      wanderingStar.classList.remove("open");
      setTimeout(wanderStep, 1000);
    }
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

  // Fountain: particles arc upward then fall — single tween with physics-like cubic bezier
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

      // Vertical: single tween — up then down using a bezier-like custom ease
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

  document.addEventListener("mousedown", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, .wandering-star, .filter-tab, .icon-btn")) return;

    holdX = e.clientX;
    holdY = e.clientY;
    isHolding = true;

    // Initial burst — a fountain spray
    spawnFountain(holdX, holdY, 8);

    // Hold: continuous fountain stream
    holdTimer = setInterval(() => {
      if (!isHolding) return;
      spawnFountain(holdX, holdY, 2);
    }, 100);
  });

  document.addEventListener("mousemove", (e) => {
    if (isHolding) {
      holdX = e.clientX;
      holdY = e.clientY;
    }
  });

  document.addEventListener("mouseup", () => {
    isHolding = false;
    if (holdTimer) {
      clearInterval(holdTimer);
      holdTimer = null;
    }
  });

  document.addEventListener("mouseleave", () => {
    isHolding = false;
    if (holdTimer) {
      clearInterval(holdTimer);
      holdTimer = null;
    }
  });
})();

// --- Init ---
render();
