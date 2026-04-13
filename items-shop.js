/* =========================
   Dungeon Crawler Lite
   items-shop.js
   Item definitions + shop flow
   ========================= */

const itemData = {
  potion_small: {
    id: "potion_small",
    name: "Small Healing Potion",
    cost: 10,
    description: "Heal 1 heart",
    itemType: "general",
    usable: true,
  },
  potion_medium: {
    id: "potion_medium",
    name: "Healing Potion",
    cost: 20,
    description: "Heal 2 hearts",
    itemType: "general",
    usable: true,
  },
  potion_big: {
    id: "potion_big",
    name: "Large Healing Potion",
    cost: 30,
    description: "Fully heal one hero",
    itemType: "general",
    usable: true,
  },
  phoenix_feather: {
    id: "phoenix_feather",
    name: "Phoenix Feather",
    cost: 15,
    description: "Revive one fallen ally with 1 heart",
    itemType: "general",
    usable: true,
  },
  key_gold: {
    id: "key_gold",
    name: "Gold Key",
    cost: 0,
    description: "Automatically unlocks one locked door",
    itemType: "general",
    usable: false,
  },
  bomb: {
    id: "bomb",
    name: "Bomb",
    cost: 30,
    description: "Deal 2 damage",
    itemType: "general",
    usable: true,
  },
  shield: {
    id: "shield",
    name: "Shield",
    cost: 25,
    description: "Block 1 wrong answer per battle.",
    itemType: "shield",
    usable: false,
  },
  helmet: {
    id: "helmet",
    name: "Helmet",
    cost: 20,
    description: "Gain +1 shield charge each battle",
    itemType: "helmet",
    usable: false,
  },
  magicSword: {
    id: "magicSword",
    name: "Magic Sword",
    cost: 50,
    description: "Deal 1 extra damage in battles",
    itemType: "weapon",
    usable: false,
  },
  armor: {
    id: "armor",
    name: "Armor",
    cost: 40,
    description: "Add 2 max hearts for one hero",
    itemType: "armor",
    usable: false,
  },
  time_stop_watch: {
    id: "time_stop_watch",
    name: "Time Stop Watch",
    cost: 35,
    description: "Stop the battle timer for 3 extra seconds",
    itemType: "general",
    usable: true,
  },
  hint_scroll: {
    id: "hint_scroll",
    name: "Hint Scroll",
    cost: 25,
    description: "Eliminate 2 wrong answers",
    itemType: "general",
    usable: true,
  },
  money_cat: {
    id: "money_cat",
    name: "Money Cat",
    cost: 40,
    description: "Gain +1d10 extra gold from each chest and monster reward",
    itemType: "charm",
    usable: false,
  },
  shield_charm: {
    id: "shield_charm",
    name: "Shield Charm",
    cost: 30,
    description: "Gain +1 shield charge each battle",
    itemType: "charm",
    usable: false,
  },
};

const inventoryUiState = {
  playerIndex: null,
  selectedItemIndex: null,
  tradeMode: false,
};

const chestRewardUiState = {
  item: null,
  resolve: null,
  summary: "",
};

const phoenixFeatherUiState = {
  userPlayerIndex: null,
  itemIndex: null,
  resolve: null,
};

const shopStockRules = {
  stapleStock: [
    { itemId: "potion_small", quantity: 4 },
    { itemId: "potion_medium", quantity: 2 },
    { itemId: "phoenix_feather", quantity: 3 },
  ],
  extraSlots: 4,
  floorPools: {
    1: [
      { itemId: "bomb", weight: 4, quantity: [1, 2] },
      { itemId: "shield", weight: 3, quantity: 1 },
      { itemId: "hint_scroll", weight: 3, quantity: [1, 2] },
    ],
    2: [
      { itemId: "bomb", weight: 4, quantity: [1, 2] },
      { itemId: "shield", weight: 3, quantity: 1 },
      { itemId: "hint_scroll", weight: 3, quantity: [1, 2] },
      { itemId: "potion_big", weight: 3, quantity: 1 },
      { itemId: "helmet", weight: 2, quantity: 1 },
      { itemId: "time_stop_watch", weight: 2, quantity: 1 },
    ],
    3: [
      { itemId: "bomb", weight: 4, quantity: [1, 2] },
      { itemId: "shield", weight: 3, quantity: 1 },
      { itemId: "hint_scroll", weight: 3, quantity: [1, 2] },
      { itemId: "potion_big", weight: 3, quantity: 1 },
      { itemId: "helmet", weight: 2, quantity: 1 },
      { itemId: "time_stop_watch", weight: 2, quantity: 1 },
      { itemId: "magicSword", weight: 2, quantity: 1 },
      { itemId: "armor", weight: 2, quantity: 1 },
      { itemId: "money_cat", weight: 1, quantity: 1 },
      { itemId: "shield_charm", weight: 2, quantity: 1 },
    ],
  },
};

