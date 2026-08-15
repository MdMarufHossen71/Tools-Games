import { getPublishedArticleBySlug } from "./db";
import { invokeLLM } from "./_core/llm";

const languageNames: Record<string, string> = {
  en: "English", bn: "Bangla", hi: "Hindi", ur: "Urdu", ar: "Arabic", es: "Spanish", fr: "French", de: "German",
};

type Translation = { title: string; excerpt: string; content: string; language: string; translated: boolean };
const translationCache = new Map<string, { value: Translation; expiresAt: number }>();

export async function translatePublishedArticle(slug: string, language: string): Promise<Translation | null> {
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return null;
  if (article.language === language) return { title: article.title, excerpt: article.excerpt ?? "", content: article.content, language, translated: false };
  const targetLanguage = languageNames[language];
  if (!targetLanguage) throw new Error("Unsupported translation language");
  const cacheKey = `${article.id}:${language}`;
  const cached = translationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const result = await invokeLLM({
    model: "gpt-5-mini",
    maxTokens: 6000,
    messages: [
      { role: "system", content: "You are a precise editorial translator. Translate only the supplied Markdown article into the requested language. Preserve Markdown syntax, code blocks, URLs, tool names, tables, and factual claims. Do not add commentary or change the structure." },
      { role: "user", content: `Target language: ${targetLanguage}\n\nTitle:\n${article.title}\n\nExcerpt:\n${article.excerpt ?? ""}\n\nArticle Markdown:\n${article.content}` },
    ],
    outputSchema: {
      name: "translated_article",
      strict: true,
      schema: {
        type: "object",
        properties: { title: { type: "string" }, excerpt: { type: "string" }, content: { type: "string" } },
        required: ["title", "excerpt", "content"],
        additionalProperties: false,
      },
    },
  });
  const raw = result.choices[0]?.message.content;
  const text = typeof raw === "string" ? raw : "";
  if (!text) throw new Error("AI translation returned no readable content");
  const parsed = JSON.parse(text) as Omit<Translation, "language" | "translated">;
  const value: Translation = { ...parsed, language, translated: true };
  translationCache.set(cacheKey, { value, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  return value;
}
