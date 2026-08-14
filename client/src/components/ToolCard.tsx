/** Cobalt Workshop design reminder: cards are instrument labels—not generic containers—with a visible category signal and a confident directional affordance. */
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { getToolIcon, groupMeta, type Tool } from "@/data/tools";
import { useSettings } from "@/contexts/AppSettingsContext";

export function ToolCard({ tool, compact = false }: { tool: Tool; compact?: boolean }) {
  const { language } = useSettings(); const Icon = getToolIcon(tool.group);
  return <Link href={`/tools/${tool.slug}`} className={`tool-card group ${compact ? "tool-card-compact" : ""}`}><div className="flex items-start justify-between gap-3"><span className="tool-icon"><Icon className="size-4" /></span><ArrowUpRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" /></div><div className="mt-auto"><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.13em] text-muted-foreground">{language === "bn" ? tool.categoryBn : tool.category}</p><h3 className="font-display text-[17px] font-semibold tracking-[-.025em]">{tool.name}</h3><p className="mt-1.5 text-sm leading-5 text-muted-foreground">{tool.description[language]}</p></div></Link>;
}
