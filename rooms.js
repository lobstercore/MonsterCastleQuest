/* =========================
   Dungeon Crawler Lite
   rooms.js
   Room generation + movement + floor progress
   ========================= */

const floorDirectionOffsets = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

const floorAreaTitles = [
  "Northern Hall",
  "Southern Hall",
  "West Passage",
  "East Chamber",
  "Torch Gallery",
  "Stone Crossing",
  "Shadow Corridor",
  "Ancient Vestibule",
  "Whispering Hall",
  "Guarded Annex",
];

const monsterAnchorPresets = {
  center: { left: "50%", top: "38%" },
  chest: { left: "39%", top: "47%" },
  north: { left: "50%", top: "24%" },
  south: { left: "50%", top: "58%" },
  east: { left: "74%", top: "47%" },
  west: { left: "26%", top: "47%" },
};

const roomDetritusAssets = [
  "detritus_1.png",
  "detritus_2.png",
  "detritus_3.png",
  "detritus_4.png",
  "detritus_5.png",
  "detritus_6.png",
];

const roomDetritusZones = [
  { leftMin: 14, leftMax: 26, topMin: 22, topMax: 34 },
  { leftMin: 26, leftMax: 38, topMin: 56, topMax: 74 },
  { leftMin: 34, leftMax: 46, topMin: 22, topMax: 34 },
  { leftMin: 54, leftMax: 66, topMin: 22, topMax: 34 },
  { leftMin: 62, leftMax: 74, topMin: 56, topMax: 74 },
  { leftMin: 74, leftMax: 86, topMin: 22, topMax: 34 },
  { leftMin: 14, leftMax: 26, topMin: 56, topMax: 74 },
  { leftMin: 74, leftMax: 86, topMin: 56, topMax: 74 },
];

