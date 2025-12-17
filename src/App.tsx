import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import StockEntry from "./pages/StockEntry";
import StockConsult from "./pages/StockConsult";
import StockExits from "./pages/StockExits";
import StockReport from "./pages/StockReport";
import OrderPayments from "./pages/OrderPayments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/pedidos" element={<Orders />} />
            <Route path="/estoque/entrada" element={<StockEntry />} />
            <Route path="/estoque/consultar" element={<StockConsult />} />
            <Route path="/saidas" element={<StockExits />} />
            <Route path="/relatorio" element={<StockReport />} />
            <Route path="/pagamentos/pedidos" element={<OrderPayments />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
