/* =========================
   Dungeon Crawler Lite
   vignettes.js
   Story + ending vignette system
   ========================= */

let vignetteCancelRequested = false;
let vignetteRunning = false;
let vignetteResolveCurrent = null;
let vignetteTimeoutIds = [];

function waitMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForVignettePaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

function clearVignetteTimeouts() {
  vignetteTimeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
  vignetteTimeoutIds = [];
}

function queueVignetteTimeout(callback, delay) {
  const timeoutId = setTimeout(() => {
    vignetteTimeoutIds = vignetteTimeoutIds.filter((id) => id !== timeoutId);
    callback?.();
  }, delay);

  vignetteTimeoutIds.push(timeoutId);
  return timeoutId;
}

function resetVignetteStage() {
  clearVignetteTimeouts();

  [els.vignetteBg, els.vignetteBgOverlay].forEach((imgEl) => {
    if (!imgEl) return;
    imgEl.classList.add("hidden");
    imgEl.src = "";
    imgEl.style.objectPosition = "";
    imgEl.style.objectFit = "";
    imgEl.style.opacity = "";
    imgEl.style.transform = "";
    imgEl.style.filter = "";
    imgEl.style.mixBlendMode = "";
  });

  [els.vignetteImgA, els.vignetteImgB].forEach(img => {
    if (!img) return;
    img.classList.add("hidden");
    img.classList.remove("show");
    img.src = "";
    img.style.left = "";
    img.style.right = "";
    img.style.top = "";
    img.style.bottom = "";
  });

  if (els.vignettePartyLayer) {
    stopLoopingVignettePartyCheer();
    els.vignettePartyLayer.classList.add("hidden");
    els.vignettePartyLayer.classList.remove("show");
    els.vignettePartyLayer.innerHTML = "";
    els.vignettePartyLayer.style.left = "";
    els.vignettePartyLayer.style.right = "";
    els.vignettePartyLayer.style.top = "";
    els.vignettePartyLayer.style.bottom = "";
  }

  if (els.vignetteCredits) {
    els.vignetteCredits.classList.add("hidden");
    els.vignetteCredits.innerHTML = "";
  }

  if (els.vignetteText) {
    els.vignetteText.classList.remove("show");
    els.vignetteText.textContent = "";
  }

  if (els.vignetteFlash) {
    els.vignetteFlash.classList.add("hidden");
    els.vignetteFlash.classList.remove("flash-on");
  }
}

function showVignetteModal() {
  els.vignetteModal?.classList.remove("hidden");
}

function hideVignetteModal() {
  els.vignetteModal?.classList.add("hidden");
}

function ensureVignetteBackgroundOverlay() {
  if (els.vignetteBgOverlay || !els.vignetteStage) return els.vignetteBgOverlay;

  const overlay = document.createElement("img");
  overlay.id = "vignetteBgOverlay";
  overlay.className = "vignette-bg vignette-bg-overlay hidden";
  overlay.alt = "";

  if (els.vignetteBg?.nextSibling) {
    els.vignetteStage.insertBefore(overlay, els.vignetteBg.nextSibling);
  } else {
    els.vignetteStage.appendChild(overlay);
  }

  els.vignetteBgOverlay = overlay;
  return overlay;
}

function setVignetteBackgroundElement(imgEl, background) {
  if (!imgEl) return;
  if (!background) {
    imgEl.classList.add("hidden");
    imgEl.src = "";
    return;
  }

  const config = typeof background === "string"
    ? { src: background }
    : background;

  if (!config?.src) {
    imgEl.classList.add("hidden");
    imgEl.src = "";
    return;
  }

  imgEl.src = config.src;
  imgEl.style.objectPosition = config.objectPosition ?? "center center";
  imgEl.style.objectFit = config.objectFit ?? "cover";
  imgEl.style.opacity = config.opacity ?? "0.5";
  imgEl.style.transform = config.transform ?? "scale(1)";
  imgEl.style.filter = config.filter ?? "";
  imgEl.style.mixBlendMode = config.mixBlendMode ?? "";
  imgEl.classList.remove("hidden");
}

function setVignetteBackground(background) {
  setVignetteBackgroundElement(els.vignetteBg, background);
}