const chestRewardRules = {
  basePotionByFloor: {
    1: "potion_small",
    2: "potion_medium",
    3: "potion_big",
  },
  specialChanceByFloor: {
    1: 0.35,
    2: 0.45,
    3: 0.55,
  },
  specialPools: {
    1: [
      { itemId: "bomb", weight: 4 },
      { itemId: "shield", weight: 2 },
      { itemId: "hint_scroll", weight: 3 },
    ],
    2: [
      { itemId: "bomb", weight: 4 },
      { itemId: "shield", weight: 2 },
      { itemId: "hint_scroll", weight: 3 },
      { itemId: "helmet", weight: 2 },
      { itemId: "time_stop_watch", weight: 2 },
    ],
    3: [
      { itemId: "bomb", weight: 4 },
      { itemId: "hint_scroll", weight: 3 },
      { itemId: "helmet", weight: 2 },
      { itemId: "time_stop_watch", weight: 2 },
      { itemId: "magicSword", weight: 2 },
      { itemId: "armor", weight: 2 },
      { itemId: "money_cat", weight: 1 },
      { itemId: "shield_charm", weight: 2 },
    ],
  },
};

function getItemType(item) {
  return item?.itemType || "general";
}

function isUniqueItemType(itemType) {
  return itemType !== "general";
}

function playerHasItemType(player, itemType, ignoreItemIndex = -1) {
  if (!player || !isUniqueItemType(itemType)) return false;

  return player.items.some((item, index) => index !== ignoreItemIndex && getItemType(item) === itemType);
}

function canPlayerReceiveItem(player, item, ignoreItemIndex = -1) {
  const itemType = getItemType(item);
  if (!player || !itemType) return false;
  if (!isUniqueItemType(itemType)) return true;
  return !playerHasItemType(player, itemType, ignoreItemIndex);
}

function getItemTypeDisplayName(itemType) {
  if (!itemType || itemType === "general") return "item";
  return itemType;
}

function getPartyKeyCount(keyId) {
  if (!keyId) return 0;
  return Math.max(0, Number(gameState.partyKeys?.[keyId] || 0));
}

function hasPartyKey(keyId) {
  return getPartyKeyCount(keyId) > 0;
}

function addPartyKey(keyId, count = 1) {
  if (!keyId || count <= 0) return 0;
  if (!gameState.partyKeys) {
    gameState.partyKeys = {};
  }

  gameState.partyKeys[keyId] = getPartyKeyCount(keyId) + count;
  return gameState.partyKeys[keyId];
}

function consumePartyKey(keyId, count = 1) {
  if (!keyId || count <= 0 || !hasPartyKey(keyId)) return false;

  const nextCount = Math.max(0, getPartyKeyCount(keyId) - count);
  if (!gameState.partyKeys) {
    gameState.partyKeys = {};
  }

  if (nextCount <= 0) {
    delete gameState.partyKeys[keyId];
  } else {
    gameState.partyKeys[keyId] = nextCount;
  }

  return true;
}

function hasMoneyCat(player) {
  return player?.items?.some((item) => item.id === "money_cat");
}

function rollRewardBonusGold(player) {
  if (!hasMoneyCat(player)) return 0;
  return 1 + Math.floor(Math.random() * 10);
}

function invalidateShopStock() {
  if (gameState.currentFloor) {
    gameState.currentFloor.shopStock = null;
    return;
  }

  gameState.shopStock = null;
}

function getShopPoolForFloor(floorLevel = gameState.floorLevel || 1) {
  if (floorLevel >= 3) return shopStockRules.floorPools[3];
  if (floorLevel >= 2) return shopStockRules.floorPools[2];
  return shopStockRules.floorPools[1];
}

function rollStockQuantity(quantityRule) {
  if (Array.isArray(quantityRule)) {
    const [min, max] = quantityRule;
    return min + Math.floor(Math.random() * ((max - min) + 1));
  }

  return Number(quantityRule) || 1;
}

function drawWeightedShopEntry(pool) {
  const totalWeight = pool.reduce((sum, entry) => sum + Math.max(0, Number(entry.weight) || 0), 0);
  if (!totalWeight) return null;

  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= Math.max(0, Number(entry.weight) || 0);
    if (roll <= 0) return entry;
  }

  return pool[pool.length - 1] || null;
}

