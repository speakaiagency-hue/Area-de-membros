import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@/lib/api";
import { 
  LayoutDashboard, 
  BookOpen, 
  Settings, 
  LogOut, 
  Menu, 
  User as UserIcon,
  ShieldCheck,
  ExternalLink,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const navigation = [
    { name: "Meus Cursos", href: "/", icon: BookOpen },
    { name: "Comunidade", href: "/community", icon: Video },
    ...(isAdmin ? [{ name: "Administração", href: "/admin", icon: ShieldCheck }] : []),
    { name: "Perfil", href: "/profile", icon: UserIcon },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-sidebar-primary-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <span>Membros<span className="text-primary ml-1">Premium</span></span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-3">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`
                    group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors
                    ${isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }
                  `}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary" : "text-sidebar-foreground/50"}`} />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 px-3">
          <div className="rounded-lg bg-sidebar-accent/50 p-4 border border-sidebar-border">
            <h4 className="text-sm font-medium text-sidebar-foreground mb-2">Ferramentas SpeakAI</h4>
            <p className="text-xs text-sidebar-foreground/60 mb-3">Acesse nossa suíte completa de ferramentas.</p>
            <a href="https://speakai.com.br" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="w-full gap-2" variant="secondary">
                Acessar <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-sidebar-border">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</span>
            <span className="truncate text-xs text-sidebar-foreground/60">{user.email}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground" 
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
        <SidebarContent />
      </div>

      {/* Mobile Header & Content */}
      <div className="flex flex-col flex-1 md:pl-64 h-full overflow-hidden">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-6 shadow-sm md:hidden">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-sidebar-border bg-sidebar text-sidebar-foreground">
              <SheetHeader>
                <SheetTitle>Menu de Navegação</SheetTitle>
                <SheetDescription>Selecione uma opção para navegar.</SheetDescription>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex-1 font-semibold">Membros Premium</div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
        {children}
      </div>
    </div>
  );
}