function setVignetteBackgroundOverlay(background) {
  const overlayEl = ensureVignetteBackgroundOverlay();
  setVignetteBackgroundElement(overlayEl, background);
}

function escapeCreditsHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setVignetteCredits(credits) {
  if (!els.vignetteCredits) return;

  if (!credits?.lines?.length) {
    els.vignetteCredits.classList.add("hidden");
    els.vignetteCredits.innerHTML = "";
    return;
  }

  const heading = credits.heading
    ? `<div class="vignette-credits-heading">${escapeCreditsHtml(credits.heading)}</div>`
    : "";
  const lines = credits.lines
    .map((line) => `<div class="vignette-credits-line">${line}</div>`)
    .join("");

  els.vignetteCredits.innerHTML = `
    <div class="vignette-credits-roll" style="animation-duration:${credits.duration ?? 11}s;">
      ${heading}
      ${lines}
    </div>
  `;
  els.vignetteCredits.classList.remove("hidden");
}

function setVignetteActor(imgEl, config) {
  if (!imgEl) return;

  if (!config || !config.src) {
    imgEl.classList.add("hidden");
    imgEl.classList.remove("show");
    imgEl.src = "";
    imgEl.style.left = "";
    imgEl.style.right = "";
    imgEl.style.top = "";
    imgEl.style.bottom = "";
    imgEl.style.maxWidth = "";
    imgEl.style.maxHeight = "";
    imgEl.style.width = "";
    imgEl.style.height = "";
    imgEl.style.zIndex = "";
    imgEl.style.opacity = "";
    imgEl.style.transform = "";
    imgEl.style.filter = "";
    imgEl.style.mixBlendMode = "";
    return;
  }

  imgEl.src = config.src;
  imgEl.alt = config.alt || "";
  imgEl.classList.remove("hidden");
  imgEl.classList.remove("show");

  if (config.left !== undefined) {
    imgEl.style.left = config.left;
    imgEl.style.right = "auto";
  } else if (config.right !== undefined) {
    imgEl.style.right = config.right;
    imgEl.style.left = "auto";
  } else {
    imgEl.style.left = "";
    imgEl.style.right = "";
  }

  if (config.top !== undefined) {
    imgEl.style.top = config.top;
    imgEl.style.bottom = "auto";
  } else if (config.bottom !== undefined) {
    imgEl.style.bottom = config.bottom;
    imgEl.style.top = "auto";
  } else {
    imgEl.style.top = "";
    imgEl.style.bottom = "";
  }

  imgEl.style.maxWidth = config.maxWidth ?? "";
  imgEl.style.maxHeight = config.maxHeight ?? "";
  imgEl.style.width = config.width ?? "";
  imgEl.style.height = config.height ?? "";
  imgEl.style.zIndex = config.zIndex ?? "";
  imgEl.style.opacity = config.opacity ?? "";
  imgEl.style.transform = config.transform ?? "";
  imgEl.style.filter = config.filter ?? "";
  imgEl.style.mixBlendMode = config.mixBlendMode ?? "";

  requestAnimationFrame(() => {
    imgEl.classList.add("show");
  });
}

function setVignetteParty(config) {
  if (!els.vignettePartyLayer) return;

  if (!config) {
    els.vignettePartyLayer.classList.add("hidden");
    els.vignettePartyLayer.classList.remove("show");
    els.vignettePartyLayer.innerHTML = "";
    return;
  }

  const players = (config.players || gameState.players || []).filter(Boolean);
  if (!players.length) {
    els.vignettePartyLayer.classList.add("hidden");
    els.vignettePartyLayer.classList.remove("show");
    els.vignettePartyLayer.innerHTML = "";
    return;
  }

  const formationOffsets = [
    { x: -10, y: 4, scale: 0.96 },
    { x: -3, y: -4, scale: 1 },
    { x: 4, y: 2, scale: 0.97 },
    { x: 11, y: -3, scale: 0.95 },
  ];

  els.vignettePartyLayer.innerHTML = players.map((player, index) => {
    const offset = formationOffsets[index] || { x: 0, y: 0, scale: 1 };
    return `
    <div
      class="vignette-party-token"
      title="${player.name || "Hero"}"
      style="--party-offset-x:${offset.x}px; --party-offset-y:${offset.y}px; --party-token-scale:${offset.scale};"
    >
      <img
        class="vignette-party-token-img"
        src="./img/heroes/${player.id || "fighter"}.png"
        alt="${player.name || "Hero"}"
      />
    </div>
  `;
  }).join("");

  applyVignettePartyConfig(config);
  els.vignettePartyLayer.classList.remove("hidden");

  requestAnimationFrame(() => {
    els.vignettePartyLayer?.classList.add("show");
  });
}

