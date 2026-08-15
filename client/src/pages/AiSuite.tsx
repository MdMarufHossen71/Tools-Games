import { useAuth } from "@/_core/hooks/useAuth";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/AppSettingsContext";
import { trpc } from "@/lib/trpc";
import { restoreAiMessages, toStoredAiMessages } from "@/lib/aiHistory";
import { Bot, MessageSquareText, RotateCcw, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import "../ai-suite.css";

export default function AiSuite() {
  const { t } = useSettings();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const history = trpc.aiConversations.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeHistory = trpc.aiConversations.get.useQuery({ id: activeConversationId ?? 1 }, { enabled: isAuthenticated && activeConversationId !== null });
  const createHistory = trpc.aiConversations.create.useMutation();
  const updateHistory = trpc.aiConversations.update.useMutation();
  const deleteHistory = trpc.aiConversations.delete.useMutation();

  useEffect(() => {
    if (!activeHistory.data) return;
    setMessages(restoreAiMessages(activeHistory.data.messages));
    setTitleDraft(activeHistory.data.title ?? t("ai.newChat"));
  }, [activeHistory.data, t]);

  const reset = () => { setMessages([]); setActiveConversationId(null); setTitleDraft(""); };
  const saveTitle = async () => {
    if (!activeConversationId || !titleDraft.trim()) return;
    await updateHistory.mutateAsync({ id: activeConversationId, title: titleDraft.trim() });
    await utils.aiConversations.list.invalidate();
  };
  const removeConversation = async (id: number) => {
    await deleteHistory.mutateAsync({ id });
    if (id === activeConversationId) reset();
    await utils.aiConversations.list.invalidate();
  };
  const send = async (content: string) => {
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setLoading(true);
    try {
      const response = await fetch("/api/ai/stream", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next }) });
      if (!response.ok || !response.body) throw new Error("unavailable");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffered = "";
      let answer = "";
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        buffered += decoder.decode(part.value, { stream: true });
        const lines = buffered.split("\n");
        buffered = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            const token = payload.choices?.[0]?.delta?.content;
            if (typeof token === "string") { answer += token; setMessages([...next, { role: "assistant", content: answer }]); }
          } catch { /* defer incomplete SSE frames */ }
        }
      }
      const completed: Message[] = [...next, { role: "assistant", content: answer || t("ai.disclaimer") }];
      setMessages(completed);
      if (isAuthenticated) {
        const conversationTitle = (titleDraft || content).trim().slice(0, 120) || t("ai.newChat");
        const persistedMessages = toStoredAiMessages(completed);
        const conversation = activeConversationId
          ? await updateHistory.mutateAsync({ id: activeConversationId, messages: persistedMessages, title: conversationTitle })
          : await createHistory.mutateAsync({ title: conversationTitle, messages: persistedMessages });
        if (conversation && !activeConversationId) setActiveConversationId(conversation.id);
        setTitleDraft(conversationTitle);
        await utils.aiConversations.list.invalidate();
      }
    } catch {
      setMessages([...next, { role: "assistant", content: t("ai.disclaimer") }]);
    } finally { setLoading(false); }
  };

  return <main className="container ai-page">
    <header className="ai-header"><div><span className="eyebrow"><Sparkles size={15}/>{t("ai.title")}</span><h1>{t("ai.title")}</h1><p>{isAuthenticated ? t("ai.limitMember") : t("ai.limitGuest")}</p></div><div className="ai-actions"><Button variant="outline" onClick={reset}><RotateCcw size={16}/>{t("ai.newChat")}</Button></div></header>
    <section className="ai-grid"><div className="ai-main"><AIChatBox messages={messages} onSendMessage={send} isLoading={loading} placeholder={t("ai.send")} emptyStateMessage={t("ai.newChat")} suggestedPrompts={[]} height="min(66vh, 650px)" /></div>
      <aside className="ai-sidebar"><div><Bot /><h2>{t("ai.title")}</h2><p>{t("ai.disclaimer")}</p></div><div><ShieldCheck /><h2>{t("data.private")}</h2><p>{isAuthenticated ? t("ai.limitMember") : t("ai.limitGuest")}</p></div>
        <section className="ai-history"><div className="ai-history-head"><MessageSquareText /><h2>{t("ai.history")}</h2></div>{isAuthenticated && activeConversationId ? <input className="ai-history-title" value={titleDraft} onChange={(event) => setTitleDraft(event.target.value)} onBlur={() => void saveTitle()} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} aria-label={t("ai.history")} /> : null}
          {isAuthenticated ? <div className="ai-history-list">{history.data?.length ? history.data.map((item) => <article key={item.id} className={item.id === activeConversationId ? "active" : ""}><button onClick={() => setActiveConversationId(item.id)}><strong>{item.title || t("ai.newChat")}</strong><small>{new Date(item.updatedAt).toLocaleDateString()}</small></button><Button variant="ghost" size="icon" onClick={() => void removeConversation(item.id)} aria-label={t("data.delete")}><Trash2 size={15}/></Button></article>) : <p>{t("data.empty")}</p>}</div> : <p>{t("ai.limitGuest")}</p>}
        </section>
      </aside>
    </section>
  </main>;
}