function generateShopStock(floorLevel = gameState.floorLevel || 1) {
  const generatedStock = shopStockRules.stapleStock
    .map((entry) => ({
      itemId: entry.itemId,
      quantity: rollStockQuantity(entry.quantity),
    }))
    .filter((entry) => itemData[entry.itemId]);

  const availablePool = getShopPoolForFloor(floorLevel).filter((entry) => itemData[entry.itemId]);
  const rolledPool = [...availablePool];

  for (let slotIndex = 0; slotIndex < shopStockRules.extraSlots && rolledPool.length; slotIndex += 1) {
    const chosenEntry = drawWeightedShopEntry(rolledPool);
    if (!chosenEntry) break;

    generatedStock.push({
      itemId: chosenEntry.itemId,
      quantity: rollStockQuantity(chosenEntry.quantity),
    });

    const chosenIndex = rolledPool.findIndex((entry) => entry.itemId === chosenEntry.itemId);
    if (chosenIndex !== -1) {
      rolledPool.splice(chosenIndex, 1);
    }
  }

  return generatedStock;
}

function ensureShopStockGenerated(forceRegenerate = false) {
  const currentFloor = gameState.currentFloor;

  if (currentFloor) {
    if (!Array.isArray(currentFloor.shopStock) || forceRegenerate) {
      currentFloor.shopStock = generateShopStock(currentFloor.floorLevel || gameState.floorLevel || 1);
    }
    return currentFloor.shopStock;
  }

  if (!Array.isArray(gameState.shopStock) || forceRegenerate) {
    gameState.shopStock = generateShopStock(gameState.floorLevel || 1);
  }

  return gameState.shopStock;
}

function getChestRewardPoolForFloor(floorLevel = gameState.floorLevel || 1) {
  if (floorLevel >= 3) return chestRewardRules.specialPools[3];
  if (floorLevel >= 2) return chestRewardRules.specialPools[2];
  return chestRewardRules.specialPools[1];
}

function getBaseChestPotionId(floorLevel = gameState.floorLevel || 1) {
  if (floorLevel >= 3) return chestRewardRules.basePotionByFloor[3];
  if (floorLevel >= 2) return chestRewardRules.basePotionByFloor[2];
  return chestRewardRules.basePotionByFloor[1];
}

function generateChestReward(floorLevel = gameState.floorLevel || 1) {
  const baseItemId = getBaseChestPotionId(floorLevel);
  const specialChance = floorLevel >= 3
    ? chestRewardRules.specialChanceByFloor[3]
    : (floorLevel >= 2 ? chestRewardRules.specialChanceByFloor[2] : chestRewardRules.specialChanceByFloor[1]);
  const useSpecialReward = Math.random() < specialChance;
  const chosenSpecial = useSpecialReward ? drawWeightedShopEntry(getChestRewardPoolForFloor(floorLevel)) : null;
  const itemId = chosenSpecial?.itemId || baseItemId;
  return itemData[itemId] ? { ...itemData[itemId] } : { ...itemData[baseItemId] };
}

function playerCanReceiveChestReward(item) {
  return gameState.players.some((player) => player && player.hp > 0 && canPlayerReceiveItem(player, item));
}

function chooseChestRewardForParty(floorLevel = gameState.floorLevel || 1) {
  let rewardItem = generateChestReward(floorLevel);
  if (playerCanReceiveChestReward(rewardItem)) return rewardItem;

  rewardItem = { ...itemData[getBaseChestPotionId(floorLevel)] };
  if (playerCanReceiveChestReward(rewardItem)) return rewardItem;

  return null;
}

function enterShop() {
  console.log("Shop clicked! Open shop UI...");
  // TODO: add shop interface logic here
}

function bindItemIconListeners() {
  document.querySelectorAll(".item-icon-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const playerIndex = Number(button.dataset.playerIndex);
      const itemIndex = Number(button.dataset.itemIndex);

      const player = gameState.players[playerIndex];
      if (!player) return;

      const item = player.items[itemIndex];
      if (!item) return;

      if (!item.usable) {
        openEventModal(`${item.name} is passive and cannot be clicked directly.`);
        return;
      }

      useItem(item.id, playerIndex);
    });
  });
}

function bindInventoryButtons() {
  document.querySelectorAll(".inventory-open-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const playerIndex = Number(button.dataset.playerIndex);
      openInventoryModal(playerIndex);
    });
  });
}

function applyPassiveItem(player, item, options = {}) {
  if (!player || !item) return;
  const shouldAnnounce = options.silent !== true;

  switch (item.id) {
    case "magicSword":
      player.damageBonus = (player.damageBonus || 0) + 1;
      if (shouldAnnounce) openEventModal(`${player.name} gained +1 battle damage from the Magic Sword!`);
      break;

    case "shield":
    case "helmet":
    case "shield_charm":
      player.shieldCharges = getShieldChargeCount(player) + 1;
      player.hasShield = true;
      player.shieldChargesUsedThisBattle = 0;
      if (shouldAnnounce) openEventModal(`${player.name} gained +1 shield charge each battle.`);
      break;

    case "armor":
      player.maxHp = (player.maxHp || 5) + 2;
      player.hp = Math.min(player.maxHp, player.hp + 2);
      if (shouldAnnounce) openEventModal(`${player.name} gained +2 max hearts from Armor!`);
      break;

    case "money_cat":
      if (shouldAnnounce) openEventModal(`${player.name}'s Money Cat will bring extra gold rewards.`);
      break;
  }
}

