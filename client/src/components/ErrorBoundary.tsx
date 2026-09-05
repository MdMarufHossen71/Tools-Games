import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { interpolate, translations, type Locale, type TranslationKey } from "@/i18n/translations";
import { safeGet, settingsKey } from "@/lib/storage";

type Props = {
  children: ReactNode;
  /** Route-level boundaries keep the app shell; the root boundary replaces the page. */
  variant?: "app" | "route";
};

type State = { hasError: boolean; error: Error | null };

/**
 * This component sits above `AppSettingsProvider`, so it cannot use the settings
 * context — if the provider is what threw, the context would be unavailable.
 * It reads the persisted language directly instead.
 */
function translate(key: TranslationKey, values?: Record<string, string | number>) {
  let locale: Locale = "en";
  try {
    const saved = safeGet<unknown>(settingsKey("language"), "en");
    if (saved === "bn") locale = "bn";
  } catch {
    locale = "en";
  }
  const template = translations[locale][key] ?? translations.en[key];
  return typeof template === "string" ? interpolate(template, values) : String(key);
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Local only: logged to this browser's console, never sent anywhere.
    if (import.meta.env.DEV) console.error("[ErrorBoundary]", error, info.componentStack);
  }

  /** Clears the error so the same route can re-render without a full page reload. */
  private retry = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const isRoute = this.props.variant === "route";
    const stack = this.state.error?.stack ?? this.state.error?.message ?? "";

    return (
      <div className={isRoute ? "site-frame page-space" : "error-shell"}>
        <section className="error-panel" role="alert" aria-labelledby="error-panel-title">
          <span className="error-panel-mark" aria-hidden="true">
            <AlertTriangle className="size-6" />
          </span>
          <h2 id="error-panel-title">{translate("error.title")}</h2>
          <p>{translate("error.copy")}</p>
          {/* Stack traces are developer detail; production users get the plain message. */}
          {import.meta.env.DEV && stack && (
            <details className="error-panel-details">
              <summary>{translate("error.details")}</summary>
              <pre>{stack}</pre>
            </details>
          )}
          <div className="error-panel-actions">
            <button type="button" className="error-action error-action-primary" onClick={this.retry}>
              <RotateCcw className="size-4" aria-hidden="true" />
              {translate("error.retry")}
            </button>
            <a className="error-action" href={import.meta.env.BASE_URL || "/"}>
              <Home className="size-4" aria-hidden="true" />
              {translate("error.home")}
            </a>
          </div>
        </section>
      </div>
    );
  }
}

export default ErrorBoundary;
