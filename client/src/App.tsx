import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteShell } from "@/components/SiteShell";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import AI from "@/pages/AI";
import GamePage from "@/pages/GamePage";
import Games from "@/pages/Games";
import InfoPage from "@/pages/InfoPage";
import Links from "@/pages/Links";
import NotFound from "@/pages/NotFound";
import Settings from "@/pages/Settings";
import ToolPage from "@/pages/ToolPage";
import Tools from "@/pages/Tools";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";


function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tools" component={Tools} />
      <Route path="/tools/:slug" component={ToolPage} />
      <Route path="/games" component={Games} />
      <Route path="/games/:slug" component={GamePage} />
      <Route path="/links" component={Links} />
      <Route path="/ai" component={AI} />
      <Route path="/settings" component={Settings} />
      <Route path="/about" component={InfoPage} />
      <Route path="/how-to" component={InfoPage} />
      <Route path="/privacy" component={InfoPage} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <AppSettingsProvider>
        <TooltipProvider>
          <Toaster />
          <SiteShell><AppRoutes /></SiteShell>
        </TooltipProvider>
      </AppSettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
