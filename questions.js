/* =========================
   Dungeon Crawler Lite
   questions.js
   Reusable question engine
   ========================= */

const questionConfig = {
  mode: "auto", // 'auto' | 'manual'
  selectedUnit: null,
  selectedChapter: null,
  selectedSources: [],
  contentScope: "chapter", // 'chapter' | 'unit'
  allowQuestionTypes: {
    zhToEn: true,
    enToZh: true,
    cloze: true,
    image: true,
  },
};

const questionState = {
  currentQuestion: null,
  currentContext: null, // { source: 'battle' | 'chest' | 'door' | 'shop', ... }
};

/* =========================
   Basic utilities
   ========================= */

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatFolderKey(key) {
  return String(key).replace(/([a-zA-Z]+)(\d+)/, "$1_$2");
}

function formatDisplayKey(key, fallback = "Item") {
  const match = String(key).match(/^([a-zA-Z]+)(\d+)$/);
  if (!match) return String(key);

  return `${fallback} ${match[2]}`;
}

function getQuestionImagePath(entry) {
  return `./img/vocabData/${formatFolderKey(entry.sourceUnit)}/${formatFolderKey(entry.sourceChapter)}/${entry.image}`;
}

const availableQuestionImagePaths = new Set([
  "./img/vocabData/unit_4/chapter_1/block.png",
  "./img/vocabData/unit_4/chapter_1/celebration.png",
  "./img/vocabData/unit_4/chapter_1/eliminate.png",
  "./img/vocabData/unit_4/chapter_1/gardener.png",
  "./img/vocabData/unit_4/chapter_1/kudzu.png",
  "./img/vocabData/unit_4/chapter_1/outcome.png",
  "./img/vocabData/unit_4/chapter_1/root.png",
  "./img/vocabData/unit_4/chapter_1/trouble.png",
  "./img/vocabData/unit_4/chapter_1/vine.png",
  "./img/vocabData/unit_4/chapter_1/weed.png",
  "./img/vocabData/unit_4/chapter_2/advice.png",
  "./img/vocabData/unit_4/chapter_2/escape.png",
  "./img/vocabData/unit_4/chapter_2/flatter.png",
  "./img/vocabData/unit_4/chapter_2/glossy.png",
  "./img/vocabData/unit_4/chapter_2/guzzle.png",
  "./img/vocabData/unit_4/chapter_2/idea.png",
  "./img/vocabData/unit_4/chapter_2/leap.png",
  "./img/vocabData/unit_4/chapter_2/praise.png",
  "./img/vocabData/unit_4/chapter_2/scamper.png",
  "./img/vocabData/unit_4/chapter_2/scheme.png",
  "./img/vocabData/unit_4/chapter_3/community.png",
  "./img/vocabData/unit_4/chapter_3/concerned.png",
  "./img/vocabData/unit_4/chapter_3/creative.png",
  "./img/vocabData/unit_4/chapter_3/objective.png",
  "./img/vocabData/unit_4/chapter_3/purpose.png",
  "./img/vocabData/unit_4/chapter_3/recycle.png",
  "./img/vocabData/unit_4/chapter_3/reduce.png",
  "./img/vocabData/unit_4/chapter_3/restore.png",
  "./img/vocabData/unit_4/chapter_3/solve.png",
  "./img/vocabData/unit_4/chapter_3/waste.png",
]);

function hasQuestionImageAsset(entry) {
  if (!entry?.image) return false;
  return availableQuestionImagePaths.has(getQuestionImagePath(entry));
}

/* =========================
   Pool builders
   ========================= */

function getAvailableUnits() {
  if (typeof vocabData === "undefined" || !vocabData) return [];
  return Object.keys(vocabData);
}

function getAvailableChapters(unitKey) {
  if (!unitKey || typeof vocabData === "undefined" || !vocabData[unitKey]) {
    return [];
  }
  return Object.keys(vocabData[unitKey]);
}

function normalizeSelectedSources(selectedSources = []) {
  const normalized = [];
  const seen = new Set();

  selectedSources.forEach((source) => {
    const unitKey = source?.unitKey || null;
    const chapterKey = source?.chapterKey || null;

    if (
      !unitKey ||
      !chapterKey ||
      typeof vocabData === "undefined" ||
      !vocabData?.[unitKey]?.[chapterKey]
    ) {
      return;
    }

    const key = `${unitKey}|${chapterKey}`;
    if (seen.has(key)) return;

    seen.add(key);
    normalized.push({ unitKey, chapterKey });
  });

  return normalized;
}