function applyVignettePartyConfig(config = {}) {
  if (!els.vignettePartyLayer) return;
  els.vignettePartyLayer.style.left = config.left ?? "";
  els.vignettePartyLayer.style.right = config.right ?? "";
  els.vignettePartyLayer.style.top = config.top ?? "";
  els.vignettePartyLayer.style.bottom = config.bottom ?? "10%";
  els.vignettePartyLayer.style.setProperty("--vignette-party-scale", String(config.scale ?? 1));
}

function jumpVignetteParty() {
  if (!els.vignettePartyLayer) return;
  els.vignettePartyLayer.classList.remove("party-jump");
  void els.vignettePartyLayer.offsetWidth;
  els.vignettePartyLayer.classList.add("party-jump");
}

async function cheerVignetteParty() {
  if (!els.vignettePartyLayer) return;

  const tokens = Array.from(els.vignettePartyLayer.querySelectorAll(".vignette-party-token"));
  if (!tokens.length) return;

  for (const token of tokens) {
    if (vignetteCancelRequested) return;
    token.classList.remove("is-cheering");
    void token.offsetWidth;
    token.classList.add("is-cheering");
    await waitMs(110);
  }
}

function startLoopingVignettePartyCheer() {
  if (!els.vignettePartyLayer) return;

  const tokens = Array.from(els.vignettePartyLayer.querySelectorAll(".vignette-party-token"));
  tokens.forEach((token, index) => {
    token.classList.remove("is-cheering", "is-cheering-loop");
    token.style.animationDelay = `${index * 0.14}s`;
    token.classList.add("is-cheering-loop");
  });
}

function stopLoopingVignettePartyCheer() {
  if (!els.vignettePartyLayer) return;

  const tokens = Array.from(els.vignettePartyLayer.querySelectorAll(".vignette-party-token"));
  tokens.forEach((token) => {
    token.classList.remove("is-cheering-loop");
    token.style.animationDelay = "";
  });
}

async function fadeOutVignettePartyOneByOne(players = gameState.players || []) {
  if (!els.vignettePartyLayer) return;

  const tokens = Array.from(els.vignettePartyLayer.querySelectorAll(".vignette-party-token"));
  if (!tokens.length) return;

  for (let index = 0; index < tokens.length; index += 1) {
    if (vignetteCancelRequested) return;

    const token = tokens[index];
    const player = players[index];
    if (!token) continue;

    token.classList.remove("is-fading");
    void token.offsetWidth;
    token.classList.add("is-fading");

    if (player) {
      const action = Math.random() < 0.5 ? "no" : "grunt";
      AudioManager.playCharacterSound(player.gender || "male", action);
    }

    await waitMs(220);
    token.classList.add("is-faded");
    await waitMs(260);
  }
}

async function showVignetteText(text, hold = 1600) {
  if (!els.vignetteText) return;
  els.vignetteText.classList.remove("show");
  await waitMs(50);
  els.vignetteText.textContent = text || "";
  requestAnimationFrame(() => {
    els.vignetteText.classList.add("show");
  });
  await waitMs(hold);
}

function flashVignette() {
  if (!els.vignetteFlash) return;
  els.vignetteFlash.classList.remove("hidden");
  els.vignetteFlash.classList.remove("flash-on");
  void els.vignetteFlash.offsetWidth;
  els.vignetteFlash.classList.add("flash-on");
}

