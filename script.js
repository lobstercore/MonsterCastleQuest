/* =========================
   Dungeon Crawler Lite
   script.js
   Core game coordinator
   ========================= */

const gameState = {
  screen: "splash",
  partySize: 4,
  selectedCharacters: [],
  availableCharacters: [
    { id: "fighter", name: "Fighter", gender: "male" },
    { id: "wizard", name: "Wizard", gender: "male" },
    { id: "elf", name: "Elf", gender: "male" },
    { id: "witch", name: "Witch", gender: "female" },
    { id: "ninja", name: "Ninja", gender: "male" },
    { id: "swordMaiden", name: "Sword Maiden", gender: "female" },
    { id: "rogue", name: "Rogue", gender: "female" },
    { id: "barbarian", name: "Barbarian ", gender: "male" },
    { id: "ranger", name: "Ranger", gender: "female" },
    { id: "valkyrie", name: "Valkyrie", gender: "female" },
  ],
  players: [],
  activePlayerIndex: 0,
  partyKeys: {},
  currentFloor: null,
  room: {
    areaTitle: "Castle Entrance",
    monster: { name: "Slime", hp: 3, maxHp: 3, icon: "monster", rewardGold: 24 },
    hasChest: true,
    hasShop: false,
    hasBossStairs: false,
    exits: { north: null, south: null, east: null, west: null },
  },
  battleOpen: false,
  eventOpen: false,
  pendingInteraction: null,
  devSuppressRestartPrompt: false,
  currentBattle: null,
  partyEntrance: "start",
  partyTransition: null,
  floorLevel: 1,
  bossFloor: 4,
  battleTimer: {
    duration: 8000,
    remaining: 8000,
    intervalId: null,
    onExpire: null,
  },
  chestLock: {
    active: false,
    challenge: null,
    wheels: [],
    duration: 0,
    expiresAt: 0,
    timerIntervalId: null,
    spinIntervalId: null,
    penaltyMs: 0,
    failed: false,
  },
};

const els = {};

const partyAnchors = {
  start: [
    { left: "49%", top: "68%" },
    { left: "55%", top: "68%" },
    { left: "46%", top: "76%" },
    { left: "58%", top: "76%" },
  ],
  north: [
    { left: "49%", top: "22%" },
    { left: "55%", top: "22%" },
    { left: "46%", top: "30%" },
    { left: "58%", top: "30%" },
  ],
  south: [
    { left: "49%", top: "64%" },
    { left: "55%", top: "64%" },
    { left: "46%", top: "72%" },
    { left: "58%", top: "72%" },
  ],
  east: [
    { left: "73%", top: "47%" },
    { left: "79%", top: "47%" },
    { left: "71%", top: "56%" },
    { left: "81%", top: "56%" },
  ],
  west: [
    { left: "15%", top: "47%" },
    { left: "21%", top: "47%" },
    { left: "13%", top: "56%" },
    { left: "23%", top: "56%" },
  ],
};

const partyTransitionAnchors = {
  exit: {
    north: partyAnchors.north.map((p) => ({ ...p })),
    south: partyAnchors.south.map((p) => ({ ...p })),
    east: partyAnchors.east.map((p) => ({ ...p })),
    west: partyAnchors.west.map((p) => ({ ...p })),
  },
  enter: {
    north: [
      { left: "49%", top: "-10%" },
      { left: "55%", top: "-10%" },
      { left: "46%", top: "-18%" },
      { left: "58%", top: "-18%" },
    ],
    south: [
      { left: "49%", top: "104%" },
      { left: "55%", top: "104%" },
      { left: "46%", top: "112%" },
      { left: "58%", top: "112%" },
    ],
    east: [
      { left: "107%", top: "47%" },
      { left: "113%", top: "47%" },
      { left: "105%", top: "56%" },
      { left: "115%", top: "56%" },
    ],
    west: [
      { left: "-11%", top: "47%" },
      { left: "-5%", top: "47%" },
      { left: "-13%", top: "56%" },
      { left: "-3%", top: "56%" },
    ],
  },
};

const monstersByLevel = {
  level_1: [
    { id: "slime", name: "Slime", hp: 2, maxHp: 2, rewardGold: 16 },
    { id: "goblin", name: "Goblin", hp: 3, maxHp: 3, rewardGold: 20 },
    { id: "ogre", name: "Ogre", hp: 4, maxHp: 4, rewardGold: 28 },
    { id: "ghost", name: "Ghost", hp: 3, maxHp: 3, rewardGold: 24 },
    { id: "zombie", name: "Zombie", hp: 4, maxHp: 4, rewardGold: 28 },
    { id: "skeleton", name: "Skeleton", hp: 3, maxHp: 3, rewardGold: 20 },
  ],
  level_2: [
    { id: "giant-spider", name: "Giant Spider", hp: 5, maxHp: 5, rewardGold: 32 },
    { id: "werewolf", name: "Werewolf", hp: 6, maxHp: 6, rewardGold: 36 },
    { id: "vampire", name: "Vampire", hp: 7, maxHp: 7, rewardGold: 52 },
    { id: "golem", name: "Golem", hp: 9, maxHp: 9, rewardGold: 60 },
    { id: "bat", name: "Bat", hp: 4, maxHp: 4, rewardGold: 40 },
    { id: "mummy", name: "Mummy", hp: 6, maxHp: 6, rewardGold: 44 },
  ],
  level_3: [
    { id: "dragon", name: "Dragon", hp: 10, maxHp: 10, rewardGold: 72 },
    { id: "kraken", name: "Kraken", hp: 11, maxHp: 11, rewardGold: 80 },
    { id: "beholder", name: "Beholder", hp: 10, maxHp: 10, rewardGold: 72 },
    { id: "demon-lord", name: "Demon Lord", hp: 12, maxHp: 12, rewardGold: 92 },
    { id: "giant", name: "Giant", hp: 9, maxHp: 9, rewardGold: 60 },
    { id: "fire-elemental", name: "Fire Elemental", hp: 8, maxHp: 8, rewardGold: 56 },
  ],
};

let gameEndingInProgress = false;

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheDom();
  bindEvents();
  setupQuestionSystemDefaults();
  renderAll();
  startLogoIntroSequence();
}

