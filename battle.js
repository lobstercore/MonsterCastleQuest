/* =========================
   Dungeon Crawler Lite
   battle.js
   Battle system + battle UI
   ========================= */

function waitBattleMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showBattleOverlay() {
  els.battleOverlay?.classList.remove("hidden");
}

function hideBattleOverlay() {
  els.battleOverlay?.classList.add("hidden");
  els.battleOverlay?.classList.remove("battle-intro");
  setBattleTimerDangerState(false);
  if (els.battleFxLayer) {
    els.battleFxLayer.innerHTML = "";
  }
}

function animateBattleStatusUpdate() {
  if (!els.battleStatusText) return;
  els.battleStatusText.classList.remove("status-updated");
  void els.battleStatusText.offsetWidth;
  els.battleStatusText.classList.add("status-updated");
}

function setBattleTimerDangerState(isDanger) {
  els.battleOverlay?.classList.toggle("timer-danger", Boolean(isDanger));
  els.battleCenterPanel?.classList.toggle("timer-danger", Boolean(isDanger));
  els.battleTimerContainer?.classList.toggle("timer-danger", Boolean(isDanger));
}

function showBattleFloatText(targetEl, text, type = "hit") {
  if (!els.battleFxLayer || !els.battleOverlay || !targetEl || !text) return;

  const overlayRect = els.battleOverlay.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();
  const floatEl = document.createElement("div");
  floatEl.className = `battle-float-text ${type}`;
  floatEl.textContent = text;
  floatEl.style.left = `${(targetRect.left - overlayRect.left) + (targetRect.width / 2)}px`;
  floatEl.style.top = `${(targetRect.top - overlayRect.top) + (targetRect.height * 0.34)}px`;
  els.battleFxLayer.appendChild(floatEl);

  setTimeout(() => {
    floatEl.remove();
  }, 950);
}

function renderBattleOverlay() {
  const battle = gameState.currentBattle;
  if (!battle || !battle.monster) return;

  const activeIndex = Number(gameState.activePlayerIndex ?? 0);

  els.battlePartyUnits.forEach((unitEl, index) => {
    const player = gameState.players[index];

    if (!player) {
      unitEl.classList.add("hidden");
      unitEl.classList.remove("active-turn", "inactive-turn", "ko");
      return;
    }

    unitEl.classList.remove("hidden");
    unitEl.classList.toggle("active-turn", index === activeIndex);
    unitEl.classList.toggle("inactive-turn", index !== activeIndex);
    unitEl.classList.toggle("ko", player.hp <= 0);

    if (els.battlePartyImgs[index]) {
      els.battlePartyImgs[index].src = `./img/heroes/${player.id || "fighter"}.png`;
      els.battlePartyImgs[index].alt = player.name || "Hero";
    }

    if (els.battlePartyNames[index]) {
      els.battlePartyNames[index].textContent = player.name || "Hero";
    }

    if (els.battlePartyHps[index]) {
      els.battlePartyHps[index].innerHTML = `
        ${getIconMarkup("heart", "Hearts", "ui-inline-icon battle-hp-icon")}
        <span>${player.hp} / ${player.maxHp}</span>
        ${renderShieldIcons(player)}
      `;
    }
  });

  if (els.battleMonsterName) {
    els.battleMonsterName.textContent = battle.monster.name || "Monster";
  }

  if (els.battleMonsterHp) {
    els.battleMonsterHp.innerHTML = `
      ${getIconMarkup("heart", "Hearts", "ui-inline-icon battle-hp-icon")}
      <span>${battle.monster.hp} / ${battle.monster.maxHp}</span>
    `;
  }

  if (els.battleMonsterImg) {
    els.battleMonsterImg.src = `./img/monsters/${battle.monster.id || "slime"}.png`;
    els.battleMonsterImg.alt = battle.monster.name || "Monster";
  }

  if (els.battleStatusText) {
    const nextStatus = battle.statusText || "Battle!";
    if (els.battleStatusText.textContent !== nextStatus) {
      els.battleStatusText.textContent = nextStatus;
      animateBattleStatusUpdate();
    } else {
      els.battleStatusText.textContent = nextStatus;
    }
  }
}

function getNextLivingPlayerIndex(startIndex) {
  if (!gameState.players.length) return 0;

  for (let step = 1; step <= gameState.players.length; step += 1) {
    const idx = (startIndex + step) % gameState.players.length;
    if (gameState.players[idx] && gameState.players[idx].hp > 0) {
      return idx;
    }
  }

  return startIndex;
}

function isPartyDefeated() {
  return gameState.players.every((player) => player.hp <= 0);
}

