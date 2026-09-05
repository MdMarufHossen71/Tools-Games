import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useSettings } from "@/contexts/AppSettingsContext";

/**
 * Toast host.
 *
 * This shipped reading its theme from `next-themes`, which this app never installs a
 * provider for — so `useTheme()` always returned the default `"system"` and Sonner
 * picked its light/dark internals from the operating system rather than from the
 * theme the user chose here. With twelve presets and an explicit light/dark toggle,
 * that meant a light toast could appear over a dark page. The app's own resolved
 * theme is the correct source, and it is already exposed as `"light" | "dark"`.
 *
 * Background, text and border still come from the app's own custom properties, so a
 * toast stays inside the token system rather than carrying Sonner's own palette.
 *
 * The toast region's own accessible name came from Sonner's English default, which is
 * the one string on the page a Bangla reader could not have translated, so it is
 * passed in from the dictionary. Sonner still appends its keyboard hint to it.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme, t } = useSettings();

  return (
    <Sonner
      theme={theme}
      containerAriaLabel={t("a11y.notifications")}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