function cacheDom() {
  els.logoIntroOverlay = document.getElementById("logoIntroOverlay");
  els.splashScreen = document.getElementById("splashScreen");
  els.setupScreen = document.getElementById("setupScreen");
  els.characterSelectScreen = document.getElementById("characterSelectScreen");
  els.adventureScreen = document.getElementById("adventureScreen");

  els.enterSetupBtn = document.getElementById("enterSetupBtn");
  els.toCharacterSelectBtn = document.getElementById("toCharacterSelectBtn");
  els.startAdventureBtn = document.getElementById("startAdventureBtn");
  els.optionsBtn = document.getElementById("optionsBtn");
  els.soundBtn = document.getElementById("soundBtn");
  els.contentPickerGrid = document.getElementById("contentPickerGrid");
  els.contentSelectionCount = document.getElementById("contentSelectionCount");
  els.contentWordCount = document.getElementById("contentWordCount");
  els.selectAllContentBtn = document.getElementById("selectAllContentBtn");
  els.clearContentBtn = document.getElementById("clearContentBtn");
  els.setupAudioControls = document.getElementById("setupAudioControls");
  els.questionTypePicker = document.getElementById("questionTypePicker");
  els.selectedContentTags = document.getElementById("selectedContentTags");

  els.characterChoices = Array.from(document.querySelectorAll(".character-choice"));
  els.selectedParty = document.getElementById("selectedParty");
  els.partySizeButtons = [];

  els.areaTitle = document.getElementById("areaTitle");
  els.partyKeyring = document.getElementById("partyKeyring");
  els.partyKeySlots = document.getElementById("partyKeySlots");
  els.roomDetritusLayer = document.getElementById("roomDetritusLayer");
  els.playerCards = Array.from(document.querySelectorAll(".player-card"));
  els.actionButtons = Array.from(document.querySelectorAll(".action-btn"));
  els.questionPrompt = document.querySelector("#questionPrompt p") || document.getElementById("questionPrompt");
  els.answerChoices = document.getElementById("answerChoices");

  els.vignetteModal = document.getElementById("vignetteModal");
  els.vignetteStage = document.getElementById("vignetteStage");
  els.vignetteBg = document.getElementById("vignetteBg");
  els.vignetteBgOverlay = document.getElementById("vignetteBgOverlay");
  els.vignetteImgA = document.getElementById("vignetteImgA");
  els.vignetteImgB = document.getElementById("vignetteImgB");
  els.vignettePartyLayer = document.getElementById("vignettePartyLayer");
  els.vignetteCredits = document.getElementById("vignetteCredits");
  els.vignetteFlash = document.getElementById("vignetteFlash");
  els.vignetteText = document.getElementById("vignetteText");
  els.vignetteSkipBtn = document.getElementById("vignetteSkipBtn");

  els.northDoor = document.querySelector(".north-door");
  els.westDoor = document.querySelector(".west-door");
  els.eastDoor = document.querySelector(".east-door");
  els.southDoor = document.querySelector(".south-door");
  els.blockedEntryButton = document.querySelector(".room-object.blocked-entry");
  els.blockedEntryImg = document.querySelector(".blocked-entry-img");

  const doors = [
    { button: els.northDoor, closed: "door_1_closed.png", open: "door_1_open.png", locked: "door_1_locked.png" },
    { button: els.westDoor, closed: "door_2_closed.png", open: "door_2_open.png", locked: "door_2_locked.png" },
    { button: els.eastDoor, closed: "door_3_closed.png", open: "door_3_open.png", locked: "door_3_locked.png" },
    { button: els.southDoor, closed: "door_1_closed.png", open: "door_1_open.png", locked: "door_1_locked.png" },
  ];

  doors.forEach(({ button, closed, open, locked }) => {
    if (!button) return;
    const img = button.querySelector(".door-img");
    if (!img) return;

    button.dataset.closedImg = closed;
    button.dataset.openImg = open;
    button.dataset.lockedImg = locked;
    syncDoorButtonArt(button);

    button.addEventListener("mousedown", () => {
      if (button.classList.contains("is-locked")) {
        syncDoorButtonArt(button);
        return;
      }
      img.src = `./img/objects/${open}`;
    });
    button.addEventListener("mouseup", () => {
      syncDoorButtonArt(button);
    });
    button.addEventListener("mouseleave", () => {
      syncDoorButtonArt(button);
    });
  });

  els.monsterButton = document.querySelector(".room-object.monster");
  els.chestButton = document.querySelector(".room-object.chest");
  els.shopButton = document.querySelector(".room-object.shop");
  els.stairsButton = document.querySelector(".room-object.stairs");

  els.partyTokens = Array.from(document.querySelectorAll(".party-token"));
  els.partyTokenImgs = Array.from(document.querySelectorAll(".party-token-img"));
  els.roomMonsterImg = document.querySelector(".room-monster-img");
  els.roomMonsterLabel = document.querySelector(".room-object.monster .room-object-label");
  els.roomMonsterHp = document.querySelector(".room-object.monster .room-monster-hp");

  els.battleModal = document.getElementById("battleModal");
  els.eventModal = document.getElementById("eventModal");
  els.closeEventBtn = document.getElementById("closeEventBtn");
  els.battleMessage = document.getElementById("battleMessage");

  els.battleOverlay = document.getElementById("battleOverlay");
  els.battleFxLayer = document.getElementById("battleFxLayer");
  els.battleStatusText = document.getElementById("battleStatusText");
  els.battleCenterPanel = document.querySelector(".battle-center-panel");
  els.battleMonsterName = document.getElementById("battleMonsterName");
  els.battleMonsterHp = document.getElementById("battleMonsterHp");
  els.battleMonsterImg = document.getElementById("battleMonsterImg");
  els.battleMonsterCard = document.getElementById("battleMonsterCard");
  els.chestLockOverlay = document.getElementById("chestLockOverlay");
  els.chestLockStatusText = document.getElementById("chestLockStatusText");
  els.chestLockTimerContainer = document.getElementById("chestLockTimerContainer");
  els.chestLockTimerBar = document.getElementById("chestLockTimerBar");
  els.chestLockHintImg = document.getElementById("chestLockHintImg");
  els.chestLockWheels = document.getElementById("chestLockWheels");

  els.battlePartyUnits = Array.from(document.querySelectorAll(".battle-party-unit[data-battle-player]"));
  els.battlePartyImgs = Array.from(document.querySelectorAll(".battle-unit-img[data-battle-img]"));
  els.battlePartyNames = Array.from(document.querySelectorAll(".battle-unit-name[data-battle-name]"));
  els.battlePartyHps = Array.from(document.querySelectorAll(".battle-unit-hp[data-battle-hp]"));

  els.shopModal = document.getElementById("shopModal");
  els.shopPlayerInfo = document.getElementById("shopPlayerInfo");
  els.shopItemList = document.getElementById("shopItemList");
  els.closeShopBtn = document.getElementById("closeShopBtn");
  els.inventoryModal = document.getElementById("inventoryModal");
  els.inventoryPlayerInfo = document.getElementById("inventoryPlayerInfo");
  els.inventoryItemList = document.getElementById("inventoryItemList");
  els.inventoryTradePanel = document.getElementById("inventoryTradePanel");
  els.inventoryTradeTargets = document.getElementById("inventoryTradeTargets");
  els.inventoryDropBtn = document.getElementById("inventoryDropBtn");
  els.inventoryTradeBtn = document.getElementById("inventoryTradeBtn");
  els.closeInventoryBtn = document.getElementById("closeInventoryBtn");
  els.inventoryConfirmModal = document.getElementById("inventoryConfirmModal");
  els.chestRewardModal = document.getElementById("chestRewardModal");
  els.chestRewardSummary = document.getElementById("chestRewardSummary");
  els.chestRewardItemImg = document.getElementById("chestRewardItemImg");
  els.chestRewardItemName = document.getElementById("chestRewardItemName");
  els.chestRewardItemDesc = document.getElementById("chestRewardItemDesc");
  els.chestRewardTargets = document.getElementById("chestRewardTargets");
  els.inventoryConfirmText = document.getElementById("inventoryConfirmText");
  els.inventoryConfirmDropBtn = document.getElementById("inventoryConfirmDropBtn");
  els.inventoryCancelDropBtn = document.getElementById("inventoryCancelDropBtn");
  els.optionsModal = document.getElementById("optionsModal");
  els.optionsMainMenuBtn = document.getElementById("optionsMainMenuBtn");
  els.optionsRestartBtn = document.getElementById("optionsRestartBtn");
  els.floorSkipSelect = document.getElementById("floorSkipSelect");
  els.floorSkipBtn = document.getElementById("floorSkipBtn");
  els.vignetteDevSelect = document.getElementById("vignetteDevSelect");
  els.vignetteDevBtn = document.getElementById("vignetteDevBtn");
  els.closeOptionsBtn = document.getElementById("closeOptionsBtn");
  els.soundModal = document.getElementById("soundModal");
  els.toggleMusicBtn = document.getElementById("toggleMusicBtn");
  els.toggleSfxBtn = document.getElementById("toggleSfxBtn");
  els.closeSoundBtn = document.getElementById("closeSoundBtn");
}

