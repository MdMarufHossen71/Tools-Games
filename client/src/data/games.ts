import { Gamepad2, Grid2X2, Keyboard, Trophy } from "lucide-react";

export type Game = { name: string; slug: string; genre: string; genreBn: string; description: { bn: string; en: string }; controls: string; featured?: boolean; icon: typeof Gamepad2 };
const makeSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const raw: Array<[string, string, string, string]> = [
  ["Snake", "Arcade", "আর্কেড", "খাবার খেয়ে বড় হন, দেয়াল ও নিজের শরীর এড়িয়ে চলুন।"],
  ["Tetris", "Puzzle", "পাজল", "লাইন পূর্ণ করুন, স্তর বাড়ার সঙ্গে গতি সামলান।"],
  ["2048", "Puzzle", "পাজল", "একই সংখ্যার টাইল মিলিয়ে 2048 ছুঁয়ে ফেলুন।"],
  ["Sky Hopper", "Arcade", "আর্কেড", "ট্যাপে ডানা ঝাপটান আর বাধা পেরিয়ে যান।"],
  ["Brick Breaker", "Arcade", "আর্কেড", "প্যাডেল দিয়ে বল ফিরিয়ে সব ইট ভাঙুন।"],
  ["Space Defenders", "Shooter", "শুটার", "ঢেউয়ের পর ঢেউ মহাকাশ আক্রমণ ঠেকান।"],
  ["Dino Dash", "Runner", "রানার", "লাফান, ঝুঁকুন এবং মরুভূমির গতি সামলান।"],
  ["Fruit Merge", "Puzzle", "পাজল", "ফল ফেলুন, মিলান, আর বড় ফল তৈরি করুন।"],
  ["Asteroids", "Shooter", "শুটার", "ঘুরুন, থ্রাস্ট দিন এবং গ্রহাণু ভাঙুন।"],
  ["Maze Chaser", "Arcade", "আর্কেড", "বিন্দু সংগ্রহ করুন, পথ খুঁজুন, শিকারি এড়িয়ে যান।"],
  ["Minesweeper", "Logic", "লজিক", "ইঙ্গিত দেখে নিরাপদ ঘর খুলুন, মাইন চিহ্নিত করুন।"],
  ["Sudoku", "Logic", "লজিক", "সংখ্যার যুক্তিতে গ্রিড পূর্ণ করুন।"],
  ["15 Puzzle", "Puzzle", "পাজল", "টাইল সরিয়ে ছবির বা সংখ্যার ক্রম ফেরান।"],
  ["Memory Match", "Memory", "মেমোরি", "জোড়ার অবস্থান মনে রাখুন এবং মিলান।"],
  ["Tic Tac Toe", "Board", "বোর্ড", "বন্ধু অথবা কৌশলী AI-এর সঙ্গে খেলুন।"],
  ["Connect Four", "Board", "বোর্ড", "চারটি ডিস্ক এক লাইনে সাজান।"],
  ["Checkers", "Board", "বোর্ড", "ক্লাসিক দুই খেলোয়াড়ের ড্রাফটস।"],
  ["Hangman", "Word", "শব্দ", "অক্ষর অনুমান করে শব্দ উদ্ধার করুন।"],
  ["Word Grid", "Word", "শব্দ", "পাঁচ অক্ষরের শব্দ খুঁজুন এবং ইঙ্গিত ব্যবহার করুন।"],
  ["Word Search", "Word", "শব্দ", "লুকানো শব্দ খুঁজতে গ্রিডে আঙুল টানুন।"],
  ["Anagram Sprint", "Word", "শব্দ", "এলোমেলো অক্ষর সাজিয়ে শব্দ গড়ুন।"],
  ["Geo Quiz", "Quiz", "কুইজ", "পতাকা, রাজধানী ও দেশের দ্রুত কুইজ।"],
  ["Math Sprint", "Quiz", "কুইজ", "সময় শেষ হওয়ার আগে হিসাব করুন।"],
  ["Water Sort", "Puzzle", "পাজল", "রঙ আলাদা করে প্রতিটি টিউব সাজান।"],
  ["Block Fit", "Puzzle", "পাজল", "বোর্ডে আকার বসান, সারি খালি করুন।"],
  ["Tower Guard", "Strategy", "কৌশল", "পথের ধারে টাওয়ার বসিয়ে ঢেউ থামান।"],
  ["Idle Workshop", "Strategy", "কৌশল", "ক্লিক, আপগ্রেড ও লোকাল প্রগ্রেশনের মিনি টাইcoon।"],
  ["Hill Rider", "Physics", "ফিজিক্স", "ঢালু পথে ভারসাম্য রেখে রাইড করুন।"],
  ["Maze Runner", "Maze", "মেইজ", "নিজের পথ খুঁজুন অথবা সলভার দেখুন।"],
  ["Territory Loop", "Action", "অ্যাকশন", "AI প্রতিপক্ষের বিরুদ্ধে নিজের জায়গা ঘিরে নিন।"],
  ["Pocket Pool", "Physics", "ফিজিক্স", "বল পকেটে ফেলুন, কিউয়ের কোণ ঠিক করুন।"],
  ["Type Blaster", "Typing", "টাইপিং", "ঝরে পড়া শব্দ টাইপ করে সরিয়ে দিন।"],
];

export const gameRegistry: Game[] = raw.map(([name, genre, genreBn, bn], index) => ({
  name, slug: makeSlug(name), genre, genreBn, controls: "Keyboard / Touch", featured: index < 8,
  description: { bn, en: `${name} is an original, local-first browser mini game.` },
  icon: index % 3 === 0 ? Trophy : index % 3 === 1 ? Grid2X2 : Keyboard,
}));

export const gameGenres = Array.from(new Set(gameRegistry.map((game) => game.genre)));
export const findGame = (slug: string) => gameRegistry.find((game) => game.slug === slug);