function shuffleArray(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function sampleRoomIds(roomIds, count, excludedRoomIds = []) {
  const excluded = new Set(excludedRoomIds);
  return shuffleArray(roomIds.filter((roomId) => !excluded.has(roomId))).slice(0, count);
}

function getExitCount(exits) {
  return Object.values(exits || {}).filter(Boolean).length;
}

function generateMonster() {
  const key = `level_${gameState.floorLevel}`;
  const pool = monstersByLevel[key] || monstersByLevel.level_1;

  const base = pool[Math.floor(Math.random() * pool.length)];
  return { ...base };
}

function createEmptyExits() {
  return {
    north: null,
    south: null,
    east: null,
    west: null,
  };
}

function createExit(roomId, options = {}) {
  if (!roomId) return null;

  return {
    roomId,
    locked: Boolean(options.locked),
    keyId: options.keyId || "key_gold",
  };
}

function normalizeExit(exitValue) {
  if (!exitValue) return null;
  if (typeof exitValue === "string") {
    return createExit(exitValue);
  }

  if (!exitValue.roomId) return null;
  return createExit(exitValue.roomId, exitValue);
}

function getCoordinateKey(x, y) {
  return `${x},${y}`;
}

function generateFloorCoordinates(roomCount = 6) {
  const coordinates = [{ x: 0, y: 0 }];
  const occupied = new Set([getCoordinateKey(0, 0)]);

  while (coordinates.length < roomCount) {
    const frontier = new Map();

    coordinates.forEach((coord) => {
      Object.values(floorDirectionOffsets).forEach((offset) => {
        const nextX = coord.x + offset.x;
        const nextY = coord.y + offset.y;
        const key = getCoordinateKey(nextX, nextY);

        if (!occupied.has(key)) {
          frontier.set(key, { x: nextX, y: nextY });
        }
      });
    });

    const frontierOptions = Array.from(frontier.values());
    const nextCoordinate = frontierOptions[Math.floor(Math.random() * frontierOptions.length)];
    const nextKey = getCoordinateKey(nextCoordinate.x, nextCoordinate.y);

    coordinates.push(nextCoordinate);
    occupied.add(nextKey);
  }

  return coordinates;
}

function buildRoomExits(coordinate, coordinateMap) {
  const exits = createEmptyExits();

  Object.entries(floorDirectionOffsets).forEach(([direction, offset]) => {
    const neighborId = coordinateMap.get(getCoordinateKey(coordinate.x + offset.x, coordinate.y + offset.y)) || null;
    exits[direction] = createExit(neighborId);
  });

  return exits;
}

function getStartRoomBlockedEntrance(floorLevel = gameState.floorLevel || 1) {
  if (floorLevel === 1) {
    return {
      direction: "south",
      image: "gate_sealed.png",
      alt: "Sealed front gate",
      message: "The front gate is magically sealed, we cannot get out this way until the boss is defeated.",
    };
  }

  if (floorLevel < (gameState.bossFloor || 4)) {
    return {
      direction: "south",
      image: "stairs_locked.png",
      alt: "Barred stairs",
      message: "The way up is barred, there is no going back now!",
    };
  }

  return null;
}

function createPersistentRoom({ id, areaTitle, coordinate, exits, visited = false, discovered = false }) {
  return {
    id,
    areaTitle,
    coordinate,
    exits,
    monster: null,
    monsterBehavior: null,
    monsterGuardTarget: null,
    monsterEntryResolved: false,
    monsterPosition: { ...monsterAnchorPresets.center },
    hasChest: false,
    hasShop: false,
    hasBossStairs: false,
    isSpecialRoom: false,
    blockedEntrance: null,
    detritus: [],
    visited,
    discovered,
  };
}

function getRoomDetritusCount(room) {
  if (!room) return 0;
  if (room.monster?.isBoss) return 0;
  if (room.isSpecialRoom) return 1 + Math.floor(Math.random() * 2);
  if (room.areaTitle === "Castle Entrance") return 1 + Math.floor(Math.random() * 2);
  return 2 + Math.floor(Math.random() * 3);
}

function getRoomDetritusBlockedZones(room) {
  const blockedZones = [
    { leftMin: 42, leftMax: 58, topMin: 28, topMax: 52 },
  ];

  if (room?.hasChest) {
    blockedZones.push({ leftMin: 25, leftMax: 42, topMin: 40, topMax: 58 });
  }

  if (room?.hasShop) {
    blockedZones.push({ leftMin: 62, leftMax: 80, topMin: 34, topMax: 56 });
  }

  if (room?.hasBossStairs) {
    blockedZones.push({ leftMin: 42, leftMax: 58, topMin: 38, topMax: 62 });
  }

  if (room?.blockedEntrance?.direction === "south") {
    blockedZones.push({ leftMin: 42, leftMax: 58, topMin: 74, topMax: 96 });
  }

  return blockedZones;
}

function doDetritusZonesOverlap(a, b) {
  return !(
    a.leftMax <= b.leftMin ||
    a.leftMin >= b.leftMax ||
    a.topMax <= b.topMin ||
    a.topMin >= b.topMax
  );
}

function createRoomDetritusLayout(room) {
  if (!room || room.monster?.isBoss) return [];

  const blockedZones = getRoomDetritusBlockedZones(room);
  const desiredCount = getRoomDetritusCount(room);
  const usedZones = [];
  const placements = [];
  const shuffledZones = shuffleArray(roomDetritusZones);

  shuffledZones.forEach((zone) => {
    if (placements.length >= desiredCount) return;
    if (usedZones.some((usedZone) => doDetritusZonesOverlap(zone, usedZone))) return;
    if (blockedZones.some((blockedZone) => doDetritusZonesOverlap(zone, blockedZone))) return;

    const left = zone.leftMin + Math.random() * Math.max(1, zone.leftMax - zone.leftMin);
    const top = zone.topMin + Math.random() * Math.max(1, zone.topMax - zone.topMin);
    const width = 52 + Math.round(Math.random() * 34);
    const rotation = -18 + Math.round(Math.random() * 36);
    const opacity = 0.8 + (Math.random() * 0.2);

    placements.push({
      asset: roomDetritusAssets[Math.floor(Math.random() * roomDetritusAssets.length)],
      left: `${left.toFixed(1)}%`,
      top: `${top.toFixed(1)}%`,
      width,
      rotation,
      opacity: Number(opacity.toFixed(2)),
    });
    usedZones.push(zone);
  });

  return placements;
}

function populateFloorDetritus(floor) {
  if (!floor?.rooms) return;

  Object.values(floor.rooms).forEach((room) => {
    room.detritus = createRoomDetritusLayout(room);
  });
}

function generateFloorLayout(floorLevel = gameState.floorLevel || 1) {
  const roomCount = 6;
  const titlePool = shuffleArray(floorAreaTitles);
  const reservedBlockedEntrance = getStartRoomBlockedEntrance(floorLevel);
  let coordinateEntries = [];
  let coordinateMap = new Map();

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const coordinates = generateFloorCoordinates(roomCount);
    coordinateEntries = coordinates.map((coordinate, index) => ({
      id: `room_${index}`,
      coordinate,
    }));
    coordinateMap = new Map(
      coordinateEntries.map(({ id, coordinate }) => [getCoordinateKey(coordinate.x, coordinate.y), id])
    );

    if (!reservedBlockedEntrance || !coordinateMap.has(getCoordinateKey(0, 1))) {
      break;
    }
  }

  const rooms = {};

  coordinateEntries.forEach(({ id, coordinate }, index) => {
    rooms[id] = createPersistentRoom({
      id,
      areaTitle: index === 0 ? "Castle Entrance" : (titlePool[index - 1] || `Floor ${floorLevel} Room ${index}`),
      coordinate,
      exits: buildRoomExits(coordinate, coordinateMap),
      visited: index === 0,
      discovered: index === 0,
    });
  });

  const startRoomId = coordinateEntries[0].id;
  if (reservedBlockedEntrance && rooms[startRoomId]) {
    rooms[startRoomId].blockedEntrance = { ...reservedBlockedEntrance };
  }
  const nonStartRoomIds = coordinateEntries.slice(1).map(({ id }) => id);
  const leafRoomIds = nonStartRoomIds.filter((roomId) => getExitCount(rooms[roomId].exits) === 1);
  const [specialRoomId] = sampleRoomIds(leafRoomIds.length ? leafRoomIds : nonStartRoomIds, 1);
  const normalRoomIds = nonStartRoomIds.filter((roomId) => roomId !== specialRoomId);

  normalRoomIds.forEach((roomId) => {
    rooms[roomId].monster = generateMonster();
  });

  if (specialRoomId && rooms[specialRoomId]) {
    rooms[specialRoomId].areaTitle = "Sealed Treasury";
    rooms[specialRoomId].monster = null;
    rooms[specialRoomId].hasChest = false;
    rooms[specialRoomId].hasShop = true;
    rooms[specialRoomId].hasBossStairs = true;
    rooms[specialRoomId].isSpecialRoom = true;

    Object.entries(rooms[specialRoomId].exits).forEach(([direction, exitConfig]) => {
      const normalizedExit = normalizeExit(exitConfig);
      if (!normalizedExit?.roomId) return;

      setRoomExit(rooms[specialRoomId], direction, {
        roomId: normalizedExit.roomId,
        locked: true,
        keyId: "key_gold",
      });

      const connectedRoom = rooms[normalizedExit.roomId];
      if (connectedRoom) {
        setRoomExit(connectedRoom, getOppositeEntrance(direction), {
          roomId: specialRoomId,
          locked: true,
          keyId: "key_gold",
        });
      }
    });
  }

  const chestRoomIds = sampleRoomIds(normalRoomIds, 2);
  chestRoomIds.forEach((roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].hasChest = true;
    }
  });

  populateFloorDetritus({ rooms });

  return {
    floorLevel,
    startRoomId,
    currentRoomId: startRoomId,
    shopStock: null,
    specialRoomId,
    rooms,
  };
}