function syncDoorButtonArt(button) {
  if (!button) return;

  const img = button.querySelector(".door-img");
  if (!img) return;

  const isLocked = button.classList.contains("is-locked");
  const nextImage = isLocked
    ? (button.dataset.lockedImg || button.dataset.closedImg)
    : button.dataset.closedImg;

  if (nextImage) {
    img.src = `./img/objects/${nextImage}`;
  }
}
function bindEvents() {
  els.enterSetupBtn?.addEventListener("click", () => {
    setScreen("setup");
    AudioManager.loadAudio();
    AudioManager.playMusic("mainTheme");
  });

  els.toCharacterSelectBtn?.addEventListener("click", handleSetupContinue);
  els.selectAllContentBtn?.addEventListener("click", selectAllSetupContent);
  els.clearContentBtn?.addEventListener("click", clearSetupContent);

  els.startAdventureBtn?.addEventListener("click", () => {
    AudioManager.stopMusic();
    startAdventure();
  });

  els.optionsBtn?.addEventListener("click", handleOptionsPlaceholder);
  els.soundBtn?.addEventListener("click", handleSoundToggle);
  els.closeShopBtn?.addEventListener("click", closeShopModal);
  els.closeEventBtn?.addEventListener("click", closeEventModal);
  els.closeInventoryBtn?.addEventListener("click", closeInventoryModal);
  els.inventoryDropBtn?.addEventListener("click", promptDropSelectedInventoryItem);
  els.inventoryTradeBtn?.addEventListener("click", beginInventoryTrade);
  els.inventoryConfirmDropBtn?.addEventListener("click", confirmDropSelectedInventoryItem);
  els.inventoryCancelDropBtn?.addEventListener("click", closeInventoryConfirmModal);

  els.optionsMainMenuBtn?.addEventListener("click", returnToMainMenu);
  els.optionsRestartBtn?.addEventListener("click", restartToCharacterSelect);
  els.floorSkipBtn?.addEventListener("click", handleFloorSkip);
  els.vignetteDevBtn?.addEventListener("click", handleDevVignettePlay);
  els.closeOptionsBtn?.addEventListener("click", closeOptionsModal);
  els.toggleMusicBtn?.addEventListener("click", toggleMusicSetting);
  document.addEventListener("click", handleGlobalUiClick);
  els.toggleSfxBtn?.addEventListener("click", toggleSfxSetting);
  els.closeSoundBtn?.addEventListener("click", closeSoundModal);
  bindCharacterButtons();
  bindActionButtons();
  bindPartySizeButtons();
  bindRoomObjectButtons();
}

function bindPartySizeButtons() {
  els.partySizeButtons.forEach((button) => {
    button.addEventListener("click", () => {});
  });
}

