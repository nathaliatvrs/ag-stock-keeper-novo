import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Package,
  ShoppingCart,
  Warehouse,
  LogOut as LogOutIcon,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  BoxesIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import agLogo from '@/assets/ag-logo.png';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: Home },
  { title: 'Cadastrar Produtos', href: '/produtos', icon: Package },
  { title: 'Pedidos', href: '/pedidos', icon: ShoppingCart },
  { title: 'Entrada de Estoque', href: '/estoque/entrada', icon: Warehouse },
  { title: 'Consultar Estoque', href: '/estoque/consultar', icon: BoxesIcon },
  { title: 'Saídas', href: '/saidas', icon: LogOutIcon },
  { title: 'Relatório de Estoque', href: '/relatorio', icon: FileText },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-6 border-b border-sidebar-border",
        collapsed && "justify-center px-2"
      )}>
        <img 
          src={agLogo} 
          alt="AG Consultoria" 
          className={cn("h-10 w-auto", collapsed && "h-8")}
        />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-lg text-sidebar-foreground">AG Consultoria</span>
            <span className="text-xs text-sidebar-muted">Sistema de Estoque</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive(item.href) 
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                : "text-sidebar-foreground/80",
              collapsed && "justify-center px-2"
            )}
          >
            <item.icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "h-6 w-6")} />
            {!collapsed && <span className="truncate">{item.title}</span>}
          </Link>
        ))}
      </nav>

      {/* Collapse Button - Desktop only */}
      <div className="hidden lg:flex px-3 py-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "px-2"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 mr-2" />
              <span>Recolher menu</span>
            </>
          )}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar flex items-center gap-3 px-4 h-14 border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <img src={agLogo} alt="AG Consultoria" className="h-8 w-auto" />
        <span className="font-bold text-sidebar-foreground">AG Consultoria</span>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-foreground/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen bg-sidebar flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-h-screen",
        "lg:pt-0 pt-14" // Account for mobile header
      )}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
