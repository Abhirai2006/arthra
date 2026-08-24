import { useAuth } from "@/_core/hooks/useAuth";
import { BrandMark } from "@/components/BrandMark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, CircleHelp, LayoutDashboard, LogOut, Moon, ReceiptText, ScrollText, Sun, UsersRound, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { OnboardingGuide } from "./OnboardingGuide";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: ReceiptText, label: "Transactions", path: "/transactions" },
  { icon: WalletCards, label: "Budgets", path: "/budgets" },
  { icon: UsersRound, label: "Expense Spaces", path: "/spaces" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: ScrollText, label: "Reports", path: "/reports" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, error, refresh } = useAuth();
  if (loading) return <DashboardLayoutSkeleton />;
  if (error) return <main className="grid min-h-screen place-items-center bg-background p-6"><section className="max-w-md rounded-2xl border border-border bg-card p-7 text-center"><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Workspace connection</p><h1 className="mt-3 text-2xl font-bold tracking-tight">We could not confirm your workspace.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your financial data has not changed. Check your connection and try again.</p><div className="mt-6 flex justify-center gap-3"><button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => refresh()}>Try again</button><a className="rounded-lg border border-border px-4 py-2 text-sm font-semibold" href="/">Back home</a></div></section></main>;
  if (!user) return <AuthRedirect />;
  return <SidebarProvider defaultOpen className="workspace-theme"><DashboardLayoutContent>{children}</DashboardLayoutContent></SidebarProvider>;
}

function WorkspaceThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";
  return <button className={`workspace-theme-toggle${compact ? " workspace-theme-toggle--compact" : ""}`} type="button" onClick={toggleTheme} aria-label={`Switch workspace to ${nextTheme} mode`} title={`Switch to ${nextTheme} mode`}><span aria-hidden="true">{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}</span>{!compact && <span className="workspace-theme-toggle__label">{theme === "dark" ? "Light" : "Dark"}</span>}</button>;
}

function AuthRedirect() {
  useEffect(() => { window.location.replace("/"); }, []);
  return <div className="min-h-screen bg-background" aria-label="Redirecting to the sign-in page" />;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [tourRequest, setTourRequest] = useState(0);
  const activeMenuItem = menuItems.find(item => item.path === location);
  return <>
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/70">
      <SidebarHeader className="h-[74px] flex-row items-center justify-between px-3"><BrandMark /><WorkspaceThemeToggle /></SidebarHeader>
      <SidebarContent className="px-2"><p className="px-3 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground group-data-[collapsible=icon]:hidden">Your workspace</p><SidebarMenu>{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-10 rounded-xl"><item.icon className="size-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70 p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl p-1 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center"><Avatar className="size-8 border border-sidebar-border"><AvatarFallback className="bg-primary/15 text-xs text-primary">{user?.name?.charAt(0).toUpperCase() ?? "A"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-semibold">{user?.name || "Your account"}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">Private workspace</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuItem onClick={() => setTourRequest(request => request + 1)} className="cursor-pointer"><CircleHelp className="mr-2 size-4" />Show quick-start guide</DropdownMenuItem><DropdownMenuItem onClick={() => { logout(); window.location.replace("/"); }} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 size-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter>
    </Sidebar>
    <SidebarInset>
      {isMobile && <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/70 bg-background/90 px-4 backdrop-blur"><SidebarTrigger className="size-9 rounded-xl" /><BrandMark compact /><span className="ml-auto text-xs font-semibold text-muted-foreground">{activeMenuItem?.label ?? "Workspace"}</span><WorkspaceThemeToggle compact /></header>}
      <main className="min-h-screen p-4 md:p-6">{children}</main>
      {isMobile && <nav className="mobile-workspace-dock" aria-label="Workspace navigation">{menuItems.slice(0, 4).map(item => <button type="button" className={location === item.path ? "is-active" : ""} key={item.path} onClick={() => setLocation(item.path)}><item.icon size={18} /><span>{item.label === "Expense Spaces" ? "Spaces" : item.label}</span></button>)}</nav>}
      {user && <OnboardingGuide userId={user.id} restartRequest={tourRequest} onNavigate={setLocation} />}
    </SidebarInset>
  </>;
}