function waitMs(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

async function startLogoIntroSequence() {
  const introOverlay = els.logoIntroOverlay;
  if (!introOverlay) return;

  introOverlay.classList.remove("hidden");
  introOverlay.classList.remove("is-fading");
  await waitMs(1500);
  introOverlay.classList.add("is-fading");
  await waitMs(700);
  introOverlay.classList.add("hidden");
}

function getSetupQuestionConfig() {
  if (typeof getQuestionConfigSnapshot === "function") {
    return getQuestionConfigSnapshot();
  }

  return {
    mode: "auto",
    selectedUnit: null,
    selectedChapter: null,
    selectedSources: [],
    contentScope: "chapter",
    allowQuestionTypes: {
      zhToEn: true,
      enToZh: true,
      cloze: true,
      image: true,
    },
  };
}

function buildContentSourceKey(unitKey, chapterKey) {
  return `${unitKey}::${chapterKey}`;
}

function applySetupQuestionConfig({ selectedSources, allowQuestionTypes } = {}) {
  if (typeof configureQuestionSystem !== "function") return;

  const current = getSetupQuestionConfig();
  const nextSources = Array.isArray(selectedSources) ? selectedSources : current.selectedSources;
  const nextQuestionTypes = allowQuestionTypes
    ? { ...current.allowQuestionTypes, ...allowQuestionTypes }
    : current.allowQuestionTypes;
  const firstSource = nextSources[0] || null;
  const hasNoSourcesSelected = Array.isArray(nextSources) && nextSources.length === 0;

  configureQuestionSystem({
    mode: "auto",
    selectedUnit: firstSource?.unitKey || (hasNoSourcesSelected ? null : current.selectedUnit || null),
    selectedChapter: firstSource?.chapterKey || (hasNoSourcesSelected ? null : current.selectedChapter || null),
    selectedSources: nextSources,
    contentScope: "chapter",
    allowQuestionTypes: nextQuestionTypes,
  });

  renderSetupPlanner();
}

function toggleSetupContentSource(unitKey, chapterKey) {
  const current = getSetupQuestionConfig();
  const sourceKey = buildContentSourceKey(unitKey, chapterKey);
  const selectedLookup = new Set(
    (current.selectedSources || []).map((source) => buildContentSourceKey(source.unitKey, source.chapterKey))
  );

  let nextSources;
  if (selectedLookup.has(sourceKey)) {
    nextSources = (current.selectedSources || []).filter(
      (source) => buildContentSourceKey(source.unitKey, source.chapterKey) !== sourceKey
    );
  } else {
    nextSources = [
      ...(current.selectedSources || []),
      { unitKey, chapterKey },
    ];
  }

  applySetupQuestionConfig({ selectedSources: nextSources });
}

function toggleSetupUnit(unitKey) {
  if (typeof getContentCatalog !== "function") return;

  const current = getSetupQuestionConfig();
  const catalog = getContentCatalog();
  const unit = catalog.find((entry) => entry.unitKey === unitKey);
  if (!unit) return;

  const availableChapters = unit.chapters
    .filter((chapter) => chapter.wordCount > 0)
    .map((chapter) => ({ unitKey, chapterKey: chapter.chapterKey }));
  const selectedLookup = new Set(
    (current.selectedSources || []).map((source) => buildContentSourceKey(source.unitKey, source.chapterKey))
  );
  const unitIsFullySelected = availableChapters.length > 0 && availableChapters.every((source) =>
    selectedLookup.has(buildContentSourceKey(source.unitKey, source.chapterKey))
  );

  let nextSources = (current.selectedSources || []).filter((source) => source.unitKey !== unitKey);
  if (!unitIsFullySelected) {
    nextSources = [...nextSources, ...availableChapters];
  }

  applySetupQuestionConfig({ selectedSources: nextSources });
}

function selectAllSetupContent() {
  if (typeof getDefaultSelectedSources !== "function") return;
  applySetupQuestionConfig({ selectedSources: getDefaultSelectedSources() });
}

function clearSetupContent() {
  applySetupQuestionConfig({ selectedSources: [] });
}

function toggleSetupQuestionType(typeKey) {
  const current = getSetupQuestionConfig();
  const currentValue = Boolean(current.allowQuestionTypes?.[typeKey]);

  applySetupQuestionConfig({
    allowQuestionTypes: {
      [typeKey]: !currentValue,
    },
  });
}

function renderSetupPlanner() {
  if (!els.contentPickerGrid || typeof getContentCatalog !== "function") return;

  const catalog = getContentCatalog();
  const current = getSetupQuestionConfig();
  const selectedLookup = new Set(
    (current.selectedSources || []).map((source) => buildContentSourceKey(source.unitKey, source.chapterKey))
  );
  const selectedCatalogEntries = [];
  let selectedWordCount = 0;

  catalog.forEach((unit) => {
    unit.chapters.forEach((chapter) => {
      if (!selectedLookup.has(buildContentSourceKey(unit.unitKey, chapter.chapterKey))) return;
      selectedCatalogEntries.push({
        unitKey: unit.unitKey,
        unitLabel: unit.unitLabel,
        chapterKey: chapter.chapterKey,
        chapterLabel: chapter.chapterLabel,
        wordCount: chapter.wordCount,
      });
      selectedWordCount += chapter.wordCount;
    });
  });

  if (els.contentSelectionCount) {
    const selectedCount = selectedCatalogEntries.length;
    els.contentSelectionCount.textContent = `${selectedCount} ${selectedCount === 1 ? "chapter" : "chapters"} selected`;
  }

  if (els.contentWordCount) {
    els.contentWordCount.textContent = `${selectedWordCount} words ready`;
  }

  els.contentPickerGrid.innerHTML = catalog.map((unit) => {
    const selectableChapters = unit.chapters.filter((chapter) => chapter.wordCount > 0);
    const selectedCount = selectableChapters.filter((chapter) =>
      selectedLookup.has(buildContentSourceKey(unit.unitKey, chapter.chapterKey))
    ).length;
    const unitIsFullySelected = selectableChapters.length > 0 && selectedCount === selectableChapters.length;

    return `
      <section class="content-unit-card ${unit.totalWords === 0 ? "is-empty" : ""}">
        <div class="content-unit-header">
          <div>
            <h4>${unit.unitLabel}</h4>
            <p>${selectedCount}/${selectableChapters.length || 0} chapters ready</p>
          </div>
          <button
            type="button"
            class="content-unit-toggle"
            data-unit-toggle="${unit.unitKey}"
            ${selectableChapters.length ? "" : "disabled"}
          >
            ${unitIsFullySelected ? "Clear Unit" : "Select Unit"}
          </button>
        </div>
        <div class="content-chapter-list">
          ${unit.chapters.map((chapter) => {
            const isSelected = selectedLookup.has(buildContentSourceKey(unit.unitKey, chapter.chapterKey));
            const isEmpty = chapter.wordCount === 0;
            return `
              <button
                type="button"
                class="content-chip ${isSelected ? "selected" : ""} ${isEmpty ? "is-disabled" : ""}"
                data-unit-key="${unit.unitKey}"
                data-chapter-key="${chapter.chapterKey}"
                ${isEmpty ? "disabled" : ""}
              >
                <span class="content-chip-title">${chapter.chapterLabel}</span>
                <span class="content-chip-meta">${isEmpty ? "No words yet" : `${chapter.wordCount} words`}</span>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }).join("");

  els.contentPickerGrid.querySelectorAll("[data-unit-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleSetupUnit(button.dataset.unitToggle);
    });
  });

  els.contentPickerGrid.querySelectorAll("[data-unit-key][data-chapter-key]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleSetupContentSource(button.dataset.unitKey, button.dataset.chapterKey);
    });
  });

  if (els.setupAudioControls) {
    const musicVolume = Math.round((AudioManager.getMusicVolume?.() ?? 1) * 100);
    const sfxVolume = Math.round((AudioManager.getSfxVolume?.() ?? 1) * 100);

    els.setupAudioControls.innerHTML = `
      <label class="setup-audio-row" for="setupMusicVolume">
        <span class="setup-audio-label">Music</span>
        <input
          id="setupMusicVolume"
          class="setup-audio-slider"
          type="range"
          min="0"
          max="100"
          step="1"
          value="${musicVolume}"
        />
        <span id="setupMusicVolumeValue" class="setup-audio-value">${musicVolume}%</span>
      </label>
      <label class="setup-audio-row" for="setupSfxVolume">
        <span class="setup-audio-label">SFX</span>
        <input
          id="setupSfxVolume"
          class="setup-audio-slider"
          type="range"
          min="0"
          max="100"
          step="1"
          value="${sfxVolume}"
        />
        <span id="setupSfxVolumeValue" class="setup-audio-value">${sfxVolume}%</span>
      </label>
    `;

    const musicSlider = document.getElementById("setupMusicVolume");
    const musicValue = document.getElementById("setupMusicVolumeValue");
    const sfxSlider = document.getElementById("setupSfxVolume");
    const sfxValue = document.getElementById("setupSfxVolumeValue");

    musicSlider?.addEventListener("input", () => {
      const normalized = Math.max(0, Math.min(1, Number(musicSlider.value) / 100));
      AudioManager.setMusicVolume?.(normalized);
      if (musicValue) musicValue.textContent = `${Math.round(normalized * 100)}%`;
      syncSoundModalButtons();
    });

    sfxSlider?.addEventListener("input", () => {
      const normalized = Math.max(0, Math.min(1, Number(sfxSlider.value) / 100));
      AudioManager.setSfxVolume?.(normalized);
      if (sfxValue) sfxValue.textContent = `${Math.round(normalized * 100)}%`;
      syncSoundModalButtons();
    });
  }

  if (els.selectedContentTags) {
    els.selectedContentTags.innerHTML = selectedCatalogEntries.length
      ? selectedCatalogEntries.map((entry) => `
          <button
            type="button"
            class="selected-content-tag"
            data-unit-key="${entry.unitKey}"
            data-chapter-key="${entry.chapterKey}"
            title="Remove ${entry.unitLabel} ${entry.chapterLabel}"
          >
            <span>${entry.unitLabel}</span>
            <strong>${entry.chapterLabel}</strong>
          </button>
        `).join("")
      : '<div class="selected-content-empty">No chapters selected yet.</div>';

    els.selectedContentTags.querySelectorAll("[data-unit-key][data-chapter-key]").forEach((button) => {
      button.addEventListener("click", () => {
        toggleSetupContentSource(button.dataset.unitKey, button.dataset.chapterKey);
      });
    });
  }

  const enabledQuestionTypeCount = Object.values(current.allowQuestionTypes || {}).filter(Boolean).length;
  if (els.toCharacterSelectBtn) {
    els.toCharacterSelectBtn.disabled = selectedCatalogEntries.length === 0 || selectedWordCount < 4 || enabledQuestionTypeCount === 0;
  }
}

function handleSetupContinue() {
  const current = getSetupQuestionConfig();
  const selectedSources = current.selectedSources || [];
  const enabledQuestionTypeCount = Object.values(current.allowQuestionTypes || {}).filter(Boolean).length;
  const selectedWordCount = selectedSources.reduce((sum, source) => {
    const chapterWords = vocabData?.[source.unitKey]?.[source.chapterKey];
    return sum + (Array.isArray(chapterWords) ? chapterWords.length : 0);
  }, 0);

  if (!selectedSources.length) {
    openEventModal("Choose at least one chapter before recruiting heroes.");
    return;
  }

  if (selectedWordCount < 4) {
    openEventModal("Choose at least four words of content so the question deck has enough answers.");
    return;
  }

  if (!enabledQuestionTypeCount) {
    openEventModal("Enable at least one question type before continuing.");
    return;
  }

  setScreen("characterSelect");
}

function bindCharacterButtons() {
  els.characterChoices.forEach((button) => {
    button.onclick = () => {
      const charId = button.dataset.character;
      toggleCharacterSelection(charId);
    };
  });
}

function bindActionButtons() {
  els.actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      els.actionButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      handleActionButton(button.textContent.trim());
    });
  });
}

function bindRoomObjectButtons() {
  els.northDoor?.addEventListener("click", async () => {
    if (!getCurrentRoom?.()) return;
    const didMove = await handleDoorClick("north");
    if (didMove && !gameState.currentBattle) endTurn();
  });

  els.westDoor?.addEventListener("click", async () => {
    if (!getCurrentRoom?.()) return;
    const didMove = await handleDoorClick("west");
    if (didMove && !gameState.currentBattle) endTurn();
  });

  els.eastDoor?.addEventListener("click", async () => {
    if (!getCurrentRoom?.()) return;
    const didMove = await handleDoorClick("east");
    if (didMove && !gameState.currentBattle) endTurn();
  });

  els.southDoor?.addEventListener("click", async () => {
    if (!getCurrentRoom?.()) return;
    const didMove = await handleDoorClick("south");
    if (didMove && !gameState.currentBattle) endTurn();
  });

  els.monsterButton?.addEventListener("click", () => {
    if (!gameState.room.monster) return;
    startBattleEncounter();
  });

  els.chestButton?.addEventListener("click", async () => {
    if (!gameState.room.hasChest) {
      openEventModal("There is no chest in this room.");
      return;
    }

    if (await maybeTriggerGuardedEncounter?.("chest")) return;
    startChestEncounter();
  });

  els.shopButton?.addEventListener("click", () => {
    openShopModal();
  });

  els.stairsButton?.addEventListener("click", () => {
    enterStairs();
    endTurn();
  });

  els.blockedEntryButton?.addEventListener("click", () => {
    const message = els.blockedEntryButton?.dataset.message;
    if (message) {
      openEventModal(message);
    }
  });
}

