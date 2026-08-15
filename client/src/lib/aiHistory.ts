export type ChatRole = "user" | "assistant" | "system";
export type ChatTranscriptMessage = { role: ChatRole; content: string };
export type StoredAiMessage = { role: "user" | "assistant"; content: string };

export function restoreAiMessages(value: unknown): StoredAiMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is StoredAiMessage => Boolean(item) && typeof item === "object" && (((item as StoredAiMessage).role === "user") || ((item as StoredAiMessage).role === "assistant")) && typeof (item as StoredAiMessage).content === "string");
}

export function toStoredAiMessages(messages: ChatTranscriptMessage[]): StoredAiMessage[] {
  return messages.filter((message) => message.role !== "system").map(({ role, content }) => ({ role: role as "user" | "assistant", content }));
}