async function startBattleEncounter() {
  const roomMonster = getCurrentRoom()?.monster;
  if (!roomMonster) return;

  resetBattleShieldUsage();
  gameState.activePlayerIndex = getNextLivingPlayerIndex(gameState.activePlayerIndex);
  const activePlayer = gameState.players[gameState.activePlayerIndex];

  gameState.pendingInteraction = "battle";
  gameState.currentBattle = {
    monster: { ...roomMonster },
    statusText: `${activePlayer?.name || "Hero"} faces ${roomMonster.name}!`,
  };
  AudioManager.playBattleMusic();
  showBattleOverlay();
  renderBattleOverlay();
  els.battleOverlay?.classList.remove("battle-intro");
  void els.battleOverlay?.offsetWidth;
  els.battleOverlay?.classList.add("battle-intro");

  await waitBattleMs(520);

  startBattleTimerForActivePlayer();

  if (typeof startBattleQuestion === "function") {
    startBattleQuestion();
  }

  renderQuestionPanel();
}

function startBattleTimerForActivePlayer() {
  clearBattleTimer();

  const battle = gameState.currentBattle;
  if (!battle) return;

  const activePlayer = gameState.players[gameState.activePlayerIndex];
  if (!activePlayer) return;

  const baseDuration = 6000;
  const duration = Math.max(2000, baseDuration - (gameState.floorLevel - 1) * 1000);

  const bar = document.getElementById("battleTimerBar");
  if (!bar) return;

  bar.style.width = "100%";
  bar.style.backgroundColor = "#4caf50";
  bar.classList.remove("flashing");
  setBattleTimerDangerState(false);

  const startTime = Date.now();
  const expiresAt = startTime + duration;
  gameState.battleTimer = {
    expiresAt,
    intervalId: setInterval(() => {
      const remaining = Math.max(0, gameState.battleTimer.expiresAt - Date.now());
      gameState.battleTimer.remaining = remaining;

      bar.style.width = `${(remaining / duration) * 100}%`;

      if (remaining / duration <= 0.2) {
        bar.classList.add("flashing");
        setBattleTimerDangerState(true);
      } else {
        bar.classList.remove("flashing");
        setBattleTimerDangerState(false);
      }

      if (remaining <= 0) {
        clearBattleTimer();

        bar.style.width = "100%";
        bar.style.backgroundColor = "#f44336";
        bar.classList.remove("flashing");
        setBattleTimerDangerState(false);

        const player = gameState.players[gameState.activePlayerIndex];
        const monster = battle.monster;
        if (!player || !monster) return;

        if (consumeShieldCharge(player)) {
          battle.statusText = `${player.name}'s shield blocked the damage!`;
          AudioManager.playSFX("shieldBlock");
          showBattleFloatText(els.battlePartyUnits?.[gameState.activePlayerIndex], "Blocked!", "block");
        } else {
          player.hp = Math.max(0, player.hp - 1);
          battle.statusText = `${player.name} took 1 damage for not answering in time!`;
          AudioManager.playPlayerHitSFX(player);
          showBattleFloatText(els.battlePartyUnits?.[gameState.activePlayerIndex], "-1", "damage");
        }

        renderPlayerCards();
        renderBattleOverlay();

        if (isPartyDefeated()) {
          resetBattleShieldUsage();
          gameState.currentBattle = null;
          hideBattleOverlay();
          renderQuestionPanel();
          openEventModal(`The party was defeated by ${monster.name}!`);
          checkEndConditions();
          return;
        }

        gameState.activePlayerIndex = getNextLivingPlayerIndex(gameState.activePlayerIndex);
        const nextPlayer = gameState.players[gameState.activePlayerIndex];
        if (nextPlayer) {
          battle.statusText = `${nextPlayer.name} can still answer!`;
          renderBattleOverlay();
          renderPlayerCards();
          startBattleTimerForActivePlayer();
        }
      }
    }, 50),
  };
}

function clearBattleTimer() {
  if (gameState.battleTimer?.intervalId) {
    clearInterval(gameState.battleTimer.intervalId);
    gameState.battleTimer.intervalId = null;
  }
  const bar = document.getElementById("battleTimerBar");
  if (bar) bar.style.width = "100%";
  setBattleTimerDangerState(false);
}

function addBattleTimerMs(extraMs) {
  if (!gameState.currentBattle || !gameState.battleTimer?.expiresAt) return false;
  gameState.battleTimer.expiresAt += extraMs;
  gameState.battleTimer.remaining = Math.max(0, gameState.battleTimer.expiresAt - Date.now());
  return true;
}