function setScreen(screenName) {
  gameState.screen = screenName;

  const screenMap = {
    splash: els.splashScreen,
    setup: els.setupScreen,
    characterSelect: els.characterSelectScreen,
    adventure: els.adventureScreen,
  };

  Object.values(screenMap).forEach((screenEl) => {
    if (!screenEl) return;
    screenEl.classList.add("hidden");
  });

  screenMap[screenName]?.classList.remove("hidden");

  if (screenName === "setup") {
    renderSetupPlanner();
  }

  if (screenName === "characterSelect") {
    renderCharacterChoices();
    renderSelectedParty();
  }
}

function toggleCharacterSelection(charId) {
  const alreadySelected = gameState.selectedCharacters.includes(charId);

  if (alreadySelected) {
    gameState.selectedCharacters = gameState.selectedCharacters.filter((id) => id !== charId);
  } else {
    if (gameState.selectedCharacters.length >= gameState.partySize) return;
    gameState.selectedCharacters.push(charId);

    const charData = gameState.availableCharacters.find((character) => character.id === charId);
    const gender = charData?.gender || "male";
    AudioManager.playSFX(`lets-go-${gender}`);
  }

  renderCharacterChoices();
  renderSelectedParty();
}

function renderCharacterChoices() {
  const rosterEl = document.getElementById("characterRoster");
  if (!rosterEl) return;

  rosterEl.innerHTML = gameState.availableCharacters.map((char) => {
    const isSelected = gameState.selectedCharacters.includes(char.id);

    return `
      <button class="character-choice ${isSelected ? "selected" : ""}" data-character="${char.id}">
        <img class="character-choice-img" src="./img/heroes/${char.id}.png" alt="${char.name}" />
        <span>${char.name}</span>
      </button>
    `;
  }).join("");

  els.characterChoices = Array.from(rosterEl.querySelectorAll(".character-choice"));
  bindCharacterButtons();
}

function renderSelectedParty() {
  const container = els.selectedParty;
  if (!container) return;

  const selectedSlots = Array.from({ length: gameState.partySize }, (_, index) => {
    const charId = gameState.selectedCharacters[index] || null;
    return charId
      ? gameState.availableCharacters.find((candidate) => candidate.id === charId) || null
      : null;
  });

  container.innerHTML = selectedSlots.map((char, index) => {
    if (!char) {
      return `
        <div class="party-slot is-empty">
          <span class="party-slot-empty-label">Open Slot ${index + 1}</span>
        </div>
      `;
    }

    return `
      <div class="party-slot">
        <img class="player-portrait" src="./img/heroes/${char.id}.png" alt="${char.name}">
        <span class="player-name">${char.name}</span>
        <span class="player-hp">${getIconMarkup("heart", "Hearts", "ui-inline-icon stat-icon")}<span>5</span></span>
      </div>
    `;
  }).join("");
}

function getHeroImagePath(heroId) {
  return `./img/heroes/${heroId}.png`;
}

function getMonsterImagePath(monsterId) {
  return `./img/monsters/${monsterId}.png`;
}

function getIconPath(iconId) {
  return `./img/icons/${iconId}.png`;
}

function getIconMarkup(iconId, alt, className = "ui-inline-icon") {
  return `<img class="${className}" src="${getIconPath(iconId)}" alt="${alt}" />`;
}

async function startAdventure() {
  const fallbackCharacters = gameState.availableCharacters
    .slice(0, gameState.partySize)
    .map((char) => char.id);

  const chosenIds = gameState.selectedCharacters.length
    ? [...gameState.selectedCharacters, ...fallbackCharacters.filter((id) => !gameState.selectedCharacters.includes(id))]
    : fallbackCharacters;

  gameState.players = chosenIds.slice(0, gameState.partySize).map((id, index) => {
    const char = gameState.availableCharacters.find((candidate) => candidate.id === id);
    return {
      id: char.id,
      name: char.name,
      gender: char.gender || "male",
      hp: 5,
      maxHp: 5,
      gold: 0,
      items: [],
      damageBonus: 0,
      hasShield: false,
      shieldCharges: 0,
      shieldChargesUsedThisBattle: 0,
      index,
    };
  });

  gameState.activePlayerIndex = 0;
  gameState.partyKeys = {};
  gameState.pendingInteraction = null;
  gameState.floorLevel = 1;
  gameState.partyEntrance = "start";
  gameState.partyTransition = null;
  gameState.currentBattle = null;
  resetChestLockState?.();
  initializeFloorState?.(gameState.floorLevel);

  clearQuestionIfAvailable();
  setScreen("adventure");

  await playIntroVignette();
  renderAdventureUI();
  renderLevelStats();
  AudioManager.playDungeonBGM(gameState.floorLevel);
  await handleRoomEntryMonsterBehavior?.();
}

function renderAdventureUI() {
  renderAreaTitle();
  renderPartyKeyring();
  renderLevelStats();
  renderRoomBackground();
  renderPlayerCards();
  renderPartyTokens();
  renderRoomDetritus?.();
  renderRoomObjects();
  renderChestLockOverlay?.();
  renderQuestionPanel();
}

function renderPartyKeyring() {
  if (!els.partyKeyring || !els.partyKeySlots) return;

  const keyOrder = ["key_gold"];
  const activeKeys = keyOrder
    .map((keyId) => ({ keyId, count: Math.max(0, Number(gameState.partyKeys?.[keyId] || 0)) }))
    .filter((entry) => entry.count > 0);

  const fallbackKeys = Object.entries(gameState.partyKeys || {})
    .filter(([keyId, count]) => !keyOrder.includes(keyId) && Number(count) > 0)
    .map(([keyId, count]) => ({ keyId, count: Math.max(0, Number(count || 0)) }));

  const visibleKeys = [...activeKeys, ...fallbackKeys];
  const slotCount = Math.max(3, visibleKeys.length);

  els.partyKeySlots.innerHTML = Array.from({ length: slotCount }, (_, index) => {
    const keyEntry = visibleKeys[index];
    if (!keyEntry) {
      return `<div class="party-key-slot item-slot item-slot-empty" aria-hidden="true" title="Empty key slot"></div>`;
    }

    const keyItem = typeof itemData === "object" && itemData ? itemData[keyEntry.keyId] : null;
    const keyName = keyItem?.name || keyEntry.keyId;
    const iconPath = `./img/items/${keyEntry.keyId}.png`;

    return `
      <div
        class="party-key-slot item-slot"
        title="${keyName} x${keyEntry.count}"
        aria-label="${keyName} x${keyEntry.count}"
      >
        <img class="item-icon-img" src="${iconPath}" alt="${keyName}" />
        <span class="party-key-count">${keyEntry.count}</span>
      </div>
    `;
  }).join("");

  els.partyKeyring.classList.toggle("has-keys", visibleKeys.length > 0);
}

function renderRoomBackground() {
  const roomBackground = document.getElementById("roomBackground");
  if (!roomBackground) return;

  const normalizedFloor = Math.max(1, Math.min(gameState.floorLevel || 1, gameState.bossFloor || 4));
  roomBackground.style.backgroundImage = `url("./img/objects/room_background_${normalizedFloor}.png")`;
}
function renderAreaTitle() {
  if (els.areaTitle) {
    const currentRoom = typeof getCurrentRoom === "function" ? getCurrentRoom() : gameState.room;
    els.areaTitle.textContent = `${currentRoom?.areaTitle || "Dungeon"} - Floor ${gameState.floorLevel}`;
  }
}