function getContentCatalog() {
  return getAvailableUnits().map((unitKey) => {
    const chapters = getAvailableChapters(unitKey).map((chapterKey) => {
      const words = Array.isArray(vocabData?.[unitKey]?.[chapterKey]) ? vocabData[unitKey][chapterKey] : [];

      return {
        unitKey,
        unitLabel: formatDisplayKey(unitKey, "Unit"),
        chapterKey,
        chapterLabel: formatDisplayKey(chapterKey, "Chapter"),
        wordCount: words.length,
      };
    });

    return {
      unitKey,
      unitLabel: formatDisplayKey(unitKey, "Unit"),
      chapters,
      totalWords: chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0),
    };
  });
}

function getDefaultSelectedSources() {
  return getContentCatalog().flatMap((unit) =>
    unit.chapters
      .filter((chapter) => chapter.wordCount > 0)
      .map((chapter) => ({
        unitKey: unit.unitKey,
        chapterKey: chapter.chapterKey,
      }))
  );
}

function getVocabPool() {
  if (
    Array.isArray(questionConfig.selectedSources) &&
    questionConfig.selectedSources.length > 0
  ) {
    return questionConfig.selectedSources.flatMap(({ unitKey, chapterKey }) => {
      const chapterWords = vocabData?.[unitKey]?.[chapterKey];
      if (!Array.isArray(chapterWords)) return [];

      return chapterWords.map((word) => ({
        ...word,
        sourceUnit: unitKey,
        sourceChapter: chapterKey,
      }));
    });
  }

  if (
    typeof vocabData === "undefined" ||
    !vocabData ||
    !questionConfig.selectedUnit ||
    !vocabData[questionConfig.selectedUnit]
  ) {
    return [];
  }

  if (questionConfig.contentScope === "unit") {
    const unitData = vocabData[questionConfig.selectedUnit];

    return Object.entries(unitData).flatMap(([chapterKey, words]) =>
      words.map((word) => ({
        ...word,
        sourceUnit: questionConfig.selectedUnit,
        sourceChapter: chapterKey,
      }))
    );
  }

  if (
    !questionConfig.selectedChapter ||
    !vocabData[questionConfig.selectedUnit][questionConfig.selectedChapter]
  ) {
    return [];
  }

  return vocabData[questionConfig.selectedUnit][questionConfig.selectedChapter].map((word) => ({
    ...word,
    sourceUnit: questionConfig.selectedUnit,
    sourceChapter: questionConfig.selectedChapter,
  }));
}

function getSentencePool() {
  if (typeof sentenceData === "undefined" || !sentenceData) {
    return {};
  }

  const vocabPool = getVocabPool();
  const allowedWords = new Set(vocabPool.map((entry) => entry.english));
  const filtered = {};

  Object.keys(sentenceData).forEach((word) => {
    if (allowedWords.has(word)) {
      filtered[word] = sentenceData[word];
    }
  });

  return filtered;
}

/* =========================
   Question generators
   ========================= */

function generateChineseToEnglishQuestion() {
  const pool = getVocabPool();
  if (pool.length < 4) return null;

  const answerEntry = pool[Math.floor(Math.random() * pool.length)];
  const distractors = shuffleArray(
    pool.filter((item) => item.id !== answerEntry.id)
  ).slice(0, 3);

  const choices = shuffleArray([
    answerEntry.english,
    ...distractors.map((item) => item.english),
  ]);

  return {
    type: "multiple-choice",
    subtype: "zh-to-en",
    promptHtml: `What is the English word for <strong>${escapeHtml(answerEntry.chinese)}</strong>?`,
    choices,
    correctAnswer: answerEntry.english,
    source: answerEntry,
  };
}

function generateEnglishToChineseQuestion() {
  const pool = getVocabPool();
  if (pool.length < 4) return null;

  const answerEntry = pool[Math.floor(Math.random() * pool.length)];
  const distractors = shuffleArray(
    pool.filter((item) => item.id !== answerEntry.id)
  ).slice(0, 3);

  const choices = shuffleArray([
    answerEntry.chinese,
    ...distractors.map((item) => item.chinese),
  ]);

  return {
    type: "multiple-choice",
    subtype: "en-to-zh",
    promptHtml: `What is the Chinese meaning of <strong>${escapeHtml(answerEntry.english)}</strong>?`,
    choices,
    correctAnswer: answerEntry.chinese,
    source: answerEntry,
  };
}

