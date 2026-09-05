import { Gamepad2, Grid2X2, Keyboard, Trophy } from "lucide-react";

/**
 * Game catalogue.
 *
 * Each row carries its own Bangla and English description. The English side used to
 * be generated from a single template — `"<name> is an original, local-first browser
 * mini game."` — so all thirty-two cards read identically to an English visitor and
 * the genre chip was the only thing telling them apart.
 *
 * A `controls` field was also stored on every game and never read by any component,
 * so it has been removed rather than left as a value that looks authoritative and
 * has no effect.
 */
export type Game = { name: string; slug: string; genre: string; genreBn: string; description: { bn: string; en: string }; featured?: boolean; icon: typeof Gamepad2 };
const makeSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const raw: Array<[name: string, genre: string, genreBn: string, bn: string, en: string]> = [
  ["Snake", "Arcade", "আর্কেড", "খাবার খেয়ে বড় হন, দেয়াল ও নিজের শরীর এড়িয়ে চলুন।", "Eat to grow longer while avoiding the walls and your own tail."],
  ["Tetris", "Puzzle", "পাজল", "লাইন পূর্ণ করুন, স্তর বাড়ার সঙ্গে গতি সামলান।", "Clear full lines and keep up as the drop speed climbs each level."],
  ["2048", "Puzzle", "পাজল", "একই সংখ্যার টাইল মিলিয়ে 2048 ছুঁয়ে ফেলুন।", "Slide and merge matching tiles to reach the 2048 tile."],
  ["Sky Hopper", "Arcade", "আর্কেড", "ট্যাপে ডানা ঝাপটান আর বাধা পেরিয়ে যান।", "Tap to flap and thread the gaps between oncoming obstacles."],
  ["Brick Breaker", "Arcade", "আর্কেড", "প্যাডেল দিয়ে বল ফিরিয়ে সব ইট ভাঙুন।", "Angle the paddle to return the ball and clear every brick."],
  ["Space Defenders", "Shooter", "শুটার", "ঢেউয়ের পর ঢেউ মহাকাশ আক্রমণ ঠেকান।", "Hold the line against wave after wave of descending invaders."],
  ["Dino Dash", "Runner", "রানার", "লাফান, ঝুঁকুন এবং মরুভূমির গতি সামলান।", "Jump and duck through a desert run that keeps accelerating."],
  ["Fruit Merge", "Puzzle", "পাজল", "ফল ফেলুন, মিলান, আর বড় ফল তৈরি করুন।", "Drop fruit into the jar and merge matching pairs into larger ones."],
  ["Asteroids", "Shooter", "শুটার", "ঘুরুন, থ্রাস্ট দিন এবং গ্রহাণু ভাঙুন।", "Rotate, thrust and break drifting asteroids into smaller fragments."],
  ["Maze Chaser", "Arcade", "আর্কেড", "বিন্দু সংগ্রহ করুন, পথ খুঁজুন, শিকারি এড়িয়ে যান।", "Collect every dot and learn the routes before the hunters corner you."],
  ["Minesweeper", "Logic", "লজিক", "ইঙ্গিত দেখে নিরাপদ ঘর খুলুন, মাইন চিহ্নিত করুন।", "Read the number clues to open safe squares and flag the mines."],
  ["Sudoku", "Logic", "লজিক", "সংখ্যার যুক্তিতে গ্রিড পূর্ণ করুন।", "Fill the grid so every row, column and box holds one to nine."],
  ["15 Puzzle", "Puzzle", "পাজল", "টাইল সরিয়ে ছবির বা সংখ্যার ক্রম ফেরান।", "Slide tiles one at a time to restore the numbered order."],
  ["Memory Match", "Memory", "মেমোরি", "জোড়ার অবস্থান মনে রাখুন এবং মিলান।", "Remember where each card sits and turn the pairs up together."],
  ["Tic Tac Toe", "Board", "বোর্ড", "বন্ধু অথবা কৌশলী AI-এর সঙ্গে খেলুন।", "Play a friend on one device, or a computer that does not miss a fork."],
  ["Connect Four", "Board", "বোর্ড", "চারটি ডিস্ক এক লাইনে সাজান।", "Drop discs to line up four before your opponent does."],
  ["Checkers", "Board", "বোর্ড", "ক্লাসিক দুই খেলোয়াড়ের ড্রাফটস।", "Classic two-player draughts with forced captures and kings."],
  ["Hangman", "Word", "শব্দ", "অক্ষর অনুমান করে শব্দ উদ্ধার করুন।", "Guess letters to recover the hidden word before the guesses run out."],
  ["Word Grid", "Word", "শব্দ", "পাঁচ অক্ষরের শব্দ খুঁজুন এবং ইঙ্গিত ব্যবহার করুন।", "Find the five-letter word in six tries, using the colour clues."],
  ["Word Search", "Word", "শব্দ", "লুকানো শব্দ খুঁজতে গ্রিডে আঙুল টানুন।", "Drag across the grid to trace hidden words in any direction."],
  ["Anagram Sprint", "Word", "শব্দ", "এলোমেলো অক্ষর সাজিয়ে শব্দ গড়ুন।", "Rearrange a jumble of letters into real words against the clock."],
  ["Geo Quiz", "Quiz", "কুইজ", "পতাকা, রাজধানী ও দেশের দ্রুত কুইজ।", "Quick rounds on flags, capitals and countries."],
  ["Math Sprint", "Quiz", "কুইজ", "সময় শেষ হওয়ার আগে হিসাব করুন।", "Answer as many arithmetic problems as you can before time expires."],
  ["Water Sort", "Puzzle", "পাজল", "রঙ আলাদা করে প্রতিটি টিউব সাজান।", "Pour between tubes until each one holds a single colour."],
  ["Block Fit", "Puzzle", "পাজল", "বোর্ডে আকার বসান, সারি খালি করুন।", "Place the offered shapes on the board and clear rows and columns."],
  ["Tower Guard", "Strategy", "কৌশল", "পথের ধারে টাওয়ার বসিয়ে ঢেউ থামান।", "Position towers along the path and stop each wave before it gets through."],
  ["Idle Workshop", "Strategy", "কৌশল", "ক্লিক, আপগ্রেড আর লোকাল প্রগ্রেশনের মিনি টাইকুন।", "A small idle tycoon: click, buy upgrades, and pick up where you left off."],
  ["Hill Rider", "Physics", "ফিজিক্স", "ঢালু পথে ভারসাম্য রেখে রাইড করুন।", "Balance throttle and brake to ride rolling hills without tipping."],
  ["Maze Runner", "Maze", "মেইজ", "নিজের পথ খুঁজুন অথবা সলভার দেখুন।", "Find your own way out, or watch the solver trace the shortest path."],
  ["Territory Loop", "Action", "অ্যাকশন", "AI প্রতিপক্ষের বিরুদ্ধে নিজের জায়গা ঘিরে নিন।", "Claim territory by closing loops before the AI rivals cut you off."],
  ["Pocket Pool", "Physics", "ফিজিক্স", "বল পকেটে ফেলুন, কিউয়ের কোণ ঠিক করুন।", "Line up the cue angle and sink balls on a compact table."],
  ["Type Blaster", "Typing", "টাইপিং", "ঝরে পড়া শব্দ টাইপ করে সরিয়ে দিন।", "Type the falling words to clear them before they reach the floor."],
];

export const gameRegistry: Game[] = raw.map(([name, genre, genreBn, bn, en], index) => ({
  name, slug: makeSlug(name), genre, genreBn, featured: index < 8,
  description: { bn, en },
  icon: index % 3 === 0 ? Trophy : index % 3 === 1 ? Grid2X2 : Keyboard,
}));

export const gameGenres = Array.from(new Set(gameRegistry.map((game) => game.genre)));
export const findGame = (slug: string) => gameRegistry.find((game) => game.slug === slug);