function renderPlayerCards() {
  if (!els.playerCards || !els.playerCards.length) return;

  els.playerCards.forEach((card, index) => {
    const player = gameState.players[index];

    if (!player) {
      card.classList.add("hidden");
      return;
    }

    card.classList.remove("hidden");
    const isFallen = player.hp <= 0;
    card.classList.toggle("active-player", index === gameState.activePlayerIndex && !isFallen);
    card.classList.toggle("ko", isFallen);

    const portraitEl = card.querySelector(".player-portrait");
    const nameEl = card.querySelector(".player-name");
    const heartsEl = card.querySelector(".hearts");
    const goldEl = card.querySelector(".gold");
    const itemsEl = card.querySelector(".player-items");

    if (portraitEl) {
      portraitEl.src = `./img/heroes/${player.id || "fighter"}.png`;
      portraitEl.alt = player.name || "Hero";
    }

    if (nameEl) nameEl.textContent = player.name;
    if (heartsEl) {
      heartsEl.innerHTML = `
        <span class="stat-primary">
          ${getIconMarkup("heart", "Hearts", "ui-inline-icon stat-icon")}
          <span>${player.hp} / ${player.maxHp ?? 5}</span>
        </span>
        ${renderShieldIcons(player)}
      `;
    }
    if (goldEl) {
      goldEl.innerHTML = `
        <span class="stat-primary">
          ${getIconMarkup("gold", "Gold", "ui-inline-icon stat-icon gold-stat-icon")}
          <span>${player.gold}</span>
        </span>
      `;
    }

    if (itemsEl) {
      const cardActionsDisabled = player.hp <= 0;
      const inventoryButtonMarkup = `
        <button
          type="button"
          class="inventory-open-btn"
          data-player-index="${index}"
          title="${cardActionsDisabled ? `${player.name} has fallen and cannot act.` : `Open ${player.name}'s inventory`}"
          ${cardActionsDisabled ? "disabled" : ""}
        >
          <img class="inventory-open-icon" src="./img/icons/inventory.png" alt="Inventory" />
        </button>
      `;
      const passTurnButtonMarkup = `
        <button
          type="button"
          class="pass-turn-card-btn"
          data-pass-turn-player-index="${index}"
          onclick="if (Number(this.dataset.passTurnPlayerIndex) === gameState.activePlayerIndex && !this.disabled) { passTurn(); }"
          title="${cardActionsDisabled ? `${player.name} has fallen and cannot act.` : `Pass ${player.name}'s turn`}"
          ${(index === gameState.activePlayerIndex && !cardActionsDisabled) ? "" : "disabled"}
        >
          <img class="pass-turn-icon" src="./img/icons/pass_turn.png" alt="Pass turn" />
        </button>
      `;

      const itemSlotCount = Math.max(3, player.items.length);
      const itemSlotMarkup = Array.from({ length: itemSlotCount }, (_, itemIndex) => {
        const item = player.items[itemIndex];
        if (!item) {
          return `
            <div
              class="item-slot item-slot-empty"
              aria-hidden="true"
              title="Empty inventory slot"
            ></div>
          `;
        }

        return `
          <button
            class="item-icon-btn item-slot ${item.usable ? "usable-item" : "passive-item"}"
            data-player-index="${index}"
            data-item-index="${itemIndex}"
            title="${cardActionsDisabled ? `${player.name} has fallen and cannot use items.` : `${item.name}: ${item.description}`}"
            ${cardActionsDisabled ? "disabled" : ""}
          >
            <img class="item-icon-img" src="./img/items/${item.id}.png" alt="${item.name}" />
          </button>
        `;
      }).join("");

      itemsEl.innerHTML = `
        <div class="items-header">
          <span class="items-label">Items:</span>
          <div class="items-actions">${inventoryButtonMarkup}${passTurnButtonMarkup}</div>
        </div>
        <div class="item-icon-row">
          ${itemSlotMarkup}
        </div>
      `;
    }
  });

  bindItemIconListeners();
  bindInventoryButtons();
}

function getShieldChargeCount(player) {
  return Math.max(0, Number(player?.shieldCharges ?? 0));
}

function getUsedShieldChargeCount(player) {
  return Math.max(0, Number(player?.shieldChargesUsedThisBattle ?? 0));
}

function hasAvailableShieldCharge(player) {
  return getShieldChargeCount(player) > getUsedShieldChargeCount(player);
}

function consumeShieldCharge(player) {
  if (!player || !hasAvailableShieldCharge(player)) return false;
  player.shieldChargesUsedThisBattle = getUsedShieldChargeCount(player) + 1;
  player.hasShield = hasAvailableShieldCharge(player);
  return true;
}

function resetBattleShieldUsage() {
  gameState.players.forEach((player) => {
    if (!player) return;
    player.shieldChargesUsedThisBattle = 0;
    player.hasShield = getShieldChargeCount(player) > 0;
  });
}

function renderShieldIcons(player) {
  const total = getShieldChargeCount(player);
  if (!total) return "";

  const used = Math.min(getUsedShieldChargeCount(player), total);
  const icons = Array.from({ length: total }, (_, index) => {
    const stateClass = index < used ? "is-used" : "is-ready";
    return `
      <img
        class="shield-icon ${stateClass}"
        src="${getIconPath("shield")}"
        alt="Shield"
        title="Shield charge ${index + 1}"
      />
    `;
  }).join("");

  return `<span class="shield-icon-row" aria-label="${total} shield charge${total === 1 ? "" : "s"}">${icons}</span>`;
}

function renderPartyTokens() {
  if (!els.partyTokens || !els.partyTokens.length) return;
  if (!els.partyTokenImgs || !els.partyTokenImgs.length) return;

  let anchorSet = null;

  if (gameState.partyTransition) {
    anchorSet = partyTransitionAnchors[gameState.partyTransition.mode]?.[gameState.partyTransition.direction];
  }

  if (!anchorSet) {
    const key = gameState.partyEntrance || "start";
    anchorSet = partyAnchors[key] || partyAnchors.start;
  }

  els.partyTokens.forEach((token, index) => {
    const player = gameState.players[index];
    if (!player) {
      token.classList.add("hidden");
      return;
    }

    token.classList.remove("hidden");
    token.classList.toggle("active-token", index === gameState.activePlayerIndex && player.hp > 0);
    token.classList.toggle("ko-token", player.hp <= 0);
    token.title = player.hp <= 0 ? `${player.name} (fallen)` : player.name;

    const pos = anchorSet[index] || anchorSet[0];
    token.style.left = pos.left ?? "50%";
    token.style.top = pos.top ?? "75%";
    token.style.right = "auto";
    token.style.bottom = "auto";
    token.style.opacity = "1";

    const img = els.partyTokenImgs[index];
    if (img) {
      img.src = `./img/heroes/${player.id || "fighter"}.png`;
      img.alt = player.name || "Hero";
    }

    token.style.transition = "left 0.32s ease, top 0.32s ease, opacity 0.24s ease";
  });
}

function renderQuestionPanel() {
  const question = getQuestionIfAvailable();

  if (question) {
    renderQuestionPromptHtml(els.questionPrompt, question);
    renderQuestionChoices(els.answerChoices, question, handleQuestionChoice);
    return;
  }

  if (gameState.chestLock?.active) {
    if (els.questionPrompt) {
      const answerLength = gameState.chestLock.challenge?.answer?.length || 0;
      els.questionPrompt.innerHTML = `
        <div class="question-message-card">
          <div class="question-kicker">Chest Lock</div>
          <div class="question-main-text">Use the picture hint and stop each wheel on the correct letter.</div>
          <div class="question-subtext">${answerLength}-letter word. Wrong stops cut time from the bar.</div>
        </div>
      `;
    }
    if (els.answerChoices) {
      els.answerChoices.innerHTML = defaultAnswerChoiceMarkup();
    }
    return;
  }

  const activePlayer = gameState.players[gameState.activePlayerIndex];
  if (!activePlayer) {
    if (els.questionPrompt) {
      els.questionPrompt.innerHTML = `
        <div class="question-message-card is-idle">
          <div class="question-kicker">Adventure Guide</div>
          <div class="question-main-text">The review prompt will appear here.</div>
        </div>
      `;
    }
    if (els.answerChoices) {
      els.answerChoices.innerHTML = defaultAnswerChoiceMarkup();
    }
    return;
  }

  if (els.questionPrompt) {
    els.questionPrompt.innerHTML = `
      <div class="question-message-card is-idle">
        <div class="question-kicker">${activePlayer.name}'s Turn</div>
        <div class="question-main-text">Choose a monster, chest, or door.</div>
        <div class="question-subtext">Battle foes, search for treasure, or move deeper into the dungeon.</div>
      </div>
    `;
  }

  if (els.answerChoices) {
    els.answerChoices.innerHTML = defaultAnswerChoiceMarkup();
  }
}

function defaultAnswerChoiceMarkup() {
  return `
    <button class="answer-btn" disabled>Answer A</button>
    <button class="answer-btn" disabled>Answer B</button>
    <button class="answer-btn" disabled>Answer C</button>
    <button class="answer-btn" disabled>Answer D</button>
  `;
}

function handleActionButton(label) {
  switch (label) {
    case "Open Door":
      openEventModal("Tap one of the highlighted doors to move to another room.");
      break;
    case "Open Chest":
      if (gameState.room.hasChest) {
        startChestEncounter();
      } else {
        openEventModal("There is no chest in this room.");
      }
      break;
    case "Fight":
      if (gameState.room.monster) {
        startBattleEncounter();
      } else {
        openEventModal("There is no monster here.");
      }
      break;
    case "Shop":
      if (gameState.room.hasShop) {
        openShopModal();
      } else {
        openEventModal("There is no shop in this room.");
      }
      break;
    case "Use Item":
      openEventModal("Item use will be added after the basic loop works.");
      break;
    default:
      openEventModal(`Action selected: ${label}`);
  }
}

function nextPlayerTurn() {
  if (!gameState.players.length) return;
  const livingPlayerExists = gameState.players.some((player) => player && player.hp > 0);
  if (!livingPlayerExists) return;
  gameState.activePlayerIndex = getNextLivingPlayerIndex(gameState.activePlayerIndex);
}

function handleQuestionChoice(selectedChoice) {
  const question = getQuestionIfAvailable();
  if (!question) return;

  if (question.type === "manual") {
    handleManualQuestionResult(selectedChoice);
    return;
  }

  if (typeof checkQuestionAnswer !== "function") return;

  const result = checkQuestionAnswer(selectedChoice);

  if (!result.context && gameState.pendingInteraction === "chest") {
    result.context = { source: "chest" };
  }

  resolveQuestionOutcome(result);
}

function resolveQuestionOutcome(result) {
  if (!result) return;

  const context = result.context || {};

  if (context.source === "battle" || gameState.pendingInteraction === "battle") {
    resolveBattleQuestion(result.isCorrect);
    return;
  }

  if (context.source === "chest" || gameState.pendingInteraction === "chest") {
    resolveChestQuestion(result.isCorrect);
    return;
  }

  clearQuestionIfAvailable();
  gameState.pendingInteraction = null;
  renderAdventureUI();
}

function handleManualQuestionResult(selectedChoice) {
  const isCorrect = selectedChoice === "correct";
  resolveQuestionOutcome({
    isCorrect,
    question: getQuestionIfAvailable(),
    context: getQuestionContextIfAvailable(),
    correctAnswer: null,
  });
}

function endTurn() {
  clearQuestionIfAvailable?.();
  gameState.pendingInteraction = null;
  closeShopModal?.();
  nextPlayerTurn();
  renderAdventureUI();
}

function passTurn() {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  if (!activePlayer) return;
  openEventModal(`${activePlayer.name} passed.`);
  endTurn();
}

function handleGlobalUiClick(event) {
  const passTurnButton = event.target.closest(".pass-turn-card-btn");
  if (passTurnButton) {
    const playerIndex = Number(passTurnButton.dataset.passTurnPlayerIndex);
    if (playerIndex === gameState.activePlayerIndex && !passTurnButton.disabled) {
      passTurn();
    }
    return;
  }
}


function handleOptionsPlaceholder() {
  openOptionsModal();
}
function openOptionsModal() {
  syncOptionsModalControls();
  els.optionsModal?.classList.remove("hidden");
}

function closeOptionsModal() {
  els.optionsModal?.classList.add("hidden");
}

function syncOptionsModalControls() {
  if (!els.floorSkipSelect) return;

  const maxFloor = Math.max(1, Number(gameState.bossFloor || 4));
  els.floorSkipSelect.innerHTML = Array.from({ length: maxFloor }, (_, index) => {
    const floor = index + 1;
    const label = floor === maxFloor ? `Floor ${floor} (Boss)` : `Floor ${floor}`;
    return `<option value="${floor}">${label}</option>`;
  }).join("");

  els.floorSkipSelect.value = String(
    Math.max(1, Math.min(maxFloor, Number(gameState.floorLevel || 1)))
  );
  els.floorSkipSelect.disabled = gameState.screen !== "adventure";
  if (els.floorSkipBtn) {
    els.floorSkipBtn.disabled = gameState.screen !== "adventure";
  }

  if (els.vignetteDevSelect) {
    const currentFloor = Math.max(1, Math.min(maxFloor, Number(gameState.floorLevel || 1)));
    els.vignetteDevSelect.value = currentFloor >= maxFloor ? "floor" : (els.vignetteDevSelect.value || "intro");
  }

  if (els.vignetteDevBtn) {
    els.vignetteDevBtn.disabled = false;
  }
}

async function handleFloorSkip() {
  if (gameState.screen !== "adventure" || !els.floorSkipSelect) return;

  const maxFloor = Math.max(1, Number(gameState.bossFloor || 4));
  const targetFloor = Math.max(1, Math.min(maxFloor, Number(els.floorSkipSelect.value || 1)));
  if (!targetFloor || targetFloor === gameState.floorLevel) {
    closeOptionsModal();
    return;
  }

  closeOptionsModal();
  closeSoundModal();
  closeEventModal();
  closeShopModal?.();
  closeInventoryModal?.();
  closeInventoryConfirmModal?.();
  closeChestRewardModal?.();
  closePhoenixFeatherModal?.();
  clearQuestionIfAvailable?.();
  clearBattleTimer?.();
  resetChestLockState?.();
  hideBattleOverlay?.();

  gameState.pendingInteraction = null;
  gameState.currentBattle = null;
  gameState.battleOpen = false;
  gameState.eventOpen = false;
  gameState.floorLevel = targetFloor;
  gameState.partyEntrance = "start";
  gameState.partyTransition = null;

  initializeFloorState?.(targetFloor);
  AudioManager.playDungeonBGM?.(targetFloor);
  await playFloorTransitionVignette?.(targetFloor);
  renderAdventureUI();
}

async function handleDevVignettePlay() {
  const selectedVignette = els.vignetteDevSelect?.value || "intro";
  const currentFloor = Math.max(1, Number(gameState.floorLevel || 1));

  closeOptionsModal();
  closeSoundModal();
  gameState.devSuppressRestartPrompt = true;

  try {
    if (selectedVignette === "intro") {
      await playIntroVignette?.();
      return;
    }

    if (selectedVignette === "floor") {
      await playFloorTransitionVignette?.(currentFloor);
      return;
    }

    if (selectedVignette === "victory") {
      await playVictoryEnding?.();
      return;
    }

    if (selectedVignette === "defeat") {
      await playDefeatEnding?.();
    }
  } finally {
    gameState.devSuppressRestartPrompt = false;
  }
}

function openSoundModal() {
  syncSoundModalButtons();
  els.soundModal?.classList.remove("hidden");
}

function closeSoundModal() {
  els.soundModal?.classList.add("hidden");
}

function syncSoundModalButtons() {
  if (els.toggleMusicBtn) {
    const musicPercent = Math.round((AudioManager.getMusicVolume?.() ?? 1) * 100);
    els.toggleMusicBtn.textContent = `Music: ${AudioManager.isMusicEnabled() ? `On (${musicPercent}%)` : "Off"}`;
  }

  if (els.toggleSfxBtn) {
    const sfxPercent = Math.round((AudioManager.getSfxVolume?.() ?? 1) * 100);
    els.toggleSfxBtn.textContent = `SFX: ${AudioManager.isSfxEnabled() ? `On (${sfxPercent}%)` : "Off"}`;
  }
}

function returnToMainMenu() {
  closeOptionsModal();
  closeSoundModal();
  closeInventoryModal?.();
  closeInventoryConfirmModal?.();
  closePhoenixFeatherModal?.();
  closeChestRewardModal?.();
  closeShopModal?.();
  closeBattleModal?.();
  hideBattleOverlay?.();
  clearQuestionIfAvailable();
  gameState.pendingInteraction = null;
  gameState.currentBattle = null;
  AudioManager.stopDungeonBGM?.();
  if (AudioManager.isMusicEnabled()) {
    AudioManager.playMusic("mainTheme");
  }
  setScreen("setup");
}

function restartToCharacterSelect() {
  gameState.selectedCharacters = gameState.players.length
    ? gameState.players.map((player) => player.id)
    : gameState.selectedCharacters;
  closeOptionsModal();
  closeSoundModal();
  closeInventoryModal?.();
  closeInventoryConfirmModal?.();
  closePhoenixFeatherModal?.();
  closeChestRewardModal?.();
  closeShopModal?.();
  closeBattleModal?.();
  clearQuestionIfAvailable();
  gameState.pendingInteraction = null;
  gameState.currentBattle = null;
  AudioManager.stopDungeonBGM?.();
  if (AudioManager.isMusicEnabled()) {
    AudioManager.playMusic("mainTheme");
  }
  renderCharacterChoices();
  renderSelectedParty();
  setScreen("characterSelect");
}

function toggleMusicSetting() {
  const nextValue = !AudioManager.isMusicEnabled();
  AudioManager.setMusicEnabled(nextValue);
  if (nextValue) {
    if (gameState.screen === "adventure") {
      if (gameState.currentBattle) {
        AudioManager.playBattleMusic?.();
      } else {
        AudioManager.playDungeonBGM?.(gameState.floorLevel);
      }
    } else {
      AudioManager.playMusic("mainTheme");
    }
  }
  syncSoundModalButtons();
}

function toggleSfxSetting() {
  AudioManager.setSfxEnabled(!AudioManager.isSfxEnabled());
  syncSoundModalButtons();
}

function openEventModal(message) {
  gameState.eventOpen = true;

  const paragraph = els.eventModal?.querySelector("p");
  if (paragraph) {
    paragraph.textContent = message;
  }

  els.eventModal?.classList.remove("hidden");
}

function openEventModalAsync(message) {
  return new Promise((resolve) => {
    openEventModal(message);
    const checkClose = setInterval(() => {
      if (!gameState.eventOpen) {
        clearInterval(checkClose);
        resolve();
      }
    }, 50);
  });
}

function closeEventModal() {
  gameState.eventOpen = false;
  els.eventModal?.classList.add("hidden");
}

function showGameEnding(victory = false) {
  const modal = document.getElementById("gameEndModal");
  const titleEl = document.getElementById("gameEndTitle");
  const msgEl = document.getElementById("gameEndMessage");

  if (!modal || !titleEl || !msgEl) return;

  if (victory) {
    titleEl.textContent = "Victory!";
    msgEl.textContent = "Your party has conquered the castle!";
  } else {
    titleEl.textContent = "Game Over";
    msgEl.textContent = "Your party was defeated...";
  }

  modal.classList.remove("hidden");

  const restartBtn = document.getElementById("restartGameBtn");
  restartBtn.onclick = () => {
    modal.classList.add("hidden");
    resetGame();
  };
}

async function checkEndConditions() {
  if (gameEndingInProgress) return true;

  const allDead = gameState.players.every((player) => player.hp <= 0);
  const bossDefeated = gameState.floorLevel >= gameState.bossFloor && !gameState.room?.monster;

  if (!allDead && !bossDefeated) return false;

  gameEndingInProgress = true;

  try {
    if (allDead) {
      await playDefeatEnding();
    } else if (bossDefeated) {
      await playVictoryEnding();
    }
  } finally {
    // Prevent duplicate end-state triggers until reset.
  }

  return true;
}

function handleSoundToggle() {
  openSoundModal();
}

function setupQuestionSystemDefaults() {
  if (typeof configureQuestionSystem !== "function") return;

  const defaultSources = typeof getDefaultSelectedSources === "function"
    ? getDefaultSelectedSources()
    : [];
  const firstSource = defaultSources[0] || null;

  configureQuestionSystem({
    mode: "auto",
    selectedUnit: firstSource?.unitKey || null,
    selectedChapter: firstSource?.chapterKey || null,
    selectedSources: defaultSources,
    contentScope: "chapter",
    allowQuestionTypes: {
      zhToEn: true,
      enToZh: true,
      cloze: true,
      image: true,
    },
  });
}

function getQuestionIfAvailable() {
  if (typeof getCurrentQuestion !== "function") return null;
  return getCurrentQuestion();
}

function getQuestionContextIfAvailable() {
  if (typeof getCurrentQuestionContext !== "function") return null;
  return getCurrentQuestionContext();
}

function clearQuestionIfAvailable() {
  if (typeof clearCurrentQuestion === "function") {
    clearCurrentQuestion();
  }
}

function resetGame() {
  gameState.screen = "splash";
  gameState.partySize = 4;
  gameState.selectedCharacters = [];
  gameState.players = [];
  gameState.activePlayerIndex = 0;
  gameState.partyKeys = {};
  gameState.pendingInteraction = null;
  gameState.currentFloor = null;
  gameState.room = {
    areaTitle: "Castle Entrance",
    monster: { name: "Slime", hp: 3, maxHp: 3, icon: "monster", rewardGold: 24 },
    hasChest: true,
    hasShop: false,
    hasBossStairs: false,
    exits: { north: null, south: null, east: null, west: null },
  };
  gameState.battleOpen = false;
  gameState.eventOpen = false;
  gameState.currentBattle = null;
  resetChestLockState?.();
  gameState.partyEntrance = "start";
  gameState.partyTransition = null;
  gameState.floorLevel = 1;
  invalidateShopStock?.();
  gameEndingInProgress = false;

  els.partySizeButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.textContent.trim()) === gameState.partySize);
  });

  clearQuestionIfAvailable();
  closeBattleModal?.();
  hideBattleOverlay?.();
  closeEventModal();
  closeShopModal?.();
  closeInventoryModal?.();
  closeInventoryConfirmModal?.();
  closePhoenixFeatherModal?.();
  closeChestRewardModal?.();
  closeOptionsModal?.();
  closeSoundModal?.();
  setupQuestionSystemDefaults();
  renderAll();
  setScreen("splash");
}

function renderAll() {
  renderSetupPlanner();
  renderCharacterChoices();
  renderSelectedParty();
  renderAdventureUI();
  setScreen(gameState.screen);
}





