function generateClozeQuestion() {
  const vocabPool = getVocabPool();
  const sentencePool = getSentencePool();

  if (vocabPool.length < 4) return null;

  const availableWords = vocabPool.filter((entry) => {
    const sentences = sentencePool[entry.english];
    return Array.isArray(sentences) && sentences.length > 0;
  });

  if (availableWords.length < 4) return null;

  const answerEntry = availableWords[Math.floor(Math.random() * availableWords.length)];
  const sentenceList = sentencePool[answerEntry.english];
  const sentence = sentenceList[Math.floor(Math.random() * sentenceList.length)];

  const distractors = shuffleArray(
    availableWords.filter((item) => item.id !== answerEntry.id)
  ).slice(0, 3);

  const choices = shuffleArray([
    answerEntry.english,
    ...distractors.map((item) => item.english),
  ]);

  return {
    type: "multiple-choice",
    subtype: "cloze",
    promptHtml: `Complete the sentence:<br><strong>${escapeHtml(sentence).replace("_____", "<span class=\"blank\">_____</span>")}</strong>`,
    choices,
    correctAnswer: answerEntry.english,
    source: answerEntry,
  };
}

function generateImageQuestion() {
  const pool = getVocabPool();
  if (pool.length < 4) return null;

  const imageCandidates = pool.filter((entry) => hasQuestionImageAsset(entry));
  if (imageCandidates.length < 4) return null;

  const answerEntry = imageCandidates[Math.floor(Math.random() * imageCandidates.length)];
  const distractors = shuffleArray(
    imageCandidates.filter((item) => item.id !== answerEntry.id)
  ).slice(0, 3);

  const choices = shuffleArray([
    answerEntry.english,
    ...distractors.map((item) => item.english),
  ]);

  return {
    type: "multiple-choice",
    subtype: "image",
    promptHtml: `
      <div class="image-question-card">
        <div class="image-question-stage">
          <img
            src="${getQuestionImagePath(answerEntry)}"
            alt="${escapeHtml(answerEntry.english)}"
            class="image-question-img"
          />
        </div>
      </div>
    `,
    choices,
    correctAnswer: answerEntry.english,
    source: answerEntry,
  };
}

function createChestLockChallenge() {
  const pool = getVocabPool();
  if (!pool.length) return null;

  const imageCandidates = pool.filter((entry) => {
    const answer = String(entry?.english || "").trim().toLowerCase();
    return hasQuestionImageAsset(entry) && /^[a-z]+$/.test(answer) && answer.length >= 3 && answer.length <= 7;
  });

  if (!imageCandidates.length) return null;

  const answerEntry = imageCandidates[Math.floor(Math.random() * imageCandidates.length)];
  const answer = answerEntry.english.trim().toLowerCase();
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

  const wheelLetters = answer.split("").map((letter) => {
    const distractors = shuffleArray(alphabet.filter((candidate) => candidate !== letter)).slice(0, 2);
    return shuffleArray([letter, ...distractors]);
  });

  return {
    type: "chest-lock",
    subtype: "image-spelling-lock",
    promptHtml: "",
    choices: [],
    correctAnswer: answer,
    source: answerEntry,
    answer,
    imagePath: getQuestionImagePath(answerEntry),
    wheelLetters,
  };
}

function generateAutoQuestion() {
  const generators = [];

  if (questionConfig.allowQuestionTypes.zhToEn) {
    generators.push(generateChineseToEnglishQuestion);
  }
  if (questionConfig.allowQuestionTypes.enToZh) {
    generators.push(generateEnglishToChineseQuestion);
  }
  if (questionConfig.allowQuestionTypes.cloze) {
    generators.push(generateClozeQuestion);
  }
  if (questionConfig.allowQuestionTypes.image) {
    generators.push(generateImageQuestion);
  }

  const shuffled = shuffleArray(generators);
  for (const generator of shuffled) {
    const question = generator();
    if (question) return question;
  }

  return null;
}

/* =========================
   Public question flow
   ========================= */

function configureQuestionSystem({
  mode = "auto",
  selectedUnit = null,
  selectedChapter = null,
  selectedSources = null,
  contentScope = "chapter",
  allowQuestionTypes = null,
} = {}) {
  questionConfig.mode = mode;
  questionConfig.selectedUnit = selectedUnit;
  questionConfig.selectedChapter = selectedChapter;
  questionConfig.contentScope = contentScope;
  if (selectedSources !== null) {
    questionConfig.selectedSources = normalizeSelectedSources(selectedSources);
  }

  if (allowQuestionTypes) {
    questionConfig.allowQuestionTypes = {
      ...questionConfig.allowQuestionTypes,
      ...allowQuestionTypes,
    };
  }
}

function beginQuestionContext(context = {}) {
  questionState.currentContext = context;

  if (questionConfig.mode === "manual") {
    questionState.currentQuestion = {
      type: "manual",
      subtype: context.source || "manual",
      promptHtml: context.manualPrompt || "Teacher asks a question.",
      choices: [],
      correctAnswer: null,
      source: null,
    };
    return questionState.currentQuestion;
  }

  questionState.currentQuestion = generateAutoQuestion();
  return questionState.currentQuestion;
}

function getCurrentQuestion() {
  return questionState.currentQuestion;
}

function getCurrentQuestionContext() {
  return questionState.currentContext;
}

