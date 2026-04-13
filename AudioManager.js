// AudioManager.js
const AudioManager = (() => {
  const music = {};
  const sfx = {};
  let currentMusic = null;
  let masterVolume = 1;
  let musicVolume = 1;
  let sfxVolume = 1;
  let musicEnabled = true;
  let sfxEnabled = true;

  function syncMusicVolumes() {
    Object.values(music).forEach((track) => {
      if (!track) return;
      track.volume = masterVolume * musicVolume;
    });
  }

  function syncSfxVolumes() {
    Object.values(sfx).forEach((sound) => {
      if (!sound) return;
      sound.volume = masterVolume * sfxVolume;
    });
  }

  function loadAudio() {
    // ---- Music tracks ----
    const musicFiles = [
      'battle_track_1',
      'battle_track_2',
      'battle_track_3',
      'boss_battle_1',
      'dungeon_level_1',
      'dungeon_level_2',
      'dungeon_level_3',
      'mainTheme',
      'victory'
    ];
    musicFiles.forEach(name => {
      music[name] = new Audio(`./audio/music/${name}.mp3`);
      music[name].loop = true;
    });

    // ---- System SFX ----
    const systemFiles = ['battle_victory', 'correct', 'defeat', ];
    systemFiles.forEach(name => {
      sfx[name] = new Audio(`./audio/sfx/system/${name}.mp3`);
    });

    // ---- Object SFX ----
    const objectFiles = ['chest_1', 'chest_2', 'chest_3', 'openDoor_1','openDoor_2','openDoor_3','openDoor_4','stairs','thunder','footsteps','shieldBlock','gate_slam'];
    objectFiles.forEach(name => {
      sfx[name] = new Audio(`./audio/sfx/objects/${name}.mp3`);
    });

    // ---- Character SFX ----
    const characterFiles = [

      'gruntFemale_1','gruntFemale_2','gruntFemale_3','gruntFemale_4',
      'gruntMale_1','gruntMale_2','gruntMale_3','gruntMale_4',
      'impact_1','impact_2','impact_3','impact_4','impact_5','impact_6',
      'lets-go-female','lets-go-male','yes_female_1','yes_female_2','yes_male_1',
      'no_male_1','no_male_2','no_male_3','no_female_1','no_female_2','no_female_3',
      'snore',
      'monsterGrunt_1','monsterGrunt_2','monsterGrunt_3','monsterGrunt_4','monsterGrunt_5',
      'boss_roar'
    ];
    characterFiles.forEach(name => {
      sfx[name] = new Audio(`./audio/sfx/characters/${name}.mp3`);
    });

    syncMusicVolumes();
    syncSfxVolumes();
  }

  // ---- Music control ----
  function playMusic(trackName, loop = true) {
    if (currentMusic) currentMusic.pause();
    if (!musicEnabled) return;
    if (music[trackName]) {
      currentMusic = music[trackName];
      currentMusic.loop = loop;
      currentMusic.volume = masterVolume * musicVolume;
      currentMusic.play();
    }
  }

  function stopMusic() {
    if (currentMusic) {
      currentMusic.pause();
      currentMusic.currentTime = 0;
    }
  }

  function setVolume(vol) {
    masterVolume = vol;
    syncMusicVolumes();
    syncSfxVolumes();
  }

  // ---- SFX control ----
  function playSFX(name) {
    if (!sfxEnabled) return;
    if (sfx[name]) {
      sfx[name].currentTime = 0; // restart sound if already playing
      sfx[name].volume = masterVolume * sfxVolume;
      sfx[name].play();
    }
  }

  function setMusicVolume(vol) {
    musicVolume = Math.max(0, Math.min(1, Number(vol) || 0));
    syncMusicVolumes();
  }

  function setSfxVolume(vol) {
    sfxVolume = Math.max(0, Math.min(1, Number(vol) || 0));
    syncSfxVolumes();
  }

  function setMusicEnabled(enabled) {
    musicEnabled = Boolean(enabled);
    if (!musicEnabled) {
      stopMusic();
    }
  }

  function setSfxEnabled(enabled) {
    sfxEnabled = Boolean(enabled);
  }

  function isMusicEnabled() {
    return musicEnabled;
  }

  function isSfxEnabled() {
    return sfxEnabled;
  }

  function getMusicVolume() {
    return musicVolume;
  }

  function getSfxVolume() {
    return sfxVolume;
  }

function playRandomSFX(names) {
  if (!names) return;

  let chosen = "";

  if (Array.isArray(names)) {
    if (!names.length) return;
    const index = Math.floor(Math.random() * names.length);
    chosen = names[index];
  } else if (typeof names === "string") {
    chosen = names;
  } else {
    console.warn("AudioManager.playRandomSFX: invalid input", names);
    return;
  }

  playSFX(chosen);
}
  // ---- Character-specific SFX ----
function playCharacterSound(gender, action) {
  const g = gender === "female" ? "female" : "male";

  if (action === "letsGo") {
    AudioManager.playSFX(g === "female" ? "lets-go-female" : "lets-go-male");
    return;
  }

  if (action === "grunt") {
    const variants = g === "female"
      ? ["gruntFemale_1", "gruntFemale_2", "gruntFemale_3", "gruntFemale_4"]
      : ["gruntMale_1", "gruntMale_2", "gruntMale_3", "gruntMale_4"];

    AudioManager.playRandomSFX(variants);
    return;
  }

  if (action === "no") {
    const variants = g === "female"
      ? ["no_female_1", "no_female_2", "no_female_3"]
      : ["no_male_1", "no_male_2", "no_male_3"];

    AudioManager.playRandomSFX(variants);
    return;
  }

  if (action === "impact") {
    AudioManager.playRandomSFX([
      "impact_1",
      "impact_2",
      "impact_3",
      "impact_4",
      "impact_5",
      "impact_6"
    ]);
  }
}


// In AudioManager.js (add these inside the returned object)
return {
  loadAudio,
  playMusic,
  stopMusic,
  setVolume,
  setMusicVolume,
  setSfxVolume,
  playSFX,
  playRandomSFX,
  playCharacterSound,
  setMusicEnabled,
  setSfxEnabled,
  isMusicEnabled,
  isSfxEnabled,
  getMusicVolume,
  getSfxVolume,

  // NEW unified methods:
  playBattleMusic: () => {
    const battle = gameState.currentBattle;
    if (battle?.monster?.isBoss) {
      AudioManager.playMusic("boss_battle_1");
      return;
    }
    const level = gameState.floorLevel || 1;
    AudioManager.playMusic(`battle_track_${Math.min(level, 3)}`);
  },

  stopBattleMusic: () => {
    AudioManager.stopMusic();
  },

  playPlayerHitSFX: (player) => {
    if (!player) return;
    AudioManager.playCharacterSound(player.gender || "male", "grunt");
    AudioManager.playCharacterSound(player.gender || "male", "impact");
  },

  playMonsterHitSFX: () => {
    AudioManager.playRandomSFX([
      "monsterGrunt_1",
      "monsterGrunt_2",
      "monsterGrunt_3",
      "monsterGrunt_4",
      "monsterGrunt_5"
    ]);
  },

  playDungeonBGM: (level = 1) => {
    const trackMap = {
      1: "dungeon_level_1",
      2: "dungeon_level_2",
      3: "dungeon_level_3",
      4: "dungeon_level_3",
    };
    AudioManager.playMusic(trackMap[level] || trackMap[1]);
  },

  stopDungeonBGM: () => {
    AudioManager.stopMusic();
  }
};
})();