async function useItem(itemId, playerIndex = gameState.activePlayerIndex) {
  const player = gameState.players[playerIndex];
  if (!player) return;
  if (player.hp <= 0) {
    openEventModal(`${player.name} has fallen and cannot use items.`);
    return;
  }

  const itemIndex = player.items.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) return;

  const item = player.items[itemIndex];

  switch (item.id) {
    case "potion_small":
      player.hp = Math.min(player.maxHp, player.hp + 1);
      player.items.splice(itemIndex, 1);
      openEventModal(`${player.name} used a Small Healing Potion and recovered 1 heart!`);
 
      if (!gameState.currentBattle) endTurn();
      break;

    case "potion_medium":
      player.hp = Math.min(player.maxHp, player.hp + 2);
      player.items.splice(itemIndex, 1);
      openEventModal(`${player.name} used a Healing Potion and recovered 2 hearts!`);

      if (!gameState.currentBattle) endTurn();
      break;

    case "potion_big":
      player.hp = player.maxHp;
      player.items.splice(itemIndex, 1);
      openEventModal(`${player.name} used a Large Healing Potion and was fully healed!`);

      if (!gameState.currentBattle) endTurn();
      break;

    case "phoenix_feather":
      if (!gameState.players.some((candidate) => candidate && candidate.hp <= 0)) {
        openEventModal("No one in the party needs reviving right now.");
        return;
      }

      {
        const revivedPlayerIndex = await openPhoenixFeatherModal(playerIndex, itemIndex);
        const revivedPlayer = gameState.players[revivedPlayerIndex];
        if (!revivedPlayer) {
          return;
        }

        openEventModal(`${player.name} used a Phoenix Feather and revived ${revivedPlayer.name}!`);
        renderBattleOverlay?.();
        if (!gameState.currentBattle) endTurn();
      }
      break;

    case "bomb":
      if (!gameState.currentBattle || !gameState.currentBattle.monster) {
        openEventModal("Bombs can only be used in battle.");
        return;
      }

      {
        const monster = gameState.currentBattle.monster;
        monster.hp = Math.max(0, monster.hp - 2);
        player.items.splice(itemIndex, 1);

        if (monster.hp <= 0) {
          const rewardGold = monster.rewardGold || 10;
          player.gold += rewardGold;
          const currentRoom = typeof getCurrentRoom === "function" ? getCurrentRoom() : gameState.room;
          if (currentRoom) {
            currentRoom.monster = null;
          }
          if (gameState.levelStats) {
            gameState.levelStats.monstersDefeated += 1;
          }
          const awardedGoldKey = tryAwardGoldKeyForClearedFloor?.();
          gameState.pendingInteraction = null;
          gameState.currentBattle = null;
          resetBattleShieldUsage();
          clearQuestionIfAvailable();
          hideBattleOverlay();
          openEventModal(
            awardedGoldKey
              ? `${player.name} used a Bomb and defeated the monster! The final monster dropped a Gold Key!`
              : `${player.name} used a Bomb and defeated the monster!`
          );
        } else {
          openEventModal(`${player.name} used a Bomb and dealt 2 damage!`);
        }
      }

      renderBattleOverlay?.();
      break;

    case "time_stop_watch":
      if (!gameState.currentBattle) {
        openEventModal("The Time Stop Watch can only be used during battle.");
        return;
      }

      addBattleTimerMs?.(3000);
      player.items.splice(itemIndex, 1);
      openEventModal(`${player.name} stopped time and gained 3 extra seconds!`);
      break;

    case "hint_scroll":
      if (!getQuestionIfAvailable()) {
        openEventModal("There is no active question to use a Hint Scroll on.");
        return;
      }

      if (!eliminateWrongChoices?.(2)) {
        openEventModal("The Hint Scroll cannot help with this question.");
        return;
      }

      player.items.splice(itemIndex, 1);
      renderQuestionPanel();
      openEventModal(`${player.name} used a Hint Scroll to remove 2 wrong answers!`);
      break;

    default:
      openEventModal(`${item.name} is not implemented yet.`);
      return;
  }

  renderAdventureUI();
}

