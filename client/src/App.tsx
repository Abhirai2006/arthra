import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import DashboardLayout from "@/components/DashboardLayout";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense, useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./workspace.css";
import "./analytics.css";
import "./workspace-theme.css";
import "./workspace-reports-theme.css";
import Home from "./pages/Home";
import DemoPage from "./pages/DemoPage";
import JoinSpacePage from "./pages/JoinSpacePage";
import CaPublicPage from "./pages/CaPublicPage";
import LegalPage from "./pages/LegalPage";
import FeedbackPage from "./pages/FeedbackPage";
import { AboutPage, ContactPage, ThankYouPage, WaitlistPage } from "./pages/PublicPages";
import "./feedback.css";
import "./matte-black.css";
import "./public-pages.css";
import "./faq.css";
import { CookieConsent } from "./components/CookieConsent";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const TransactionsPage = lazy(() => import("@/pages/TransactionsPage"));
const BudgetsPage = lazy(() => import("@/pages/BudgetsPage"));
const SpacesPage = lazy(() => import("@/pages/SpacesPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const BudgetRingHarness = lazy(() => import("@/pages/BudgetRingHarness"));

function RouteLoading() { return <div className="min-h-screen bg-background" aria-label="Loading page" />; }

function ProtectedRouteShell({ title, description }: { title: string; description: string }) {
  return <main className="ssr-protected-shell"><nav aria-label="Private workspace"><a href="/">Arthra</a><span>Private workspace</span></nav><section><p>Authenticated finance workspace</p><h1>{title}</h1><p>{description}</p></section></main>;
}

function ProtectedRoute({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => { setIsHydrated(true); }, []);
  if (!isHydrated) return <ProtectedRouteShell title={title} description={description} />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

const clientMeta: Record<string, { title: string; description: string }> = {
  "/": { title: "Arthra — Personal Finance, Built for India", description: "Track expenses, manage budgets, understand your spending, and generate secure financial reports with Arthra." },
  "/about": { title: "About Arthra · Personal finance, built for India", description: "Learn why Arthra is built around Indian personal-finance context, private records, and deliberate sharing." },
  "/contact": { title: "Contact Arthra · Private product conversation", description: "Send a private product, accessibility, research, or partnership message to Arthra." },
  "/waitlist": { title: "Arthra waitlist · Product updates by choice", description: "Join the optional Arthra waitlist for considered product updates and research invitations." },
  "/thank-you": { title: "Thank you · Arthra", description: "Your Arthra submission has been received." },
  "/feedback": { title: "Share feedback · Arthra", description: "Share private product feedback about Arthra." },
  "/demo": { title: "Arthra demo · Personal finance, built for India", description: "Explore Arthra’s safe, labelled fictional demo workspace." },
};

function RouteMeta() {
  const [location] = useLocation();
  useEffect(() => {
    const meta = clientMeta[location] ?? { title: "Page not found · Arthra", description: "The requested Arthra page is unavailable." };
    document.title = meta.title;
    let description = document.querySelector('meta[name="description"]');
    if (!description) { description = document.createElement("meta"); description.setAttribute("name", "description"); document.head.appendChild(description); }
    description.setAttribute("content", meta.description);
  }, [location]);
  return null;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <><RouteMeta /><Suspense fallback={<RouteLoading />}><Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/demo"} component={DemoPage} />
      <Route path={"/join/:token"} component={JoinSpacePage} />
      <Route path={"/ca/:token"} component={CaPublicPage} />
      <Route path={"/privacy"} component={LegalPage} />
      <Route path={"/terms"} component={LegalPage} />
      <Route path={"/feedback"} component={FeedbackPage} />
      <Route path={"/about"} component={AboutPage} />
      <Route path={"/contact"} component={ContactPage} />
      <Route path={"/waitlist"} component={WaitlistPage} />
      <Route path={"/thank-you"} component={ThankYouPage} />
      {import.meta.env.DEV && <Route path={"/__verify-budget"} component={BudgetRingHarness} />}
      <Route path={"/dashboard"}>{() => <ProtectedRoute title="Your money, with context" description="Track private records, shared spaces, and monthly patterns after secure sign-in."><DashboardPage /></ProtectedRoute>}</Route>
      <Route path={"/transactions"}>{() => <ProtectedRoute title="Transactions" description="Review, filter, and safely manage your private income and expense records."><TransactionsPage /></ProtectedRoute>}</Route>
      <Route path={"/budgets"}>{() => <ProtectedRoute title="Budgets that breathe" description="Set category boundaries and review the context behind each month’s spend."><BudgetsPage /></ProtectedRoute>}</Route>
      <Route path={"/spaces"}>{() => <ProtectedRoute title="Expense Spaces" description="Share only the financial context you choose with the people who belong in it."><SpacesPage /></ProtectedRoute>}</Route>
      <Route path={"/analytics"}>{() => <ProtectedRoute title="Spending rhythm" description="Explore your spending patterns and practical observations after secure sign-in."><AnalyticsPage /></ProtectedRoute>}</Route>
      <Route path={"/reports"}>{() => <ProtectedRoute title="CA-ready reports" description="Prepare structured financial-year records and revocable read-only handoff links."><ReportsPage /></ProtectedRoute>}</Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch></Suspense></>
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
          <CookieConsent />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
