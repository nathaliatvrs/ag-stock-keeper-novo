// Mock Data for AG Consultoria Inventory System
// This file simulates the data that will come from your GCP API

import { 
  User, 
  Product, 
  Order, 
  StockEntry, 
  StockItem, 
  StockExit,
  PaymentInstallment,
  DashboardStats 
} from '@/types';

// Current logged user (mock - will come from auth)
export const currentUser: User = {
  id: 'user-1',
  name: 'Maria Silva',
  email: 'maria@agconsultoria.com.br',
  role: 'user',
  createdAt: '2024-01-15T10:00:00Z',
};

export const adminUser: User = {
  id: 'admin-1',
  name: 'Carlos Administrador',
  email: 'carlos@agconsultoria.com.br',
  role: 'admin',
  createdAt: '2024-01-01T10:00:00Z',
};

// Products
export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Mounjaro 5mg',
    supplier: 'Eli Lilly',
    unitCost: 2500.00,
    unitType: 'caixa',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Ozempic 1mg',
    supplier: 'Novo Nordisk',
    unitCost: 1200.00,
    unitType: 'caneta',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'prod-3',
    name: 'Wegovy 2.4mg',
    supplier: 'Novo Nordisk',
    unitCost: 3500.00,
    unitType: 'caixa',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
  },
  {
    id: 'prod-4',
    name: 'Saxenda 6mg/ml',
    supplier: 'Novo Nordisk',
    unitCost: 950.00,
    unitType: 'caneta',
    createdAt: '2024-07-01T10:00:00Z',
    updatedAt: '2024-07-01T10:00:00Z',
  },
];

// Orders
export const mockOrders: Order[] = [
  {
    id: 'order-1',
    orderNumber: 'PED-2024-001',
    date: '2024-12-10',
    productId: 'prod-1',
    productName: 'Mounjaro 5mg',
    supplier: 'Eli Lilly',
    unitCost: 2500.00,
    quantity: 50,
    totalValue: 125000.00,
    createdBy: 'user-1',
    createdByName: 'Maria Silva',
    approvedBy: 'admin-1',
    approvedByName: 'Carlos Administrador',
    status: 'approved',
    createdAt: '2024-12-10T14:30:00Z',
  },
  {
    id: 'order-2',
    orderNumber: 'PED-2024-002',
    date: '2024-12-12',
    productId: 'prod-2',
    productName: 'Ozempic 1mg',
    supplier: 'Novo Nordisk',
    unitCost: 1200.00,
    quantity: 30,
    totalValue: 36000.00,
    createdBy: 'user-1',
    createdByName: 'Maria Silva',
    approvedBy: null,
    approvedByName: null,
    status: 'pending',
    createdAt: '2024-12-12T09:15:00Z',
  },
  {
    id: 'order-3',
    orderNumber: 'PED-2024-003',
    date: '2024-12-15',
    productId: 'prod-3',
    productName: 'Wegovy 2.4mg',
    supplier: 'Novo Nordisk',
    unitCost: 3500.00,
    quantity: 20,
    totalValue: 70000.00,
    createdBy: 'user-1',
    createdByName: 'Maria Silva',
    approvedBy: 'admin-1',
    approvedByName: 'Carlos Administrador',
    status: 'approved',
    createdAt: '2024-12-15T11:00:00Z',
  },
];

// Stock Entries
export const mockStockEntries: StockEntry[] = [
  {
    id: 'entry-1',
    date: '2024-12-11',
    orderId: 'order-1',
    orderNumber: 'PED-2024-001',
    productId: 'prod-1',
    productName: 'Mounjaro 5mg',
    supplier: 'Eli Lilly',
    quantity: 50,
    unitCost: 2500.00,
    totalValue: 125000.00,
    paymentMethod: 'boleto',
    installments: 3,
    createdBy: 'user-1',
    createdByName: 'Maria Silva',
    approvedBy: 'admin-1',
    approvedByName: 'Carlos Administrador',
    createdAt: '2024-12-11T10:00:00Z',
  },
];

// Stock Items (exploded view - one row per unit)
export const mockStockItems: StockItem[] = Array.from({ length: 50 }, (_, i) => ({
  id: `item-${i + 1}`,
  stockEntryId: 'entry-1',
  productId: 'prod-1',
  productName: 'Mounjaro 5mg',
  supplier: 'Eli Lilly',
  unitCost: 2500.00,
  entryDate: '2024-12-11',
  status: i < 45 ? 'available' : 'exited',
  exitId: i >= 45 ? 'exit-1' : null,
}));

// Stock Exits
export const mockStockExits: StockExit[] = [
  {
    id: 'exit-1',
    stockItemIds: ['item-46', 'item-47', 'item-48', 'item-49', 'item-50'],
    productId: 'prod-1',
    productName: 'Mounjaro 5mg',
    supplier: 'Eli Lilly',
    quantity: 5,
    totalCost: 12500.00,
    entryDate: '2024-12-11',
    exitDate: '2024-12-16',
    observation: 'Saída para paciente João Silva - Protocolo #12345',
    createdBy: 'user-1',
    createdByName: 'Maria Silva',
    confirmedBy: 'admin-1',
    confirmedByName: 'Carlos Administrador',
    confirmedAt: '2024-12-16T15:30:00Z',
  },
];

// Payment Installments
export const mockInstallments: PaymentInstallment[] = [
  { id: 'inst-1', stockEntryId: 'entry-1', installmentNumber: 1, value: 41666.67, dueDate: '2024-12-11' },
  { id: 'inst-2', stockEntryId: 'entry-1', installmentNumber: 2, value: 41666.67, dueDate: '2025-01-11' },
  { id: 'inst-3', stockEntryId: 'entry-1', installmentNumber: 3, value: 41666.66, dueDate: '2025-02-11' },
];

// Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalProducts: 4,
  pendingOrders: 1,
  totalStockValue: 112500.00, // 45 units * 2500
  stockItemsCount: 45,
  monthlyEntries: 125000.00,
  monthlyExits: 12500.00,
};

// Helper functions for mock operations
export const getProductById = (id: string): Product | undefined => 
  mockProducts.find(p => p.id === id);

export const getOrderById = (id: string): Order | undefined => 
  mockOrders.find(o => o.id === id);

export const getAvailableStockItems = (): StockItem[] => 
  mockStockItems.filter(item => item.status === 'available');

export const getStockItemsByProduct = (productId: string): StockItem[] => 
  mockStockItems.filter(item => item.productId === productId && item.status === 'available');