function openShopModal() {
  const player = gameState.players[gameState.activePlayerIndex];
  if (!player) return;
  if (player.hp <= 0) {
    openEventModal("Fallen heroes cannot visit the shop.");
    return;
  }
  const stock = ensureShopStockGenerated();

  if (els.shopPlayerInfo) {
    const stockCount = stock.reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0);
    els.shopPlayerInfo.textContent = `${player.name} — Gold: ${player.gold} — Stock: ${stockCount} item${stockCount === 1 ? "" : "s"}`;
  }

  renderShopItems(player);
  els.shopModal?.classList.remove("hidden");
}

function closeShopModal() {
  els.shopModal?.classList.add("hidden");
}

function openInventoryModal(playerIndex) {
  const player = gameState.players[playerIndex];
  if (!player) return;
  if (player.hp <= 0) {
    openEventModal(`${player.name} has fallen and cannot manage items.`);
    return;
  }

  inventoryUiState.playerIndex = playerIndex;
  inventoryUiState.selectedItemIndex = player.items.length ? 0 : null;
  inventoryUiState.tradeMode = false;

  renderInventoryModal();
  els.inventoryModal?.classList.remove("hidden");
}

function closeInventoryModal() {
  els.inventoryModal?.classList.add("hidden");
  inventoryUiState.playerIndex = null;
  inventoryUiState.selectedItemIndex = null;
  inventoryUiState.tradeMode = false;
  closeInventoryConfirmModal();
}

function renderInventoryModal() {
  const player = gameState.players[inventoryUiState.playerIndex];
  if (!player) return;

  if (els.inventoryPlayerInfo) {
    els.inventoryPlayerInfo.textContent = `${player.name} is carrying ${player.items.length} item${player.items.length === 1 ? "" : "s"}.`;
  }

  if (els.inventoryItemList) {
    if (!player.items.length) {
      els.inventoryItemList.innerHTML = `<div class="inventory-empty">No items to manage right now.</div>`;
    } else {
      els.inventoryItemList.innerHTML = player.items.map((item, itemIndex) => {
        const isSelected = itemIndex === inventoryUiState.selectedItemIndex;
        return `
          <button
            type="button"
            class="inventory-item-card ${isSelected ? "is-selected" : ""}"
            data-inventory-item-index="${itemIndex}"
          >
            <img class="inventory-item-img" src="./img/items/${item.id}.png" alt="${item.name}" />
            <div class="inventory-item-meta">
              <div class="inventory-item-name">${item.name}</div>
              <div class="inventory-item-desc">${item.description}</div>
            </div>
          </button>
        `;
      }).join("");
    }
  }

  bindInventoryItemCards();
  renderInventoryTradeTargets();
  updateInventoryActionState();
}

function bindInventoryItemCards() {
  document.querySelectorAll(".inventory-item-card").forEach((button) => {
    button.addEventListener("click", () => {
      inventoryUiState.selectedItemIndex = Number(button.dataset.inventoryItemIndex);
      inventoryUiState.tradeMode = false;
      renderInventoryModal();
    });
  });
}

function updateInventoryActionState() {
  const player = gameState.players[inventoryUiState.playerIndex];
  const selectedItem = player && inventoryUiState.selectedItemIndex !== null
    ? player.items[inventoryUiState.selectedItemIndex]
    : null;
  const hasSelection = Boolean(selectedItem);
  const hasEligibleTradeTarget = hasSelection
    && gameState.players.some((candidate, candidateIndex) => (
      candidate
      && candidateIndex !== inventoryUiState.playerIndex
      && canPlayerReceiveItem(candidate, selectedItem)
    ));

  if (els.inventoryDropBtn) {
    els.inventoryDropBtn.disabled = !hasSelection;
  }

  if (els.inventoryTradeBtn) {
    els.inventoryTradeBtn.disabled = !hasSelection || !hasEligibleTradeTarget;
  }

  if (els.inventoryTradePanel) {
    els.inventoryTradePanel.classList.toggle("hidden", !inventoryUiState.tradeMode || !hasSelection);
  }
}

function promptDropSelectedInventoryItem() {
  const player = gameState.players[inventoryUiState.playerIndex];
  const item = player?.items?.[inventoryUiState.selectedItemIndex];
  if (!player || !item) return;
  if (item.id === "key_gold" && floorSpecialRoomNeedsKey?.()) {
    openEventModal("We still need that Gold Key to open the sealed chamber.");
    return;
  }

  if (els.inventoryConfirmText) {
    els.inventoryConfirmText.textContent = `Drop ${item.name} from ${player.name}'s inventory?`;
  }

  els.inventoryConfirmModal?.classList.remove("hidden");
}

function closeInventoryConfirmModal() {
  els.inventoryConfirmModal?.classList.add("hidden");
}