function createBossFloorLayout(floorLevel = gameState.floorLevel || 1) {
  const bossRoom = {
    ...generateBossRoom(),
    id: "boss_room",
    exits: createEmptyExits(),
    visited: true,
    discovered: true,
  };

  return {
    floorLevel,
    startRoomId: bossRoom.id,
    currentRoomId: bossRoom.id,
    shopStock: null,
    rooms: {
      [bossRoom.id]: bossRoom,
    },
  };
}

function getCurrentRoom() {
  const currentRoomId = gameState.currentFloor?.currentRoomId;
  const currentRoom = currentRoomId ? gameState.currentFloor?.rooms?.[currentRoomId] : null;
  return currentRoom || gameState.room;
}

function getMonsterAnchor(anchorKey = "center") {
  return { ...(monsterAnchorPresets[anchorKey] || monsterAnchorPresets.center) };
}

function setRoomMonsterPosition(room, anchorKey = "center") {
  if (!room) return;
  room.monsterPosition = getMonsterAnchor(anchorKey);
}

function chooseDefensiveGuardTarget(room) {
  if (!room) return null;

  if (room.hasChest) {
    return {
      type: "chest",
      label: "chest",
      anchorKey: "chest",
    };
  }

  const availableDirections = Object.entries(room.exits || {})
    .filter(([, exitConfig]) => normalizeExit(exitConfig)?.roomId)
    .map(([direction]) => direction);

  if (!availableDirections.length) {
    return {
      type: "door",
      direction: "north",
      label: "door",
      anchorKey: "north",
    };
  }

  const direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
  return {
    type: "door",
    direction,
    label: `${direction} door`,
    anchorKey: direction,
  };
}

function resolveRoomMonsterBehavior(room) {
  if (!room?.monster) return null;
  if (room.monsterBehavior) return room.monsterBehavior;

  const roll = Math.random();
  const behavior = roll < 0.1 ? "sleeping" : roll < 0.4 ? "aggressive" : "defensive";

  room.monsterBehavior = behavior;
  room.monsterGuardTarget = null;
  setRoomMonsterPosition(room, "center");

  if (behavior === "defensive") {
    room.monsterGuardTarget = chooseDefensiveGuardTarget(room);
  }

  return behavior;
}

function applyMonsterPosition(room) {
  if (!els.monsterButton || !room?.monster) return;
  const position = room.monsterPosition || getMonsterAnchor("center");
  els.monsterButton.style.left = position.left;
  els.monsterButton.style.top = position.top;
}

async function animateMonsterToAnchor(room, anchorKey) {
  if (!room?.monster) return;
  setRoomMonsterPosition(room, anchorKey);
  renderRoomObjects();
  await wait(420);
}

async function animateMonsterToParty(room) {
  if (!room?.monster) return;

  const entranceKey = gameState.partyEntrance || "start";
  const partyPoints = partyAnchors?.[entranceKey] || partyAnchors?.start || [];
  const anchor = partyPoints.length
    ? {
        left: `${partyPoints.reduce((sum, point) => sum + parseFloat(point.left), 0) / partyPoints.length}%`,
        top: `${partyPoints.reduce((sum, point) => sum + parseFloat(point.top), 0) / partyPoints.length - 4}%`,
      }
    : getMonsterAnchor("center");

  room.monsterPosition = anchor;
  renderRoomObjects();
  await wait(420);
}

function getGuardedTarget(room, targetType, direction = null) {
  if (!room?.monster || room.monsterBehavior !== "defensive" || !room.monsterGuardTarget) return null;

  if (targetType === "chest" && room.monsterGuardTarget.type === "chest") {
    return room.monsterGuardTarget;
  }

  if (
    targetType === "door" &&
    room.monsterGuardTarget.type === "door" &&
    room.monsterGuardTarget.direction === direction
  ) {
    return room.monsterGuardTarget;
  }

  return null;
}

async function maybeTriggerGuardedEncounter(targetType, direction = null) {
  const room = getCurrentRoom();
  const guardedTarget = getGuardedTarget(room, targetType, direction);
  if (!guardedTarget) return false;

  await openEventModalAsync?.(
    `The ${room.monster.name} lunges to defend the ${guardedTarget.label}!`
  );
  startBattleEncounter?.();
  return true;
}

async function handleRoomEntryMonsterBehavior() {
  const room = getCurrentRoom();
  if (!room?.monster || room.monster.isBoss || room.monsterEntryResolved) return false;

  room.monsterEntryResolved = true;
  const behavior = resolveRoomMonsterBehavior(room);
  renderRoomObjects();

  if (behavior === "sleeping") {
    AudioManager.playSFX("snore");
    await openEventModalAsync?.(
      `The heroes find a ${room.monster.name} in this room, but it is asleep!`
    );
    return true;
  }

  if (behavior === "aggressive") {
    await openEventModalAsync?.(
      `The heroes find a ${room.monster.name} in this room. It is aggressive and attacks!`
    );
    await animateMonsterToParty(room);
    startBattleEncounter?.();
    return true;
  }

  const guardedTarget = room.monsterGuardTarget || chooseDefensiveGuardTarget(room);
  room.monsterGuardTarget = guardedTarget;
  if (guardedTarget?.anchorKey) {
    await animateMonsterToAnchor(room, guardedTarget.anchorKey);
  }

  await openEventModalAsync?.(
    `The heroes find a ${room.monster.name} lurking in the room. It is guarding the ${guardedTarget?.label || "door"}.`
  );
  return true;
}

function getRoomExit(room, direction) {
  const exitValue = room?.exits?.[direction];
  return normalizeExit(exitValue);
}

