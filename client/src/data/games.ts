export type GameCategory = "puzzle" | "arcade" | "words" | "casual" | "multiplayer";
export type GameLocale = "en" | "bn" | "hi" | "ur" | "ar" | "es" | "fr" | "de";

export type GameDefinition = {
  slug: string;
  name: string;
  category: GameCategory;
  description: Record<GameLocale, string>;
  playable: boolean;
  multiplayer: boolean;
  controls: "keyboard" | "pointer" | "both";
};

const categoryDescriptions: Record<GameLocale, Record<GameCategory, string>> = {
  en: { puzzle: "A focused browser puzzle for quick thinking.", arcade: "Fast arcade action built for the browser.", words: "A word challenge for a quick mental workout.", casual: "A relaxed game for a short break.", multiplayer: "A social strategy game for friendly competition." },
  bn: { puzzle: "দ্রুত ভাবনার জন্য একটি ব্রাউজার ধাঁধা।", arcade: "ব্রাউজারের জন্য তৈরি দ্রুত আর্কেড অ্যাকশন।", words: "দ্রুত মস্তিষ্কচর্চার জন্য শব্দের চ্যালেঞ্জ।", casual: "ছোট বিরতির জন্য আরামদায়ক গেম।", multiplayer: "বন্ধুত্বপূর্ণ প্রতিযোগিতার সামাজিক কৌশলের গেম।" },
  hi: { puzzle: "तेज़ सोच के लिए एक ब्राउज़र पहेली।", arcade: "ब्राउज़र के लिए तेज़ आर्केड एक्शन।", words: "मानसिक अभ्यास के लिए शब्द चुनौती।", casual: "छोटे विश्राम के लिए आरामदायक खेल।", multiplayer: "मित्रवत प्रतिस्पर्धा के लिए सामाजिक रणनीति खेल।" },
  ur: { puzzle: "تیز سوچ کے لیے براؤزر پہیلی۔", arcade: "براؤزر کے لیے تیز آرکیڈ ایکشن۔", words: "ذہنی مشق کے لیے الفاظ کا چیلنج۔", casual: "مختصر وقفے کے لیے آرام دہ گیم۔", multiplayer: "دوستانہ مقابلے کے لیے سماجی حکمت عملی گیم۔" },
  ar: { puzzle: "لغز متصفح للتفكير السريع.", arcade: "حركة أركيد سريعة صُنعت للمتصفح.", words: "تحدي كلمات لتمرين ذهني سريع.", casual: "لعبة هادئة لاستراحة قصيرة.", multiplayer: "لعبة استراتيجية اجتماعية لمنافسة ودية." },
  es: { puzzle: "Un rompecabezas de navegador para pensar con rapidez.", arcade: "Acción arcade rápida creada para el navegador.", words: "Un desafío de palabras para ejercitar la mente.", casual: "Un juego relajado para una pausa breve.", multiplayer: "Un juego social de estrategia para competir amistosamente." },
  fr: { puzzle: "Un puzzle de navigateur pour réfléchir vite.", arcade: "De l'action arcade rapide conçue pour le navigateur.", words: "Un défi de mots pour exercer rapidement l'esprit.", casual: "Un jeu détendu pour une courte pause.", multiplayer: "Un jeu de stratégie sociale pour une compétition amicale." },
  de: { puzzle: "Ein Browser-Rätsel für schnelles Denken.", arcade: "Rasante Arcade-Action für den Browser.", words: "Eine Wortaufgabe für ein schnelles Denktraining.", casual: "Ein entspanntes Spiel für eine kurze Pause.", multiplayer: "Ein soziales Strategiespiel für freundlichen Wettbewerb." },
};

function game(slug: string, name: string, category: GameCategory, playable = false, multiplayer = false, controls: GameDefinition["controls"] = "both"): GameDefinition {
  return {
    slug, name, category, playable, multiplayer, controls,
    description: Object.fromEntries((Object.keys(categoryDescriptions) as GameLocale[]).map((locale) => [locale, categoryDescriptions[locale][category]])) as Record<GameLocale, string>,
  };
}

export const games: GameDefinition[] = [
  game("wordle", "Wordle", "words", true), game("word-sprint", "Word Sprint", "words", true), game("spelling-bee", "Spelling Bee", "words"), game("anagram", "Anagram", "words", true), game("word-search", "Word Search", "words"), game("hangman", "Hangman", "words", true), game("typing-race", "Typing Race", "words"), game("letter-stack", "Letter Stack", "words"),
  game("2048", "2048", "puzzle", true), game("sudoku", "Sudoku", "puzzle", true), game("minesweeper", "Minesweeper", "puzzle", true), game("memory-match", "Memory Match", "puzzle", true), game("sliding-puzzle", "Sliding Puzzle", "puzzle", true), game("block-puzzle", "Block Puzzle", "puzzle"), game("color-flow", "Color Flow", "puzzle", true), game("number-merge", "Number Merge", "puzzle"), game("match-three", "Match Three", "puzzle"), game("maze-runner", "Maze Runner", "puzzle"),
  game("snake", "Snake", "arcade", true), game("tetris", "Tetris", "arcade", true), game("breakout", "Breakout", "arcade", true), game("flappy-flight", "Flappy Flight", "arcade", true), game("space-dodge", "Space Dodge", "arcade", true), game("asteroid-dash", "Asteroid Dash", "arcade"), game("bubble-pop", "Bubble Pop", "arcade", true), game("fruit-slice", "Fruit Slice", "arcade", true), game("whack-a-mole", "Whack-a-Mole", "arcade", true), game("neon-runner", "Neon Runner", "arcade"),
  game("tic-tac-toe", "Tic Tac Toe", "multiplayer", true, true), game("connect-four", "Connect Four", "multiplayer", false, true), game("checkers", "Checkers", "multiplayer"), game("chess-lite", "Chess Lite", "multiplayer"), game("reversi", "Reversi", "multiplayer"), game("battleship", "Battleship", "multiplayer"), game("dominoes", "Dominoes", "multiplayer"), game("ludo", "Ludo", "multiplayer"), game("solitaire", "Solitaire", "multiplayer"),
  game("idle-garden", "Idle Garden", "casual"), game("cozy-cafe", "Cozy Café", "casual"), game("farm-days", "Farm Days", "casual"), game("fishing-trip", "Fishing Trip", "casual"), game("cookie-clicker", "Cookie Clicker", "casual", true), game("tower-defense", "Tower Defense", "casual"), game("dice-quest", "Dice Quest", "casual"), game("paper-plane", "Paper Plane", "casual"),
];

export const playableGames = games.filter((item) => item.playable);
export const gameBySlug = (slug: string) => games.find((item) => item.slug === slug);