function openChestRewardModal(item, summaryMessage = "") {
  if (!item || !els.chestRewardModal) return Promise.resolve(null);

  chestRewardUiState.item = { ...item };
  chestRewardUiState.summary = summaryMessage;

  if (els.chestRewardSummary) {
    els.chestRewardSummary.textContent = summaryMessage || "A treasure item was found in the chest.";
  }

  if (els.chestRewardItemName) {
    els.chestRewardItemName.textContent = item.name;
  }

  if (els.chestRewardItemDesc) {
    els.chestRewardItemDesc.textContent = item.description;
  }

  if (els.chestRewardItemImg) {
    els.chestRewardItemImg.src = `./img/items/${item.id}.png`;
    els.chestRewardItemImg.alt = item.name;
  }

  renderChestRewardTargets();
  els.chestRewardModal.classList.remove("hidden");

  return new Promise((resolve) => {
    chestRewardUiState.resolve = resolve;
  });
}

function closeChestRewardModal() {
  const resolveReward = chestRewardUiState.resolve;
  els.chestRewardModal?.classList.add("hidden");
  chestRewardUiState.item = null;
  chestRewardUiState.summary = "";
  chestRewardUiState.resolve = null;

  if (typeof resolveReward === "function") {
    resolveReward(null);
  }
}

function openPhoenixFeatherModal(playerIndex, itemIndex) {
  const modalEl = document.getElementById("phoenixFeatherModal");
  const targetsEl = document.getElementById("phoenixFeatherTargets");
  const summaryEl = document.getElementById("phoenixFeatherSummary");
  if (!modalEl || !targetsEl) return Promise.resolve(null);

  phoenixFeatherUiState.userPlayerIndex = playerIndex;
  phoenixFeatherUiState.itemIndex = itemIndex;

  const userPlayer = gameState.players[playerIndex];
  if (summaryEl) {
    summaryEl.textContent = `${userPlayer?.name || "A hero"} holds the Phoenix Feather. Who should be revived?`;
  }

  targetsEl.innerHTML = gameState.players.map((player, candidateIndex) => {
    if (!player || player.hp > 0) return "";

    return `
      <button
        type="button"
        class="inventory-trade-target-btn phoenix-feather-target-btn"
        data-revive-player-index="${candidateIndex}"
      >
        <img class="inventory-trade-target-img" src="./img/heroes/${player.id}.png" alt="${player.name}" />
        <span>${player.name}</span>
        <span class="inventory-trade-note">Fallen</span>
      </button>
    `;
  }).join("");

  document.querySelectorAll(".phoenix-feather-target-btn").forEach((button) => {
    button.addEventListener("click", () => {
      revivePlayerWithPhoenixFeather(Number(button.dataset.revivePlayerIndex));
    });
  });

  modalEl.classList.remove("hidden");

  return new Promise((resolve) => {
    phoenixFeatherUiState.resolve = resolve;
  });
}

function closePhoenixFeatherModal() {
  const resolveRevive = phoenixFeatherUiState.resolve;
  const modalEl = document.getElementById("phoenixFeatherModal");
  modalEl?.classList.add("hidden");
  phoenixFeatherUiState.userPlayerIndex = null;
  phoenixFeatherUiState.itemIndex = null;
  phoenixFeatherUiState.resolve = null;

  if (typeof resolveRevive === "function") {
    resolveRevive(null);
  }
}

function revivePlayerWithPhoenixFeather(targetIndex) {
  const sourcePlayer = gameState.players[phoenixFeatherUiState.userPlayerIndex];
  const targetPlayer = gameState.players[targetIndex];
  const itemIndex = phoenixFeatherUiState.itemIndex;
  if (!sourcePlayer || !targetPlayer || itemIndex === null) return;
  if (targetPlayer.hp > 0) {
    openEventModal(`${targetPlayer.name} is already standing.`);
    return;
  }

  sourcePlayer.items.splice(itemIndex, 1);
  targetPlayer.hp = Math.max(1, targetPlayer.hp || 0);
  targetPlayer.hasShield = hasAvailableShieldCharge(targetPlayer);

  const resolveRevive = phoenixFeatherUiState.resolve;
  phoenixFeatherUiState.resolve = null;
  closePhoenixFeatherModal();
  renderPlayerCards();
  renderAdventureUI();

  if (typeof resolveRevive === "function") {
    resolveRevive(targetIndex);
  }
}