async function resolveBattleQuestion(isCorrect) {
  const battle = gameState.currentBattle;
  const activePlayer = gameState.players[gameState.activePlayerIndex];

  if (!battle || !battle.monster || !activePlayer) return;

  const monster = battle.monster;

  clearBattleTimer();

  if (isCorrect) {
    const damage = 1 + (activePlayer.damageBonus || 0);
    monster.hp = Math.max(0, monster.hp - damage);
    battle.statusText = `${activePlayer.name} hits ${monster.name} for ${damage} damage!`;

    AudioManager.playMonsterHitSFX();
    showBattleFloatText(els.battleMonsterCard, `-${damage}`, "hit");

    if (els.battleMonsterCard) {
      els.battleMonsterCard.classList.add("battle-hit");
      setTimeout(() => {
        els.battleMonsterCard?.classList.remove("battle-hit");
      }, 280);
    }

    renderPlayerCards();
    renderBattleOverlay();
    renderQuestionPanel();

    if (monster.hp <= 0) {
      const rewardGold = monster.rewardGold || 10;

      const partyMembers = gameState.players.filter(player => player);
      const partySize = gameState.partySize || partyMembers.length || 4;
      const goldPerPlayer = partySize ? Math.floor(rewardGold / partySize) : 0;

      partyMembers.forEach(player => {
        player.gold += goldPerPlayer;
        player.gold += rollRewardBonusGold?.(player) || 0;
      });

      const currentRoom = getCurrentRoom();
      if (currentRoom) {
        currentRoom.monster = null;
      }
      gameState.levelStats.monstersDefeated++;
      const awardedGoldKey = tryAwardGoldKeyForClearedFloor?.();

      renderLevelStats();
      hideBattleOverlay();

      if (awardedGoldKey) {
        AudioManager.playSFX("victory");
        await openEventModalAsync(
          "The final monster dropped a Gold Key! The sealed chamber can now be opened."
        );
      }

      await openEventModalAsync(
        `${activePlayer.name} defeated the ${monster.name}! The party shared ${rewardGold} gold (${goldPerPlayer} each).`
      );

      clearQuestionIfAvailable();
      gameState.pendingInteraction = null;
      gameState.currentBattle = null;
      resetBattleShieldUsage();

      AudioManager.stopBattleMusic();
      AudioManager.playDungeonBGM(gameState.floorLevel);

      renderPlayerCards();
      renderRoomObjects();
      renderAdventureUI();
      nextPlayerTurn();

      if (checkEndConditions()) return;
      return;
    }
  } else {
    if (consumeShieldCharge(activePlayer)) {
      battle.statusText = `${activePlayer.name}'s Shield blocked the hit!`;
      showBattleFloatText(els.battlePartyUnits?.[gameState.activePlayerIndex], "Blocked!", "block");
    } else {
      activePlayer.hp = Math.max(0, activePlayer.hp - 1);
      battle.statusText = `${activePlayer.name} was hit and lost 1 heart!`;

      AudioManager.playPlayerHitSFX(activePlayer);
      showBattleFloatText(els.battlePartyUnits?.[gameState.activePlayerIndex], "-1", "damage");

      const activeUnit = els.battlePartyUnits?.[gameState.activePlayerIndex];
      if (activeUnit) {
        activeUnit.classList.add("battle-hit");
        setTimeout(() => {
          activeUnit?.classList.remove("battle-hit");
        }, 280);
      }
    }

    renderPlayerCards();
    renderBattleOverlay();
    renderQuestionPanel();

    const heroFellInBattle = activePlayer.hp <= 0;

    if (isPartyDefeated()) {
      hideBattleOverlay();
      clearQuestionIfAvailable();
      gameState.pendingInteraction = null;
      gameState.currentBattle = null;
      resetBattleShieldUsage();

      AudioManager.stopBattleMusic();
      AudioManager.playDungeonBGM(gameState.floorLevel);

      await openEventModalAsync(
        `The party was defeated by ${monster.name}!`
      );

      if (checkEndConditions()) return;
      renderAdventureUI();
      return;
    }

    if (heroFellInBattle) {
      await openEventModalAsync(
        `${activePlayer.name} has fallen in battle! We must carry on the fight!`
      );
    }
  }

  gameState.activePlayerIndex = getNextLivingPlayerIndex(gameState.activePlayerIndex);
  const nextPlayer = gameState.players[gameState.activePlayerIndex];
  if (nextPlayer) battle.statusText = `${nextPlayer.name}'s turn!`;

  renderPlayerCards();
  renderBattleOverlay();

  if (typeof startBattleQuestion === "function") startBattleQuestion();
  renderQuestionPanel();

  startBattleTimerForActivePlayer();
}

function openBattleModal(message) {
  gameState.battleOpen = true;
  if (els.battleMessage) {
    els.battleMessage.textContent = message;
  }
  els.battleModal?.classList.remove("hidden");

  els.battleModal?.addEventListener("click", handleBattleModalBackdropClick, { once: true });
}

function handleBattleModalBackdropClick(event) {
  if (event.target !== els.battleModal) return;
  closeBattleModal();
}

function closeBattleModal() {
  gameState.battleOpen = false;
  els.battleModal?.classList.add("hidden");
}