function getQuestionConfigSnapshot() {
  return {
    mode: questionConfig.mode,
    selectedUnit: questionConfig.selectedUnit,
    selectedChapter: questionConfig.selectedChapter,
    selectedSources: questionConfig.selectedSources.map((source) => ({ ...source })),
    contentScope: questionConfig.contentScope,
    allowQuestionTypes: {
      ...questionConfig.allowQuestionTypes,
    },
  };
}

function clearCurrentQuestion() {
  questionState.currentQuestion = null;
  questionState.currentContext = null;
}

function checkQuestionAnswer(selectedChoice) {
  const question = questionState.currentQuestion;
  if (!question) {
    return {
      isCorrect: false,
      correctAnswer: null,
      question: null,
      context: questionState.currentContext,
    };
  }

  if (question.type === "manual") {
    return {
      isCorrect: null,
      correctAnswer: null,
      question,
      context: questionState.currentContext,
    };
  }

  const isCorrect = selectedChoice === question.correctAnswer;

  return {
    isCorrect,
    correctAnswer: question.correctAnswer,
    question,
    context: questionState.currentContext,
  };
}

/* =========================
   Rendering helpers
   ========================= */

function renderQuestionPromptHtml(targetEl, question) {
  if (!targetEl) return;

  if (!question) {
    targetEl.innerHTML = `
      <div class="question-message-card">
        <div class="question-kicker">Question</div>
        <div class="question-main-text">No question available.</div>
      </div>
    `;
    return;
  }

  const labels = {
    "zh-to-en": "Translate to English",
    "en-to-zh": "Translate to Chinese",
    cloze: "Complete the Sentence",
    image: "Picture Challenge",
    battle: "Battle Question",
    chest: "Treasure Question",
    door: "Door Challenge",
    manual: "Teacher Prompt",
  };

  const kicker = labels[question.subtype] || "Question";
  const showKicker = question.subtype !== "image";

  targetEl.innerHTML = `
    <div class="question-message-card ${question.subtype === "image" ? "has-image" : ""}">
      ${showKicker ? `<div class="question-kicker">${escapeHtml(kicker)}</div>` : ""}
      <div class="question-main-text">${question.promptHtml}</div>
    </div>
  `;
}

function renderQuestionChoices(targetEl, question, onChoiceClick) {
  if (!targetEl) return;

  if (!question) {
    targetEl.innerHTML = "";
    return;
  }

  if (question.type === "manual") {
    targetEl.innerHTML = `
      <button class="answer-btn manual-result-btn" data-manual-result="correct">Correct</button>
      <button class="answer-btn manual-result-btn" data-manual-result="wrong">Wrong</button>
    `;

    targetEl.querySelectorAll("[data-manual-result]").forEach((button) => {
      button.addEventListener("click", () => {
        const result = button.dataset.manualResult;
        onChoiceClick?.(result);
      });
    });

    return;
  }

  if (question.type === "multiple-choice") {
    targetEl.innerHTML = question.choices
      .map(
        (choice) => `
          <button class="answer-btn question-choice" data-choice="${escapeHtml(choice)}">
            ${escapeHtml(choice)}
          </button>
        `
      )
      .join("");

    targetEl.querySelectorAll(".question-choice").forEach((button) => {
      button.addEventListener("click", () => {
        onChoiceClick?.(button.dataset.choice);
      });
    });

    return;
  }

  targetEl.innerHTML = "";
}

function eliminateWrongChoices(count = 2) {
  const question = questionState.currentQuestion;
  if (!question || question.type !== "multiple-choice" || !Array.isArray(question.choices)) {
    return false;
  }

  const wrongChoices = question.choices.filter((choice) => choice !== question.correctAnswer);
  if (!wrongChoices.length) return false;

  const keepWrongChoices = shuffleArray(wrongChoices).slice(0, Math.max(0, wrongChoices.length - count));
  const nextChoices = shuffleArray([question.correctAnswer, ...keepWrongChoices]);

  if (nextChoices.length === question.choices.length) {
    return false;
  }

  questionState.currentQuestion = {
    ...question,
    choices: nextChoices,
  };

  return true;
}

/* =========================
   Suggested integration hooks
   ========================= */

function startBattleQuestion() {
  return beginQuestionContext({
    source: "battle",
    manualPrompt: "Battle! Teacher asks a question. Correct = damage monster. Wrong = damage hero.",
  });
}

function startChestQuestion() {
  return beginQuestionContext({
    source: "chest",
    manualPrompt: "Chest! Teacher asks a question. Correct = get treasure.",
  });
}

function startDoorQuestion() {
  return beginQuestionContext({
    source: "door",
    manualPrompt: "Door challenge! Teacher asks a question. Correct = proceed safely.",
  });
}