function renderChestRewardTargets() {
  const rewardItem = chestRewardUiState.item;
  if (!els.chestRewardTargets) return;
  if (!rewardItem) {
    els.chestRewardTargets.innerHTML = "";
    return;
  }

  els.chestRewardTargets.innerHTML = gameState.players.map((player, playerIndex) => {
    if (!player || player.hp <= 0) return "";
    const canReceiveItem = canPlayerReceiveItem(player, rewardItem);
    const itemType = getItemType(rewardItem);

    return `
      <button
        type="button"
        class="inventory-trade-target-btn chest-reward-target-btn"
        data-chest-reward-player-index="${playerIndex}"
        ${canReceiveItem ? "" : "disabled"}
      >
        <img class="inventory-trade-target-img" src="./img/heroes/${player.id}.png" alt="${player.name}" />
        <span>${player.name}</span>
        ${canReceiveItem ? "" : `<span class="inventory-trade-note">Has ${getItemTypeDisplayName(itemType)}</span>`}
      </button>
    `;
  }).join("");

  document.querySelectorAll(".chest-reward-target-btn").forEach((button) => {
    button.addEventListener("click", () => {
      assignChestRewardToPlayer(Number(button.dataset.chestRewardPlayerIndex));
    });
  });
}

function assignChestRewardToPlayer(playerIndex) {
  const rewardItem = chestRewardUiState.item;
  const player = gameState.players[playerIndex];
  if (!rewardItem || !player) return;
  if (!canPlayerReceiveItem(player, rewardItem)) {
    openEventModal(`${player.name} already has a ${getItemTypeDisplayName(getItemType(rewardItem))}.`);
    return;
  }

  player.items.push({ ...rewardItem });

  if (!rewardItem.usable) {
    applyPassiveItem(player, rewardItem, { silent: true });
  }

  const resolveReward = chestRewardUiState.resolve;
  chestRewardUiState.resolve = null;
  closeChestRewardModal();
  renderPlayerCards();
  renderAdventureUI();

  if (typeof resolveReward === "function") {
    resolveReward(playerIndex);
  }
}

function confirmDropSelectedInventoryItem() {
  const player = gameState.players[inventoryUiState.playerIndex];
  const itemIndex = inventoryUiState.selectedItemIndex;
  const item = player?.items?.[itemIndex];
  if (!player || itemIndex === null || !item) return;

  if (!item.usable) {
    removePassiveItemEffect(player, item);
  }

  player.items.splice(itemIndex, 1);
  inventoryUiState.selectedItemIndex = player.items.length ? Math.min(itemIndex, player.items.length - 1) : null;
  inventoryUiState.tradeMode = false;

  closeInventoryConfirmModal();
  renderPlayerCards();
  renderInventoryModal();
  openEventModal(`${player.name} dropped ${item.name}.`);
}

function beginInventoryTrade() {
  const player = gameState.players[inventoryUiState.playerIndex];
  const item = player?.items?.[inventoryUiState.selectedItemIndex];
  if (!player || !item) return;

  const hasEligibleTradeTarget = gameState.players.some((candidate, candidateIndex) => (
    candidate
    && candidateIndex !== inventoryUiState.playerIndex
    && canPlayerReceiveItem(candidate, item)
  ));
  if (!hasEligibleTradeTarget) {
    openEventModal(`No one can receive another ${getItemTypeDisplayName(getItemType(item))} right now.`);
    return;
  }

  inventoryUiState.tradeMode = true;
  renderInventoryModal();
}

