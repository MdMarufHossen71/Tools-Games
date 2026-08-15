export type BlogSeed = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  language: string;
  categories: string[];
  tags: string[];
  isFeatured: boolean;
  isPinnedHome: boolean;
  readingMinutes: number;
  publishedAt: Date;
  metaTitle: string;
  metaDescription: string;
};

export const blogSeeds: BlogSeed[] = [
  {
    title: "১০টি Essential Browser Tools যা আপনার কাজ দ্রুত করবে",
    slug: "essential-browser-tools-for-faster-work",
    excerpt: "দৈনন্দিন কাজকে দ্রুত, নিরাপদ এবং সহজ করতে ToolsHUB-এর দশটি ব্রাউজার টুলের ব্যবহারিক তালিকা।",
    language: "bn",
    categories: ["Tools & Tips", "Productivity"],
    tags: ["browser tools", "productivity", "ToolsHUB"],
    isFeatured: true,
    isPinnedHome: true,
    readingMinutes: 5,
    publishedAt: new Date("2026-08-12T06:00:00Z"),
    metaTitle: "১০টি Essential Browser Tools যা আপনার কাজ দ্রুত করবে | ToolsHUB",
    metaDescription: "কাজ দ্রুত করতে ToolsHUB-এর প্রয়োজনীয় ব্রাউজার টুলগুলোর ব্যবহারিক গাইড।",
    content: `কাজের গতি বাড়াতে সব সময় নতুন অ্যাপ ইনস্টল করার দরকার নেই। অনেক সাধারণ কাজ নিরাপদভাবে ব্রাউজারেই করা যায়—বিশেষ করে যখন টুলটি আপনার ফাইল বা লেখা অপ্রয়োজনে সার্ভারে পাঠায় না।

## ১. JSON Formatter

API response বা config file পড়তে কষ্ট হলে [JSON Formatter](/tools/json-formatter) ব্যবহার করুন। এটি nested data সুন্দরভাবে সাজিয়ে দেয়, ফলে ভুল bracket বা key সহজে ধরা যায়।

## ২. Text Case Converter

একই headline, email subject, বা code label বারবার ঠিক করতে সময় নষ্ট হয়। [Text Case Converter](/tools/text-case-converter) দিয়ে sentence case, title case এবং UPPERCASE দ্রুত বদলান।

## ৩. Word Counter

Assignment, proposal বা social caption-এর word limit মানতে [Word Counter](/tools/word-counter) কাজে লাগে। লেখার সাথে সাথে word, character ও line count দেখা যায়।

## ৪. Color Converter

Design brief-এ HEX, RGB ও HSL একসাথে আসে। [Color Converter](/tools/color-converter) এই formatগুলোর মধ্যে দ্রুত রূপান্তর করে এবং contrast ভাবতে সাহায্য করে।

## ৫. Password Generator

একই password একাধিক জায়গায় ব্যবহার করা ঝুঁকিপূর্ণ। [Password Generator](/tools/password-generator) দিয়ে প্রতিটি account-এর জন্য আলাদা দীর্ঘ password তৈরি করুন এবং password manager-এ রাখুন।

## ৬. Base64 Encoder/Decoder

ছোট data string যাচাই বা decode করার জন্য [Base64 Tool](/tools/base64-encoder) সহায়ক। তবে মনে রাখবেন, Base64 encryption নয়।

## ৭. QR Code Generator

Wi-Fi, portfolio, event link বা payment page ভাগ করতে [QR Code Generator](/tools/qr-code-generator) ব্যবহার করুন। প্রকাশের আগে অবশ্যই QR scan করে লিংকটি পরীক্ষা করুন।

## ৮. Unit Converter

Design dimension, recipe বা client specification-এ একক বদলাতে [Unit Converter](/tools/unit-converter) ব্যবহার করুন। এতে manual calculation-এর ভুল কমে।

## ৯. Timestamp Converter

Server log-এর Unix timestamp মানুষের পড়ার মতো date/time-এ দেখতে [Timestamp Converter](/tools/timestamp-converter) খুলুন। সময় অঞ্চল মিলিয়ে দেখাই ভালো অভ্যাস।

## ১০. URL Encoder

Query parameter ভেঙে গেলে [URL Encoder](/tools/url-encoder) special character নিরাপদভাবে encode করতে পারে।

> প্রতিটি কাজের আগে ভাবুন: data কি সংবেদনশীল? সংবেদনশীল হলে শুধুমাত্র local processing হওয়া টুল ব্যবহার করুন এবং অপ্রয়োজনীয় তথ্য paste করবেন না।

ToolsHUB-এ আপনার দরকারি tool পেতে [Tools directory](/tools) ঘুরে দেখুন।`,
  },
  {
    title: "কীভাবে ছোট্ট লিংকে বড়ো ফাইল শেয়ার করবেন — step by step",
    slug: "share-large-files-with-a-small-link",
    excerpt: "Expiry, password এবং download limit ব্যবহার করে বড়ো ফাইল নিরাপদভাবে শেয়ার করার ধাপে ধাপে নির্দেশিকা।",
    language: "bn",
    categories: ["How-to Guides", "Tools & Tips"],
    tags: ["file sharing", "privacy", "guide"],
    isFeatured: true,
    isPinnedHome: true,
    readingMinutes: 4,
    publishedAt: new Date("2026-08-10T06:00:00Z"),
    metaTitle: "বড়ো ফাইল নিরাপদে শেয়ার করার step-by-step গাইড | ToolsHUB",
    metaDescription: "Password, expiry ও download limit দিয়ে বড়ো ফাইল শেয়ার করার সহজ গাইড।",
    content: `বড়ো file email attachment হিসেবে পাঠালে size limit, version confusion এবং ভুল recipient-এর ঝুঁকি থাকে। একটি controlled share link এই সমস্যাগুলো কমায়।

## ধাপ ১: File Share খুলুন

ToolsHUB-এর **File Share** থেকে ফাইল বেছে নিন। Upload-এর আগে file name-এ ব্যক্তিগত তথ্য আছে কি না দেখে নিন।

## ধাপ ২: একটি expiry ঠিক করুন

যে সময় পর্যন্ত recipient-এর file দরকার, তার একটু বেশি সময় দিন—যেমন ২৪ ঘণ্টা বা ৭ দিন। কাজ শেষ হলে link নিজে থেকেই নিষ্ক্রিয় হওয়া উচিত।

## ধাপ ৩: Password দিন

সংবেদনশীল document, ID copy, contract বা client export হলে একটি আলাদা password ব্যবহার করুন। Link এবং password একই chat message-এ পাঠাবেন না।

## ধাপ ৪: Download limit বসান

একজন recipient-এর জন্য ১ বা ২ download সাধারণত যথেষ্ট। সীমা থাকলে link forwarding-এর ক্ষতি কমে।

## ধাপ ৫: আলাদা channel-এ পাঠান

Link email-এ পাঠালে password ফোন call বা trusted messenger-এ পাঠান। এটি perfect security নয়, কিন্তু ভুল হাতে পড়ার সম্ভাবনা কমায়।

## ধাপ ৬: Delivery যাচাই করুন

Recipient download করতে পেরেছে নিশ্চিত হওয়ার পর shareটি revoke করুন, বা expiry পর্যন্ত অপেক্ষা করুন। কোনো file পাঠানো হয়েছে তার নিজের একটি record রাখুন।

### ছোট checklist

| প্রশ্ন | পাঠানোর আগে উত্তর |
| --- | --- |
| Fileটি কি সত্যিই দরকার? | হ্যাঁ / না |
| Expiry আছে? | হ্যাঁ / না |
| Password আলাদা channel-এ যাবে? | হ্যাঁ / না |
| ভুল file upload হয়েছে? | আবার যাচাই করুন |

নিরাপদ file sharing হলো কম access দেওয়া, কম সময় access রাখা এবং কাজ শেষে access বন্ধ করা।`,
  },
  {
    title: "Best Free Online Tools 2026 — Developer Edition",
    slug: "best-free-online-tools-2026-developer-edition",
    excerpt: "A practical developer toolkit for formatting data, inspecting requests, generating snippets, and reducing context switching.",
    language: "en",
    categories: ["Developer", "Tools & Tips"],
    tags: ["developers", "web tools", "2026"],
    isFeatured: true,
    isPinnedHome: true,
    readingMinutes: 6,
    publishedAt: new Date("2026-08-08T06:00:00Z"),
    metaTitle: "Best Free Online Tools 2026 — Developer Edition | ToolsHUB",
    metaDescription: "A focused collection of free online tools for modern web developers in 2026.",
    content: `A strong developer toolkit reduces context switching. The best free online tools are not necessarily the largest platforms; they are the small utilities that remove friction in the minute between identifying a problem and fixing it.

## Format before you debug

Start with a reliable [JSON Formatter](/tools/json-formatter). Indentation makes missing fields, duplicated keys, and unexpected array structures visible. Pair it with a **Base64 Decoder** when investigating encoded webhook payloads.

## Keep URL work deterministic

Use a **URL Encoder** whenever query parameters include spaces, ampersands, non-Latin text, or JSON fragments. Encoding is not an afterthought: it prevents a valid value from becoming an invalid request.

## Convert time deliberately

Distributed systems log in UTC, but incident reports often need a local explanation. A **Timestamp Converter** lets you check both representations before telling a teammate that a job ran “late.”

## Generate small assets quickly

QR codes are useful for staging demos, device testing, and temporary handoff links. A simple generator is faster than writing a throwaway script, as long as you scan the resulting code before sharing it.

## Use browser tools with a privacy model

For secrets, customer payloads, and unredacted logs, prefer tools that clearly state that processing stays in your browser. Never paste production credentials into a formatter simply because it is convenient.

### A lightweight workflow

1. Format the input.
2. Remove tokens and personal data.
3. Decode or convert only what you need.
4. Keep the final output in your project documentation.

The [ToolsHUB directory](/tools) is organized so you can search by outcome instead of memorizing a dozen separate sites.`,
  },
  {
    title: "AI Tools কীভাবে শিক্ষার কাজে ব্যবহার করবেন",
    slug: "how-to-use-ai-tools-for-learning",
    excerpt: "AI-কে shortcut নয়, চিন্তাভাবনা ও অনুশীলনের সহকারী হিসেবে ব্যবহার করার বাস্তব কৌশল।",
    language: "bn",
    categories: ["AI", "Education"],
    tags: ["AI learning", "students", "study skills"],
    isFeatured: false,
    isPinnedHome: false,
    readingMinutes: 5,
    publishedAt: new Date("2026-08-06T06:00:00Z"),
    metaTitle: "AI Tools কীভাবে শিক্ষার কাজে ব্যবহার করবেন | ToolsHUB",
    metaDescription: "শেখা, practice এবং feedback-এর জন্য দায়িত্বশীলভাবে AI tool ব্যবহারের গাইড।",
    content: `AI tool সবচেয়ে ভালো কাজ করে যখন সেটি আপনার হয়ে চিন্তা না করে, **আপনার চিন্তাকে দৃশ্যমান** করে। Assignment-এর উত্তর কপি করা শেখা নয়; নিজের প্রশ্ন, draft এবং ভুল নিয়ে কাজ করা শেখা।

## ধারণা বুঝতে প্রশ্ন করুন

ToolsHUB AI Suite-এ কোনো topic দিয়ে বলুন: “এটি class 9-এর ভাষায় ব্যাখ্যা করো” অথবা “একটি real-life analogy দাও।” তারপর নিজের ভাষায় একটি তিন লাইনের summary লিখুন।

## Practice তৈরি করুন

একটি chapter শেষ করে বলুন: “এই topic থেকে পাঁচটি short question তৈরি করো; উত্তর এখন দিও না।” নিজের উত্তর দেওয়ার পর AI দিয়ে explanation যাচাই করুন।

## Feedback নিন, replacement নয়

নিজের essay বা code paste করার আগে personal information সরান। এরপর specific question করুন: “আমার যুক্তির দুর্বল জায়গা কোথায়?” “এই function-এর edge case কী?”

## Source যাচাই করুন

AI ভুল তথ্য দিতে পারে বা confidence-এর সাথে অসম্পূর্ণ উত্তর দিতে পারে। গুরুত্বপূর্ণ তথ্য textbook, শিক্ষক, official document বা credible source থেকে মিলিয়ে নিন।

## একটি ভালো prompt-এর গঠন

> আমি [স্তর]-এর শিক্ষার্থী। [বিষয়] নিয়ে আমার [কাজ] আছে। আগে আমাকে তিনটি guiding question দাও, তারপর আমার উত্তরের ভিত্তিতে feedback দাও।

AI-কে calculator, tutor এবং editor—এই তিনটি role-এর মতো ব্যবহার করুন; authority বা answer key-এর মতো নয়।`,
  },
  {
    title: "৫টি মোবাইল App যা আপনার productivity দ্বিগুণ করবে",
    slug: "five-mobile-apps-for-better-productivity",
    excerpt: "Task, focus, notes, files এবং habit—এই পাঁচ কাজের জন্য একটি সহজ mobile productivity stack।",
    language: "bn",
    categories: ["App Reviews", "Productivity"],
    tags: ["mobile apps", "productivity", "focus"],
    isFeatured: false,
    isPinnedHome: false,
    readingMinutes: 4,
    publishedAt: new Date("2026-08-04T06:00:00Z"),
    metaTitle: "৫টি মোবাইল App যা আপনার productivity দ্বিগুণ করবে | ToolsHUB",
    metaDescription: "Task, focus, notes, files ও habit-এর জন্য একটি সহজ mobile productivity stack।",
    content: `Productivity app বেশি হলে productivity কমেও যেতে পারে। লক্ষ্য হওয়া উচিত একটি **ছোট, নির্ভরযোগ্য system**—যেখানে কাজ capture করা, মনোযোগ দেওয়া এবং পরে খুঁজে পাওয়া সহজ।

## ১. একটি task manager

যে app-এ দ্রুত inbox-এ task ঢোকানো যায়, সেটিই যথেষ্ট। প্রতিদিন সকালে শুধু আজকের তিনটি গুরুত্বপূর্ণ কাজ আলাদা করুন।

## ২. একটি calendar

সময় ছাড়া task শুধু ইচ্ছা। পড়াশোনা, deep work, meeting এবং বিশ্রামের জন্য ছোট time block রাখুন। Calendar-এ ফাঁকা জায়গাও দরকার।

## ৩. একটি note app

দ্রুত idea, lecture note এবং meeting decision লিখে রাখুন। ToolsHUB **Notes**-এ folder, tag এবং search ব্যবহার করলে পরে খুঁজে পাওয়া সহজ হয়।

## ৪. একটি focus timer

২৫ মিনিট কাজ, ৫ মিনিট বিরতি—এই সহজ rhythm দিয়ে শুরু করতে পারেন। Timer-এর উদ্দেশ্য চাপ দেওয়া নয়; কাজ শুরু করা সহজ করা।

## ৫. একটি secure file space

বড়ো file বা final export email-এ জমিয়ে না রেখে expiry-সহ share link ব্যবহার করুন। এতে inbox পরিষ্কার থাকে এবং access নিয়ন্ত্রণ করা যায়।

### মনে রাখবেন

App বদলানোর আগে workflow বদলান। এক সপ্তাহ একই system ব্যবহার করুন, তারপর কোন ধাপে বাধা হচ্ছে তা দেখুন। সবচেয়ে ভালো app হলো যে app আপনি নিয়মিত ব্যবহার করেন।`,
  },
  {
    title: "Safe Online থাকার ৭টি নিয়ম",
    slug: "seven-rules-for-staying-safe-online",
    excerpt: "Account, device এবং personal data সুরক্ষিত রাখার জন্য সাতটি বাস্তব ও সহজ নিয়ম।",
    language: "bn",
    categories: ["Bangladesh", "How-to Guides"],
    tags: ["cyber safety", "privacy", "security"],
    isFeatured: false,
    isPinnedHome: false,
    readingMinutes: 5,
    publishedAt: new Date("2026-08-02T06:00:00Z"),
    metaTitle: "Safe Online থাকার ৭টি নিয়ম | ToolsHUB",
    metaDescription: "Account, device এবং personal data সুরক্ষিত রাখার সাতটি বাস্তব নিয়ম।",
    content: `Online safety কোনো একবারের setting নয়; এটি কিছু ছোট অভ্যাসের সমষ্টি। নিচের সাতটি নিয়ম নিয়মিত মানলে বেশির ভাগ সাধারণ ঝুঁকি কমে যায়।

## ১. প্রতিটি account-এ আলাদা password ব্যবহার করুন

একটি password leak হলে অন্য account রক্ষা পাবে। দীর্ঘ passphrase বা password manager ব্যবহার করুন।

## ২. Two-factor authentication চালু করুন

Password চুরি হলেও দ্বিতীয় verification অনেক account takeover ঠেকাতে পারে। সম্ভব হলে authenticator app ব্যবহার করুন।

## ৩. Link দেখে নয়, address দেখে বিশ্বাস করুন

Message-এর link চাপার আগে domain বানান মিলিয়ে দেখুন। জরুরি বা ভয় দেখানো message বিশেষভাবে সন্দেহ করুন।

## ৪. Update পিছিয়ে দেবেন না

Browser, phone এবং apps-এর security update যত দ্রুত সম্ভব দিন। পুরোনো version পরিচিত দুর্বলতা রেখে দেয়।

## ৫. Public Wi‑Fi-তে সংবেদনশীল কাজ এড়িয়ে চলুন

Banking, password change বা sensitive upload দরকার হলে mobile data বা trusted network ব্যবহার করুন।

## ৬. কম তথ্য ভাগ করুন

Birth date, school, phone number এবং location একসাথে public profile-এ থাকলে impersonation সহজ হয়। Privacy setting সময় নিয়ে দেখুন।

## ৭. Backup রাখুন

Important photo, document এবং recovery code এক জায়গায় রাখবেন না। অন্তত একটি encrypted backup রাখুন।

যদি কোনো message অস্বাভাবিক মনে হয়, তাড়াহুড়ো করবেন না। থামুন, source যাচাই করুন, এবং দরকার হলে পরিচিত কাউকে জিজ্ঞেস করুন।`,
  },
];