function applyVignetteStepMotion(step) {
  if (step.moveA && els.vignetteImgA) {
    Object.assign(els.vignetteImgA.style, step.moveA);
  }

  if (step.moveB && els.vignetteImgB) {
    Object.assign(els.vignetteImgB.style, step.moveB);
  }

  if (step.moveParty && els.vignettePartyLayer) {
    applyVignettePartyConfig(step.moveParty);
  }

  if (step.moveBackground && els.vignetteBg) {
    Object.assign(els.vignetteBg.style, step.moveBackground);
  }

  if (step.moveBackgroundOverlay && els.vignetteBgOverlay) {
    Object.assign(els.vignetteBgOverlay.style, step.moveBackgroundOverlay);
  }

  if (step.partyJump) {
    jumpVignetteParty();
  }
}

function stepHasMotion(step) {
  return Boolean(
    step.moveA ||
    step.moveB ||
    step.moveParty ||
    step.moveBackground ||
    step.moveBackgroundOverlay ||
    step.partyJump
  );
}

async function playVignetteSequence(steps = []) {
  if (vignetteRunning) return;

  vignetteRunning = true;
  vignetteCancelRequested = false;
  showVignetteModal();
  resetVignetteStage();

  const skipHandler = () => {
    vignetteCancelRequested = true;
    if (vignetteResolveCurrent) vignetteResolveCurrent();
  };

  els.vignetteSkipBtn?.addEventListener("click", skipHandler);

  try {
    for (const step of steps) {
      if (vignetteCancelRequested) break;

      if (step.stopMusic) {
        AudioManager.stopMusic?.();
      }

      if (step.music) {
        AudioManager.playMusic?.(step.music, step.musicLoop ?? true);
      }

      if (typeof step.onStart === "function") step.onStart();

      if (step.background !== undefined) {
        setVignetteBackground(step.background);
      }

      if (step.backgroundOverlay !== undefined) {
        setVignetteBackgroundOverlay(step.backgroundOverlay);
      }

      if (step.actorA !== undefined) {
        setVignetteActor(els.vignetteImgA, step.actorA);
      }

      if (step.actorB !== undefined) {
        setVignetteActor(els.vignetteImgB, step.actorB);
      }

      if (step.party !== undefined) {
        setVignetteParty(step.party);
      }

      if (step.credits !== undefined) {
        setVignetteCredits(step.credits);
      }

      if (step.flash) {
        flashVignette();
      }

      if (step.moveBeforeText && stepHasMotion(step)) {
        await waitForVignettePaint();
        applyVignetteStepMotion(step);
      }

      if (step.text) {
        await showVignetteText(step.text, step.textDuration ?? 1500);
      }

      if (step.pause) {
        await new Promise(resolve => {
          vignetteResolveCurrent = resolve;
          setTimeout(resolve, step.pause);
        });
        vignetteResolveCurrent = null;
      }

      if (!step.moveBeforeText && stepHasMotion(step)) {
        applyVignetteStepMotion(step);
      }

      if (stepHasMotion(step)) {
        await waitMs(step.moveDuration ?? 800);
      }

      if (typeof step.onComplete === "function") step.onComplete();
    }
  } finally {
    els.vignetteSkipBtn?.removeEventListener("click", skipHandler);
    resetVignetteStage();
    hideVignetteModal();
    vignetteRunning = false;
    vignetteCancelRequested = false;
    vignetteResolveCurrent = null;
  }
}

function showRestartPrompt() {
  if (gameState.devSuppressRestartPrompt) return;

  const container = document.createElement("div");
  container.id = "restartPrompt";
  container.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  const btn = document.createElement("button");
  btn.textContent = "Start New Adventure";
  btn.style.cssText = `
    padding: 12px 24px;
    font-size: 1.4rem;
    border-radius: 14px;
    border: none;
    background: #4da6d9;
    color: #fff;
    cursor: pointer;
  `;

  btn.addEventListener("click", () => {
    container.remove();
    resetGame();
  });

  container.appendChild(btn);
  document.body.appendChild(container);
}

