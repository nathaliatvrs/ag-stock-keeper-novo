import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import StockEntry from "./pages/StockEntry";
import StockConsult from "./pages/StockConsult";
import StockExits from "./pages/StockExits";
import StockReport from "./pages/StockReport";
import OrderPayments from "./pages/OrderPayments";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/" 
        element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/produtos" 
        element={user ? <Layout><Products /></Layout> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/pedidos" 
        element={user ? <Layout><Orders /></Layout> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/estoque/entrada" 
        element={user ? <Layout><StockEntry /></Layout> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/estoque/consultar" 
        element={user ? <Layout><StockConsult /></Layout> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/saidas" 
        element={user ? <Layout><StockExits /></Layout> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/relatorio" 
        element={user ? <Layout><StockReport /></Layout> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/pagamentos/pedidos" 
        element={user ? <Layout><OrderPayments /></Layout> : <Navigate to="/login" replace />} 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
