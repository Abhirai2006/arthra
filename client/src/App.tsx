import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import DashboardLayout from "@/components/DashboardLayout";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./workspace.css";
import "./analytics.css";
import Home from "./pages/Home";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const TransactionsPage = lazy(() => import("@/pages/TransactionsPage"));
const BudgetsPage = lazy(() => import("@/pages/BudgetsPage"));
const SpacesPage = lazy(() => import("@/pages/SpacesPage"));
const JoinSpacePage = lazy(() => import("@/pages/JoinSpacePage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const CaPublicPage = lazy(() => import("@/pages/CaPublicPage"));
const LegalPage = lazy(() => import("@/pages/LegalPage"));
const BudgetRingHarness = lazy(() => import("@/pages/BudgetRingHarness"));

function RouteLoading() { return <div className="min-h-screen bg-background" aria-label="Loading page" />; }

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<RouteLoading />}><Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/join/:token"} component={JoinSpacePage} />
      <Route path={"/ca/:token"} component={CaPublicPage} />
      <Route path={"/privacy"} component={LegalPage} />
      <Route path={"/terms"} component={LegalPage} />
      {import.meta.env.DEV && <Route path={"/__verify-budget"} component={BudgetRingHarness} />}
      <Route path={"/dashboard"}>{() => <DashboardLayout><DashboardPage /></DashboardLayout>}</Route>
      <Route path={"/transactions"}>{() => <DashboardLayout><TransactionsPage /></DashboardLayout>}</Route>
      <Route path={"/budgets"}>{() => <DashboardLayout><BudgetsPage /></DashboardLayout>}</Route>
      <Route path={"/spaces"}>{() => <DashboardLayout><SpacesPage /></DashboardLayout>}</Route>
      <Route path={"/analytics"}>{() => <DashboardLayout><AnalyticsPage /></DashboardLayout>}</Route>
      <Route path={"/reports"}>{() => <DashboardLayout><ReportsPage /></DashboardLayout>}</Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch></Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