async function playIntroVignette() {
  await playVignetteSequence([
    {
      background: {
        src: "./img/vignettes/castle_exterior_large.png",
        objectPosition: "center top",
        objectFit: "cover",
        opacity: "0.72",
        transform: "scale(1.02)",
      },
      flash: true,
      text: "On a storm-torn night, the heroes glimpse the castle at the summit...",
      textDuration: 2000,
      onStart: () => AudioManager.playSFX("thunder"),
    },
    {
      moveBackground: {
        objectPosition: "center bottom",
        transform: "scale(1.08)",
      },
      moveDuration: 2600,
      pause: 100,
    },
    {
      background: {
        src: "./img/vignettes/castle_exterior_large.png",
        objectPosition: "center bottom",
        objectFit: "cover",
        opacity: "0.78",
        transform: "scale(1.08)",
      },
      party: {
        left: "50%",
        bottom: "6%",
      },
      text: "At the foot of the winding path, the whole party steels themselves and begins the climb.",
      textDuration: 2200,
      onStart: () => AudioManager.playSFX("footsteps"),
    },
    {
      moveParty: {
        left: "50%",
        bottom: "11%",
      },
      moveDuration: 1200,
      pause: 250,
      text: "Inside its halls lie monsters, treasure... and something far more dangerous.",
      textDuration: 2000,
    }
  ]);
}

async function playFloorTransitionVignette(floorLevel) {
  if (floorLevel >= (gameState.bossFloor || 4)) {
    await playVignetteSequence([
      {
        background: {
          src: "./img/vignettes/transition_to_boss_bg.png",
          objectPosition: "center bottom",
          objectFit: "cover",
          opacity: "0.78",
          transform: "scale(1.04)",
        },
        party: {
          left: "34%",
          bottom: "8%",
          scale: 0.82,
        },
        text: "The heroes enter the throne room where the heart of evil hoards its treasure.",
        textDuration: 2100,
        onStart: () => AudioManager.playSFX("stairs"),
      },
      {
        moveBackground: {
          objectPosition: "center top",
          transform: "scale(1.1)",
        },
        moveParty: {
          left: "34%",
          bottom: "-18%",
          scale: 0.76,
        },
        moveDuration: 2400,
        pause: 180,
      },
      {
        background: {
          src: "./img/vignettes/transition_to_boss_2.png",
          objectPosition: "center top",
          objectFit: "cover",
          opacity: "0.8",
          transform: "scale(1.04)",
        },
        party: {
          left: "34%",
          bottom: "-18%",
          scale: 0.76,
        },
        moveBackground: {
          objectPosition: "center bottom",
          transform: "scale(1.08)",
        },
        moveParty: {
          left: "34%",
          bottom: "8%",
          scale: 0.82,
        },
        moveDuration: 1500,
        pause: 120,
      },
      {
        background: {
          src: "./img/vignettes/transition_to_boss_2.png",
          objectPosition: "center bottom",
          objectFit: "cover",
          opacity: "0.8",
          transform: "scale(1.08)",
        },
        actorB: {
          src: "./img/monsters/gradefivicus.png",
          right: "10%",
          top: "-34%",
          maxWidth: "40%",
          maxHeight: "72%",
          alt: "Gradefivicus",
          zIndex: "3",
        },
        party: {
          left: "34%",
          bottom: "8%",
          scale: 0.82,
        },
        moveB: {
          right: "10%",
          top: "8%",
        },
        moveBeforeText: true,
        moveDuration: 1700,
        text: "Gradefivicus, the two-headed dragon lord approaches! It's now or never, heroes!",
        textDuration: 2200,
        partyJump: true,
        onStart: () => {
          AudioManager.playSFX("gate_slam");
          setTimeout(() => {
            AudioManager.playSFX("boss_roar");
          }, 220);
        },
      }
    ]);
    return;
  }

  await playVignetteSequence([
    {
      background: "./img/vignettes/stairs_transition_bg.png",
      party: {
        left: "50%",
        bottom: "16%",
        scale: 1.06,
      },
      text: `The party descends to Floor ${floorLevel}...`,
      textDuration: 1400,
      onStart: () => AudioManager.playSFX("stairs"),
    },
    {
      moveParty: {
        left: "47%",
        bottom: "10%",
        scale: 0.82,
      },
      moveDuration: 1100,
      pause: 120,
    },
    {
      background: "./img/vignettes/stairs_transition_bg_shut.png",
      party: {
        left: "47%",
        bottom: "10%",
        scale: 0.82,
      },
      text: "The door slams shut behind them. There is no turning back now.",
      textDuration: 1500,
      onStart: () => AudioManager.playSFX("gate_slam"),
      partyJump: true,
      moveDuration: 420,
    }
  ]);
}