function setRoomExit(room, direction, nextValue) {
  if (!room?.exits || !direction) return null;
  room.exits[direction] = nextValue ? createExit(nextValue.roomId, nextValue) : null;
  return room.exits[direction];
}

function unlockRoomExit(room, direction) {
  const exitConfig = getRoomExit(room, direction);
  if (!room || !exitConfig) return null;

  const unlockedExit = { ...exitConfig, locked: false };
  setRoomExit(room, direction, unlockedExit);
  return unlockedExit;
}

function unlockConnectedExit(room, direction) {
  const exitConfig = getRoomExit(room, direction);
  if (!room || !exitConfig) return null;

  unlockRoomExit(room, direction);

  const destinationRoom = gameState.currentFloor?.rooms?.[exitConfig.roomId];
  const oppositeDirection = getOppositeEntrance(direction);
  if (destinationRoom) {
    unlockRoomExit(destinationRoom, oppositeDirection);
  }

  return getRoomExit(room, direction);
}

function setCurrentRoom(roomId) {
  if (!roomId || !gameState.currentFloor?.rooms?.[roomId]) return null;

  gameState.currentFloor.currentRoomId = roomId;
  const room = gameState.currentFloor.rooms[roomId];
  room.visited = true;
  room.discovered = true;
  gameState.room = room;
  return room;
}

function revealFloorSpecialRoomsIfReady() {
  return { shopRevealed: false, stairsRevealed: false };
}

function floorSpecialRoomNeedsKey() {
  const specialRoom = gameState.currentFloor?.specialRoomId
    ? gameState.currentFloor?.rooms?.[gameState.currentFloor.specialRoomId]
    : null;
  if (!specialRoom) return false;

  return Object.values(specialRoom.exits || {}).some((exitConfig) => normalizeExit(exitConfig)?.locked);
}

function tryAwardGoldKeyForClearedFloor() {
  if (!gameState.currentFloor?.specialRoomId) return false;
  if ((gameState.levelStats?.monstersDefeated || 0) < (gameState.levelStats?.monstersTotal || 0)) return false;
  if (!floorSpecialRoomNeedsKey()) return false;
  if (hasPartyKey?.("key_gold")) return false;
  if (!itemData?.key_gold) return false;

  addPartyKey?.("key_gold", 1);
  return true;
}

function initializeFloorState(floorLevel = gameState.floorLevel || 1) {
  const floor = floorLevel >= gameState.bossFloor
    ? createBossFloorLayout(floorLevel)
    : generateFloorLayout(floorLevel);

  gameState.currentFloor = floor;
  initLevelStats(Object.values(floor.rooms));
  revealFloorSpecialRoomsIfReady();
  setCurrentRoom(floor.currentRoomId || floor.startRoomId);
  invalidateShopStock?.();
  return floor;
}

function generateBossRoom() {
  return {
    areaTitle: "Boss Chamber",
    monster: {
      id: "gradefivicus",
      name: "Gradefivicus, Two-Headed Dragon Lord",
      hp: 25,
      maxHp: 25,
      rewardGold: 200,
      isBoss: true,
    },
    hasChest: false,
    hasShop: false,
    hasBossStairs: false,
    containsShop: false,
    containsBossStairs: false,
    detritus: [],
    exits: createEmptyExits(),
  };
}

function renderRoomDetritus() {
  if (!els.roomDetritusLayer) return;

  const room = getCurrentRoom();
  const detritus = Array.isArray(room?.detritus) ? room.detritus : [];

  if (!detritus.length) {
    els.roomDetritusLayer.innerHTML = "";
    return;
  }

  els.roomDetritusLayer.innerHTML = detritus.map((piece, index) => `
    <img
      class="room-detritus-piece"
      src="./img/objects/${piece.asset}"
      alt=""
      loading="lazy"
      decoding="async"
      style="
        left: ${piece.left};
        top: ${piece.top};
        width: ${piece.width}px;
        opacity: ${piece.opacity};
        transform: translate(-50%, -50%) rotate(${piece.rotation}deg);
      "
      data-detritus-index="${index}"
    />
  `).join("");
}

function renderRoomObjects() {
  const room = getCurrentRoom();
  if (!room) return;
  const monster = room.monster;
  const isBossMonster = Boolean(monster?.isBoss);
  const blockedEntrance = room.blockedEntrance;
  const northExit = getRoomExit(room, "north");
  const westExit = getRoomExit(room, "west");
  const eastExit = getRoomExit(room, "east");
  const southExit = getRoomExit(room, "south");

  setVisible(els.monsterButton, !!monster);
  setVisible(els.chestButton, room.hasChest);
  setVisible(els.shopButton, room.hasShop);
  setVisible(els.stairsButton, room.hasBossStairs);
  setVisible(els.blockedEntryButton, !!blockedEntrance);

  setVisible(els.northDoor, !!northExit?.roomId);
  setVisible(els.westDoor, !!westExit?.roomId);
  setVisible(els.eastDoor, !!eastExit?.roomId);
  setVisible(els.southDoor, !!southExit?.roomId);

  [
    { button: els.northDoor, exit: northExit },
    { button: els.westDoor, exit: westExit },
    { button: els.eastDoor, exit: eastExit },
    { button: els.southDoor, exit: southExit },
  ].forEach(({ button, exit }) => {
    if (!button) return;
    button.classList.toggle("is-locked", Boolean(exit?.locked));
    button.title = exit?.locked ? "Locked door" : "Door";
    syncDoorButtonArt?.(button);
  });

  if (els.monsterButton) {
    els.monsterButton.classList.toggle("is-boss", isBossMonster);
  }

  if (els.blockedEntryButton) {
    els.blockedEntryButton.dataset.message = blockedEntrance?.message || "";
    els.blockedEntryButton.title = blockedEntrance?.alt || "Blocked path";
  }

  if (els.blockedEntryImg) {
    els.blockedEntryImg.src = `./img/objects/${blockedEntrance?.image || "gate_sealed.png"}`;
    els.blockedEntryImg.alt = blockedEntrance?.alt || "Blocked path";
  }

  if (monster) {
    applyMonsterPosition(room);

    if (els.roomMonsterImg) {
      els.roomMonsterImg.src = `./img/monsters/${monster.id || "slime"}.png`;
      els.roomMonsterImg.alt = monster.name || "Monster";
    }

    if (els.roomMonsterLabel) {
      els.roomMonsterLabel.textContent = monster.name || "Monster";
    }

    if (els.roomMonsterHp) {
      els.roomMonsterHp.innerHTML = `
        ${getIconMarkup("heart", "Hearts", "ui-inline-icon room-hp-icon")}
        <span>${monster.hp}</span>
      `;
    }
  } else if (els.monsterButton) {
    els.monsterButton.classList.remove("is-boss");
    els.monsterButton.style.left = "";
    els.monsterButton.style.top = "";
  }
}