function renderInventoryTradeTargets() {
  const player = gameState.players[inventoryUiState.playerIndex];
  const item = player?.items?.[inventoryUiState.selectedItemIndex];

  if (!els.inventoryTradeTargets) return;

  if (!inventoryUiState.tradeMode || !player || !item) {
    els.inventoryTradeTargets.innerHTML = "";
    return;
  }

  els.inventoryTradeTargets.innerHTML = gameState.players
    .map((candidate, candidateIndex) => {
      if (!candidate || candidateIndex === inventoryUiState.playerIndex) return "";
      const canReceiveItem = canPlayerReceiveItem(candidate, item);
      const itemType = getItemType(item);
      return `
        <button
          type="button"
          class="inventory-trade-target-btn"
          data-trade-target-index="${candidateIndex}"
          ${canReceiveItem ? "" : "disabled"}
        >
          <img class="inventory-trade-target-img" src="./img/heroes/${candidate.id}.png" alt="${candidate.name}" />
          <span>${candidate.name}</span>
          ${canReceiveItem ? "" : `<span class="inventory-trade-note">Has ${getItemTypeDisplayName(itemType)}</span>`}
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".inventory-trade-target-btn").forEach((button) => {
    button.addEventListener("click", () => {
      completeInventoryTrade(Number(button.dataset.tradeTargetIndex));
    });
  });
}

function completeInventoryTrade(targetIndex) {
  const sourcePlayer = gameState.players[inventoryUiState.playerIndex];
  const targetPlayer = gameState.players[targetIndex];
  const itemIndex = inventoryUiState.selectedItemIndex;
  const item = sourcePlayer?.items?.[itemIndex];
  if (!sourcePlayer || !targetPlayer || itemIndex === null || !item) return;
  if (!canPlayerReceiveItem(targetPlayer, item)) {
    openEventModal(`${targetPlayer.name} already has a ${getItemTypeDisplayName(getItemType(item))}.`);
    return;
  }

  sourcePlayer.items.splice(itemIndex, 1);
  targetPlayer.items.push({ ...item });

  if (!item.usable) {
    removePassiveItemEffect(sourcePlayer, item);
    applyPassiveItem(targetPlayer, item);
  }

  inventoryUiState.playerIndex = targetIndex;
  inventoryUiState.selectedItemIndex = targetPlayer.items.length - 1;
  inventoryUiState.tradeMode = false;

  renderPlayerCards();
  renderInventoryModal();
  openEventModal(`${sourcePlayer.name} traded ${item.name} to ${targetPlayer.name}.`);
}

function removePassiveItemEffect(player, item) {
  if (!player || !item) return;

  switch (item.id) {
    case "magicSword":
      player.damageBonus = Math.max(0, (player.damageBonus || 0) - 1);
      break;
    case "shield":
    case "helmet":
    case "shield_charm":
      player.shieldCharges = Math.max(0, getShieldChargeCount(player) - 1);
      player.shieldChargesUsedThisBattle = Math.min(
        getUsedShieldChargeCount(player),
        player.shieldCharges
      );
      player.hasShield = hasAvailableShieldCharge(player);
      break;
    case "armor":
      player.maxHp = Math.max(5, (player.maxHp || 5) - 2);
      player.hp = Math.min(player.hp, player.maxHp);
      break;
  }
}

function renderShopItems(player) {
  if (!els.shopItemList) return;
  const shopStock = ensureShopStockGenerated();

  if (!shopStock.length) {
    els.shopItemList.innerHTML = `<div class="inventory-empty">The merchant has sold out for this floor.</div>`;
    return;
  }

  els.shopItemList.innerHTML = shopStock.map((entry, stockIndex) => {
    const item = itemData[entry.itemId];
    if (!item) return "";

    const quantity = Math.max(0, Number(entry.quantity) || 0);
    const canAfford = player.gold >= item.cost;
    const canReceiveItem = canPlayerReceiveItem(player, item);
    const inStock = quantity > 0;
    const canBuy = inStock && canAfford && canReceiveItem;
    const buttonLabel = !inStock ? "Sold Out" : (canReceiveItem ? "Buy" : "Owned");
    const itemType = getItemType(item);

    return `
      <div class="shop-item-card ${inStock ? "" : "is-sold-out"}">
        <img
          class="shop-item-img"
          src="./img/items/${item.id}.png"
          alt="${item.name}"
        />
        <div class="shop-item-meta">
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.description}</div>
          <div class="shop-item-quantity">Quantity: ${quantity}</div>
          <div class="shop-item-cost">
            ${!inStock
              ? "Out of stock"
              : (canReceiveItem ? `Cost: ${item.cost} gold` : `Already carrying a ${getItemTypeDisplayName(itemType)}`)}
          </div>
        </div>
        <button
          class="shop-buy-btn"
          data-shop-stock-index="${stockIndex}"
          ${canBuy ? "" : "disabled"}
        >
          ${buttonLabel}
        </button>
      </div>
    `;
  }).join("");

  bindShopBuyButtons();
}

function bindShopBuyButtons() {
  document.querySelectorAll(".shop-buy-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const stockIndex = Number(button.dataset.shopStockIndex);
      buyShopItem(stockIndex);
    });
  });
}

function buyShopItem(stockIndex) {
  const player = gameState.players[gameState.activePlayerIndex];
  const shopStock = ensureShopStockGenerated();
  const stockEntry = shopStock[stockIndex];
  if (!player || !stockEntry) return;

  const item = itemData[stockEntry.itemId];
  if (!item) return;
  if ((Number(stockEntry.quantity) || 0) <= 0) {
    openEventModal(`${item.name} is sold out.`);
    return;
  }
  if (!canPlayerReceiveItem(player, item)) {
    openEventModal(`${player.name} already has a ${getItemTypeDisplayName(getItemType(item))}.`);
    return;
  }

  if (player.gold < item.cost) {
    openEventModal("Not enough gold.");
    return;
  }

  player.gold -= item.cost;
  stockEntry.quantity = Math.max(0, (Number(stockEntry.quantity) || 0) - 1);
  player.items.push({ ...item });

  if (!item.usable) {
    applyPassiveItem(player, item);
  }

  renderPlayerCards();
  renderAdventureUI();
  closeShopModal();
  endTurn();
}