async function playVictoryEnding() {
  const starringLine = (gameState.players || [])
    .filter(Boolean)
    .map((player) => escapeCreditsHtml(player.name || "Hero"))
    .join("   •   ");

  await playVignetteSequence([
    {
      background: {
        src: "./img/vignettes/throne_room_bg.png",
        objectPosition: "center center",
        objectFit: "cover",
        opacity: "0.82",
        transform: "scale(1.03)",
      },
      music: "victory",
      musicLoop: true,
      party: {
        left: "50%",
        bottom: "12%",
        scale: 0.96,
      },
      text: "The evil dragon is defeated, and the treasure belongs to the heroes!",
      textDuration: 2500,
      pause: 700,
      onStart: () => {
        AudioManager.playSFX("battle_victory");
        queueVignetteTimeout(() => {
          cheerVignetteParty();
        }, 260);
      },
    },
    {
      moveParty: {
        left: "53%",
        bottom: "15%",
        scale: 1.02,
      },
      moveDuration: 900,
      pause: 700,
    },
    {
      background: {
        src: "./img/vignettes/village_festival.png",
        objectPosition: "center center",
        objectFit: "cover",
        opacity: "0.86",
        transform: "scale(1.02)",
      },
      flash: true,
      party: {
        left: "50%",
        bottom: "7%",
        scale: 0.88,
      },
      text: "In the village, the people celebrate the heroes' triumph with a grand festival.",
      textDuration: 4200,
      pause: 3200,
      onStart: () => {
        queueVignetteTimeout(() => {
          startLoopingVignettePartyCheer();
        }, 260);
      },
      onComplete: () => {
        stopLoopingVignettePartyCheer();
      },
    },
    {
      background: {
        src: "",
        objectPosition: "center center",
        objectFit: "cover",
        opacity: "0",
        transform: "scale(1)",
      },
      party: null,
      credits: {
        heading: "Credits",
        duration: 11,
        lines: [
          "<strong>Game Design</strong><br>Mr. Andy",
          "<strong>Lead Programmer</strong><br>Mr. Andy",
          "<strong>Curriculum Wrangling</strong><br>Mr. Andy",
          `<strong>Starring</strong><br>${starringLine || "The Heroes"}`,
          "<strong>And Introducing</strong><br>Gradefivicus, Two-Headed Dragon Lord",
          "Thanks for playing Monster Castle Quest.",
        ],
      },
      text: "",
      pause: 10200,
    }
  ]);

  showRestartPrompt();
}

async function playDefeatEnding() {
  await playVignetteSequence([
    {
      background: {
        src: "./img/vignettes/game_over_bg.png",
        objectPosition: "center center",
        objectFit: "cover",
        opacity: "0.88",
        transform: "scale(1.04)",
      },
      party: {
        left: "50%",
        bottom: "11%",
        scale: 1.04,
      },
      text: "One by one, the heroes fall...",
      textDuration: 1900,
      pause: 1200,
      onStart: () => {
        AudioManager.playSFX("defeat");
        queueVignetteTimeout(() => {
          fadeOutVignettePartyOneByOne();
        }, 260);
      },
    },
    {
      background: {
        src: "./img/vignettes/village_noshadow.png",
        objectPosition: "center center",
        objectFit: "cover",
        opacity: "0.86",
        transform: "scale(1.03)",
      },
      backgroundOverlay: {
        src: "./img/vignettes/dragon_shadow.png",
        objectPosition: "center center",
        objectFit: "contain",
        opacity: "0.64",
        transform: "translateY(78%) scale(1.32)",
        filter: "blur(1px)",
      },
      party: null,
      actorB: null,
      moveBackgroundOverlay: {
        opacity: "0.2",
        filter: "blur(1.6px)",
        transform: "translateY(-82%) scale(1.18)",
      },
      moveBeforeText: true,
      moveDuration: 3600,
      text: "The shadow of evil still threatens the land.",
      textDuration: 2100,
    }
  ]);

  showRestartPrompt();
}
