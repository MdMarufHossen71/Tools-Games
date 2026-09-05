import { Route, Router, Switch, useLocation } from "wouter";
import { useHashPath, useHashSearch } from "@/lib/hashLocation";
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
      <Route path="/404">{() => <NotFound />}</Route>
      {/* Final fallback route */}
      <Route>{() => <NotFound />}</Route>
    </Switch>
  );
}

/**
 * A failure inside one page must not take down the header, navigation and footer.
 * Keying on the location also clears the error when the user navigates away, so a
 * broken route is recoverable without a full reload.
 */
function RoutedContent() {
  const [location] = useLocation();
  return (
    <ErrorBoundary key={location} variant="route">
      <AppRoutes />
    </ErrorBoundary>
  );
}

function App() {
  return (
    // Hash routing: on a static host (GitHub Pages included) there is no rewrite
    // rule, so a path-based deep link or refresh returns the host's own 404.
    // Hash locations survive both, which is also what the README documents.
    <ErrorBoundary>
      <Router hook={useHashPath} searchHook={useHashSearch}>
        <AppSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <SiteShell>
              <RoutedContent />
            </SiteShell>
          </TooltipProvider>
        </AppSettingsProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