function disablePartyTokenTransitions() {
  els.partyTokens.forEach((token) => token.classList.add("no-transition"));
}

function enablePartyTokenTransitions() {
  els.partyTokens.forEach((token) => token.classList.remove("no-transition"));
}

function getOppositeEntrance(direction) {
  const oppositeMap = {
    north: "south",
    south: "north",
    west: "east",
    east: "west",
  };

  return oppositeMap[direction] || "start";
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleDoorClick(direction) {
  const room = getCurrentRoom();
  const exitConfig = getRoomExit(room, direction);
  if (gameState.pendingInteraction) {
    openEventModal("Finish the current question first.");
    return false;
  }
  if (!exitConfig?.roomId) {
    openEventModal("That doorway is sealed.");
    return false;
  }

  if (await maybeTriggerGuardedEncounter("door", direction)) {
    return false;
  }

  if (exitConfig.locked) {
    const keyId = exitConfig.keyId || "key_gold";
    if (!hasPartyKey?.(keyId)) {
      openEventModal("The door is locked. We need a key.");
      return false;
    }

    consumePartyKey?.(keyId, 1);
    unlockConnectedExit(room, direction);
    renderPlayerCards?.();
    renderRoomObjects();
    await openEventModalAsync?.(`The party used a Gold Key to unlock the door.`);
  }

  AudioManager.playRandomSFX(["openDoor_1", "openDoor_2", "openDoor_3", "openDoor_4"]);

  gameState.partyTransition = { mode: "exit", direction };
  renderPartyTokens();
  await wait(340);
  setCurrentRoom(exitConfig.roomId);

  gameState.partyEntrance = getOppositeEntrance(direction);
  gameState.partyTransition = { mode: "enter", direction: gameState.partyEntrance };

  disablePartyTokenTransitions();
  renderAdventureUI();
  renderBattleOverlay?.();

  requestAnimationFrame(() => {
    enablePartyTokenTransitions();
    gameState.partyTransition = null;
    renderPartyTokens();
  });

  await handleRoomEntryMonsterBehavior();
  return true;
}

const CHEST_LOCK_VISIBLE_LETTERS = 7;
const CHEST_LOCK_CENTER_SLOT_INDEX = Math.floor(CHEST_LOCK_VISIBLE_LETTERS / 2);

function startChestEncounter() {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const room = getCurrentRoom();
  if (!activePlayer || !room?.hasChest) return;

  const challenge = typeof createChestLockChallenge === "function"
    ? createChestLockChallenge()
    : null;
  if (!challenge) {
    openEventModal?.("No picture-spelling chest challenge is available for the selected content.");
    return;
  }

  gameState.pendingInteraction = "chest";
  room.hasChest = false;
  clearQuestionIfAvailable?.();
  beginChestLockEncounter(challenge);
  renderQuestionPanel();
}

function getDefaultChestLockState() {
  return {
    active: false,
    challenge: null,
    wheels: [],
    duration: 0,
    expiresAt: 0,
    timerIntervalId: null,
    animationFrameId: null,
    lastFrameAt: 0,
    spinSpeed: 0,
    penaltyMs: 0,
    failed: false,
  };
}

function resetChestLockState() {
  if (gameState.chestLock?.timerIntervalId) {
    clearInterval(gameState.chestLock.timerIntervalId);
  }
  if (gameState.chestLock?.animationFrameId) {
    cancelAnimationFrame(gameState.chestLock.animationFrameId);
  }

  gameState.chestLock = getDefaultChestLockState();

  if (els.chestLockOverlay) {
    els.chestLockOverlay.classList.add("hidden");
    els.chestLockOverlay.setAttribute("aria-hidden", "true");
  }
  if (els.chestLockWheels) {
    els.chestLockWheels.innerHTML = "";
  }
  if (els.chestLockHintImg) {
    els.chestLockHintImg.removeAttribute("src");
  }
  if (els.chestLockStatusText) {
    els.chestLockStatusText.textContent = "Press Stop while the correct letter sits inside the gold pointer band.";
  }
  if (els.chestLockTimerBar) {
    els.chestLockTimerBar.style.width = "100%";
    els.chestLockTimerBar.style.transform = "scaleX(1)";
    els.chestLockTimerBar.classList.remove("flashing");
  }
}

function beginChestLockEncounter(challenge) {
  const answer = String(challenge?.answer || "");
  const floorPenaltyMs = Math.max(0, (gameState.floorLevel - 1) * 1000);
  const baseDuration = 15000 + answer.length * 3200;
  const minDuration = 6500 + answer.length * 2200;
  const duration = Math.max(minDuration, baseDuration - floorPenaltyMs);
  const penaltyMs = Math.min(2200, 500 + answer.length * 90 + ((gameState.floorLevel - 1) * 100));

  gameState.chestLock = {
    active: true,
    challenge,
    wheels: (challenge.wheelLetters || []).map((letters) => ({
      letters: [...letters],
      currentIndex: Math.floor(Math.random() * letters.length),
      currentOffset: 0.9 + (Math.random() * 0.06),
      locked: false,
      flashState: "",
    })),
    duration,
    expiresAt: Date.now() + duration,
    timerIntervalId: null,
    animationFrameId: null,
    lastFrameAt: 0,
    spinSpeed: 0.42,
    penaltyMs,
    failed: false,
  };

  renderAdventureUI?.();
  startChestLockSpin();
  startChestLockTimer();
}

function renderChestLockOverlay() {
  const lockState = gameState.chestLock;
  if (!els.chestLockOverlay) return;

  if (!lockState?.active || !lockState.challenge) {
    els.chestLockOverlay.classList.add("hidden");
    els.chestLockOverlay.setAttribute("aria-hidden", "true");
    return;
  }

  els.chestLockOverlay.classList.remove("hidden");
  els.chestLockOverlay.setAttribute("aria-hidden", "false");

  if (els.chestLockStatusText) {
    els.chestLockStatusText.textContent = "Press Stop while the correct letter is inside the gold pointer band.";
  }

  if (els.chestLockHintImg) {
    els.chestLockHintImg.src = lockState.challenge.imagePath;
  }

  if (els.chestLockWheels) {
    els.chestLockWheels.innerHTML = lockState.wheels.map((wheel, index) => {
      const currentLetter = wheel.letters[wheel.currentIndex] || "";
      const lockedLetter = wheel.locked ? currentLetter.toUpperCase() : "_";
      const stateClass = wheel.locked
        ? "is-locked"
        : (wheel.flashState ? `is-${wheel.flashState}` : "");

      return `
        <div class="chest-lock-wheel ${stateClass}" data-chest-lock-wheel-index="${index}">
          <div class="chest-lock-letter-slot" data-chest-lock-slot="${index}">${lockedLetter}</div>
            <div class="chest-lock-spinner-window">
              <div class="chest-lock-stop-guide" aria-hidden="true"></div>
              <div class="chest-lock-reel" data-chest-lock-window="${index}">
              ${Array.from({ length: CHEST_LOCK_VISIBLE_LETTERS }, (_, letterIndex) => `
                <div class="chest-lock-reel-letter" data-chest-lock-letter-slot="${index}-${letterIndex}">${currentLetter.toUpperCase()}</div>
              `).join("")}
              </div>
            </div>
          <button
            type="button"
            class="chest-lock-stop-btn"
            data-chest-lock-stop="${index}"
            ${wheel.locked ? "disabled" : ""}
          >
            Stop
          </button>
        </div>
      `;
    }).join("");

    els.chestLockWheels.querySelectorAll("[data-chest-lock-stop]").forEach((button) => {
      button.addEventListener("click", () => {
        stopChestLockWheel(Number(button.dataset.chestLockStop));
      });
    });
  }

  syncChestLockWheelDisplays();
  updateChestLockTimerUi();
}

function startChestLockSpin() {
  const lockState = gameState.chestLock;
  if (!lockState?.active) return;

  if (lockState.animationFrameId) {
    cancelAnimationFrame(lockState.animationFrameId);
  }

  lockState.lastFrameAt = performance.now();

  const tick = (now) => {
    const state = gameState.chestLock;
    if (!state?.active) return;

    const remaining = Math.max(0, state.expiresAt - Date.now());
    updateChestLockTimerUi(remaining);
    if (remaining <= 0) {
      failChestLockEncounter();
      return;
    }

    const elapsedSeconds = Math.max(0, (now - (state.lastFrameAt || now)) / 1000);
    state.lastFrameAt = now;

    state.wheels.forEach((wheel) => {
      if (wheel.locked) return;

      wheel.currentOffset += elapsedSeconds * state.spinSpeed;
      while (wheel.currentOffset >= 1) {
        wheel.currentOffset -= 1;
        wheel.currentIndex = (wheel.currentIndex + 1) % wheel.letters.length;
      }
    });

    syncChestLockWheelDisplays();
    state.animationFrameId = requestAnimationFrame(tick);
  };

  lockState.animationFrameId = requestAnimationFrame(tick);
}

function startChestLockTimer() {
  if (gameState.chestLock?.timerIntervalId) {
    clearInterval(gameState.chestLock.timerIntervalId);
    gameState.chestLock.timerIntervalId = null;
  }

  updateChestLockTimerUi();
}

function updateChestLockTimerUi(remainingMs = null) {
  const lockState = gameState.chestLock;
  if (!lockState?.active || !els.chestLockTimerBar) return;

  const remaining = remainingMs ?? Math.max(0, lockState.expiresAt - Date.now());
  const ratio = lockState.duration > 0 ? remaining / lockState.duration : 0;
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  els.chestLockTimerBar.style.transform = `scaleX(${clampedRatio})`;
  els.chestLockTimerBar.classList.toggle("flashing", ratio <= 0.25);
}

function syncChestLockWheelDisplays() {
  const lockState = gameState.chestLock;
  if (!lockState?.active) return;

  lockState.wheels.forEach((wheel, index) => {
    const slotEl = document.querySelector(`[data-chest-lock-slot="${index}"]`);
    const reelEl = document.querySelector(`[data-chest-lock-window="${index}"]`);
    const wheelEl = document.querySelector(`[data-chest-lock-wheel-index="${index}"]`);
    const stopBtn = document.querySelector(`[data-chest-lock-stop="${index}"]`);
    const currentLetter = getChestLockWheelLetter(wheel, 0);

    if (slotEl) {
      slotEl.textContent = wheel.locked ? currentLetter.toUpperCase() : "_";
    }

    if (reelEl) {
      populateChestLockReel(index);
      syncChestLockActiveCandidate(index);
    }

    if (stopBtn) {
      stopBtn.disabled = wheel.locked;
    }

    if (wheelEl) {
      wheelEl.classList.toggle("is-locked", wheel.locked);
      wheelEl.classList.toggle("is-miss", wheel.flashState === "miss");
    }
  });
}

function getChestLockWheelLetter(wheel, offset = 0) {
  if (!wheel?.letters?.length) return "";
  const length = wheel.letters.length;
  const normalizedIndex = (wheel.currentIndex + offset + length * 10) % length;
  return wheel.letters[normalizedIndex] || "";
}

function populateChestLockReel(index) {
  const wheel = gameState.chestLock?.wheels?.[index];
  const reelEl = document.querySelector(`[data-chest-lock-window="${index}"]`);
  if (!wheel || !reelEl) return;

  const reelLetters = Array.from({ length: CHEST_LOCK_VISIBLE_LETTERS }, (_, letterIndex) => {
    const reelOffset = letterIndex - CHEST_LOCK_CENTER_SLOT_INDEX;
    return getChestLockWheelLetter(wheel, reelOffset);
  });

  reelLetters.forEach((letter, letterIndex) => {
    const letterEl = document.querySelector(`[data-chest-lock-letter-slot="${index}-${letterIndex}"]`);
    if (letterEl) {
      letterEl.textContent = letter.toUpperCase();
      letterEl.dataset.reelOffset = String(letterIndex - CHEST_LOCK_CENTER_SLOT_INDEX);
    }
  });

  const spinnerWindowEl = reelEl.parentElement;
  const firstLetterEl = reelEl.querySelector(".chest-lock-reel-letter");
  if (!spinnerWindowEl || !firstLetterEl) return;

  const slotHeight = firstLetterEl.getBoundingClientRect().height;
  const windowHeight = spinnerWindowEl.getBoundingClientRect().height;
  const centeredOffsetPx =
    (windowHeight / 2) - ((CHEST_LOCK_CENTER_SLOT_INDEX + 0.5 + wheel.currentOffset) * slotHeight);

  reelEl.style.transition = "none";
  reelEl.style.transform = `translateY(${centeredOffsetPx}px)`;
}

function getChestLockStopCandidate(index) {
  const guideEl = document.querySelector(`[data-chest-lock-wheel-index="${index}"] .chest-lock-stop-guide`);
  const letterEls = Array.from(document.querySelectorAll(`[data-chest-lock-letter-slot^="${index}-"]`));
  if (!guideEl || !letterEls.length) return null;

  const guideRect = guideEl.getBoundingClientRect();
  const guideTop = guideRect.top + 2;
  const guideBottom = guideRect.bottom - 2;
  const guideCenter = (guideTop + guideBottom) / 2;

  const overlapping = letterEls
    .map((letterEl) => {
      const rect = letterEl.getBoundingClientRect();
      const overlap = Math.max(0, Math.min(rect.bottom, guideBottom) - Math.max(rect.top, guideTop));
      const centerDistance = Math.abs(((rect.top + rect.bottom) / 2) - guideCenter);

      return {
        letterEl,
        overlap,
        centerDistance,
        reelOffset: Number(letterEl.dataset.reelOffset || 0),
      };
    })
    .filter((entry) => entry.overlap > 0);

  if (!overlapping.length) {
    return null;
  }

  overlapping.sort((a, b) => {
    if (b.overlap !== a.overlap) return b.overlap - a.overlap;
    return a.centerDistance - b.centerDistance;
  });

  return overlapping[0];
}

function syncChestLockActiveCandidate(index) {
  const letterEls = Array.from(document.querySelectorAll(`[data-chest-lock-letter-slot^="${index}-"]`));
  letterEls.forEach((letterEl) => {
    letterEl.classList.remove("is-lock-target");
  });

  const candidate = getChestLockStopCandidate(index);
  if (candidate?.letterEl) {
    candidate.letterEl.classList.add("is-lock-target");
  }

  const wheelEl = document.querySelector(`[data-chest-lock-wheel-index="${index}"]`);
  if (wheelEl) {
    wheelEl.classList.toggle("has-lock-target", Boolean(candidate?.letterEl));
  }
}

function stopChestLockWheel(index) {
  const lockState = gameState.chestLock;
  if (!lockState?.active) return;

  const wheel = lockState.wheels[index];
  const answerLetter = lockState.challenge?.answer?.[index];
  if (!wheel || wheel.locked || !answerLetter) return;

  const stopCandidate = getChestLockStopCandidate(index);
  if (stopCandidate) {
    const length = wheel.letters.length;
    wheel.currentIndex = (wheel.currentIndex + stopCandidate.reelOffset + length * 10) % length;
  }
  wheel.currentOffset = 0;
  syncChestLockWheelDisplays();

  const currentLetter = getChestLockWheelLetter(wheel, 0);
  if (currentLetter === answerLetter) {
    wheel.locked = true;
    wheel.flashState = "";
    AudioManager.playSFX("correct");
    if (els.chestLockStatusText) {
      els.chestLockStatusText.textContent = `Locked in ${currentLetter.toUpperCase()}.`;
    }
    syncChestLockWheelDisplays();

    if (lockState.wheels.every((entry) => entry.locked)) {
      completeChestLockEncounter();
    }
    return;
  }

  wheel.flashState = "miss";
  if (els.chestLockStatusText) {
    els.chestLockStatusText.textContent = `${currentLetter.toUpperCase()} missed. Time penalty!`;
  }
  AudioManager.playRandomSFX(["no_male_1", "no_female_1"]);
  lockState.expiresAt = Math.max(Date.now() + 150, lockState.expiresAt - lockState.penaltyMs);
  syncChestLockWheelDisplays();
  updateChestLockTimerUi();

  setTimeout(() => {
    if (gameState.chestLock?.wheels?.[index]) {
      gameState.chestLock.wheels[index].flashState = "";
      syncChestLockWheelDisplays();
    }
  }, 260);
}

function completeChestLockEncounter() {
  if (els.chestLockStatusText) {
    els.chestLockStatusText.textContent = "The lock clicks open!";
  }
  resetChestLockState();
  renderAdventureUI?.();
  resolveChestQuestion(true);
}

function failChestLockEncounter() {
  if (!gameState.chestLock?.active || gameState.chestLock.failed) return;
  gameState.chestLock.failed = true;
  resetChestLockState();
  renderAdventureUI?.();
  resolveChestQuestion(false);
}

async function resolveChestQuestion(isCorrect) {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  if (!activePlayer) return;

  const floorLevel = gameState.floorLevel || 1;
  const gender = activePlayer.gender || "male";

  AudioManager.playRandomSFX(["chest_1", "chest_2", "chest_3"]);

  if (isCorrect) {
    const goldPerPlayer = (5 * floorLevel) + Math.floor(Math.random() * 8);
    const totalGold = goldPerPlayer * (gameState.partySize || 4);
    const partyMembers = gameState.players.filter((player) => player);
    partyMembers.forEach((player) => {
      player.gold += goldPerPlayer;
      player.gold += rollRewardBonusGold?.(player) || 0;
    });

    const chestRewardItem = chooseChestRewardForParty?.(floorLevel);

    AudioManager.playRandomSFX([
      `yes_${gender}_1`,
      `yes_${gender}_2`,
      `yes_${gender}_3`
    ]);

    renderAdventureUI();
    renderLevelStats();

    if (chestRewardItem) {
      const chosenPlayerIndex = await openChestRewardModal?.(
        chestRewardItem,
        `${activePlayer.name} opened the chest! The party found ${totalGold} gold (${goldPerPlayer} each). Choose who gets ${chestRewardItem.name}.`
      );

      const chosenPlayer = gameState.players[chosenPlayerIndex];
      if (chosenPlayer) {
        await openEventModalAsync?.(`${chosenPlayer.name} received ${chestRewardItem.name} from the chest.`);
      }
    } else {
      await openEventModalAsync?.(
        `${activePlayer.name} opened the chest! The party found ${totalGold} gold (${goldPerPlayer} each).`
      );
    }
  } else {
    AudioManager.playRandomSFX([
      `no_${gender}_1`,
      `no_${gender}_2`,
      `no_${gender}_3`
    ]);

    await openEventModalAsync?.(`${activePlayer.name} missed the question. The chest was a dud!`);
  }

  clearQuestionIfAvailable();
  gameState.pendingInteraction = null;
  gameState.levelStats.chestsOpened++;
  renderAdventureUI();
  renderLevelStats();
  nextPlayerTurn();
}

function setVisible(element, isVisible) {
  if (!element) return;
  element.classList.toggle("hidden", !isVisible);
}

function initLevelStats(levelRooms) {
  let monsters = 0;
  let chests = 0;

  levelRooms.forEach(room => {
    if (room.monster) monsters++;
    if (room.hasChest) chests++;
  });

  gameState.levelStats = {
    monstersTotal: monsters,
    monstersDefeated: 0,
    chestsTotal: chests,
    chestsOpened: 0,
  };
}

function renderLevelStats() {
  const levelStats = gameState.levelStats || {
    monstersTotal: 0,
    monstersDefeated: 0,
    chestsTotal: 0,
    chestsOpened: 0,
  };
  const { monstersTotal, monstersDefeated, chestsTotal, chestsOpened } = levelStats;
  const monstersRemaining = Math.max(0, monstersTotal - monstersDefeated);
  const chestsRemaining = Math.max(0, chestsTotal - chestsOpened);

  const monstersEl = document.getElementById("monstersRemaining");
  const chestsEl = document.getElementById("chestsRemaining");
  const monsterStatEl = document.getElementById("monsterStat");
  const chestStatEl = document.getElementById("chestStat");

  if (monstersEl) {
    monstersEl.textContent = String(monstersRemaining);
  }

  if (chestsEl) {
    chestsEl.textContent = String(chestsRemaining);
  }

  if (monsterStatEl) {
    monsterStatEl.classList.toggle("is-alert", monstersRemaining > 0);
    monsterStatEl.classList.toggle("is-safe", monstersRemaining === 0);
    monsterStatEl.setAttribute("title", `${monstersRemaining} monster${monstersRemaining === 1 ? "" : "s"} remaining`);
  }

  if (chestStatEl) {
    chestStatEl.classList.toggle("is-active", chestsRemaining > 0);
    chestStatEl.classList.toggle("is-inactive", chestsRemaining === 0);
    chestStatEl.setAttribute("title", `${chestsRemaining} treasure chest${chestsRemaining === 1 ? "" : "s"} remaining`);
  }
}

async function enterStairs() {
  if (gameState.pendingInteraction) {
    openEventModal("Finish the current question first.");
    return;
  }

  AudioManager.stopDungeonBGM();
  gameState.floorLevel += 1;
  initializeFloorState(gameState.floorLevel);

  AudioManager.playDungeonBGM(gameState.floorLevel);
  await playFloorTransitionVignette(gameState.floorLevel);

  gameState.partyEntrance = "south";
  gameState.partyTransition = {
    mode: "enter",
    direction: "south",
  };

  disablePartyTokenTransitions();
  renderAdventureUI();
  renderLevelStats();
  requestAnimationFrame(() => {
    enablePartyTokenTransitions();
    gameState.partyTransition = null;
    renderPartyTokens();
  });

  await handleRoomEntryMonsterBehavior();
}
