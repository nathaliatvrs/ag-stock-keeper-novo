import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  CreditCard,
  User,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import agLogo from '@/assets/ag-logo.png';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  children?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: Home },
  { title: 'Cadastrar Produtos', href: '/produtos', icon: Package },
  { title: 'Pedidos', href: '/pedidos', icon: ShoppingCart },
  { title: 'Entrada de Estoque', href: '/estoque/entrada', icon: Warehouse },
  { title: 'Consultar Estoque', href: '/estoque/consultar', icon: BoxesIcon },
  { title: 'Saídas', href: '/saidas', icon: LogOutIcon },
  { 
    title: 'Pagamentos', 
    href: '/pagamentos', 
    icon: CreditCard,
    children: [
      { title: 'Pagamento de Pedidos', href: '/pagamentos/pedidos' }
    ]
  },
  { title: 'Relatório de Estoque', href: '/relatorio', icon: FileText },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Pagamentos']);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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

      {/* User Info */}
      {user && (
        <div className={cn(
          "px-4 py-3 border-b border-sidebar-border",
          collapsed && "px-2"
        )}>
          <div className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}>
            <div className={cn(
              "flex items-center justify-center rounded-full bg-primary/20",
              collapsed ? "h-8 w-8" : "h-10 w-10"
            )}>
              {isAdmin ? (
                <Shield className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</span>
                <div className="flex items-center gap-1.5">
                  <Badge 
                    variant={isAdmin ? "default" : "secondary"} 
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      isAdmin && "bg-primary/80"
                    )}
                  >
                    {isAdmin ? 'Admin' : 'Usuário'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <div key={item.href}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive(item.href) 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                      : "text-sidebar-foreground/80",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "h-6 w-6")} />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-left">{item.title}</span>
                      <ChevronRight 
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedMenus.includes(item.title) && "rotate-90"
                        )} 
                      />
                    </>
                  )}
                </button>
                {!collapsed && expandedMenus.includes(item.title) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive(child.href) 
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                            : "text-sidebar-foreground/70"
                        )}
                      >
                        <span className="truncate">{child.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
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
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "w-full text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10",
            collapsed && "px-2"
          )}
        >
          <LogOutIcon className={cn("h-5 w-5", !collapsed && "mr-2")} />
          {!collapsed && <span>Sair</span>}
        </Button>
      </div>

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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar flex items-center justify-between px-4 h-14 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
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
        {user && (
          <Badge 
            variant={isAdmin ? "default" : "secondary"} 
            className={cn("text-xs", isAdmin && "bg-primary/80")}
          >
            {isAdmin ? 'Admin' : 'Usuário'}
          </Badge>
        )}
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
