/** Cobalt Workshop design reminder: a tool detail page is a direct input-to-output bench, with no promotional interruption. */
import { ArrowLeft } from "lucide-react";
import { Link, useRoute } from "wouter";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { findTool } from "@/data/tools";
import NotFound from "@/pages/NotFound";
import { useTranslation } from "@/contexts/AppSettingsContext";

export default function ToolPage() {
  const [, params] = useRoute("/tools/:slug"); const tool = findTool(params?.slug ?? ""); const { t } = useTranslation();
  if (!tool) return <NotFound />;
  return <div className="site-frame page-space"><Link href="/tools" className="back-link"><ArrowLeft className="size-4" />{t("common.back")}</Link><ToolWorkspace tool={tool} /></div>;
}
