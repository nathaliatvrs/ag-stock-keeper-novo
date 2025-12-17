// Types for AG Consultoria Inventory System

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  supplier: string;
  unitCost: number;
  unitType: string; // ex: "caixa", "unidade", "pacote"
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'approved' | 'rejected';

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  productId: string;
  productName: string;
  supplier: string;
  unitCost: number;
  quantity: number;
  totalValue: number;
  createdBy: string;
  createdByName: string;
  approvedBy: string | null;
  approvedByName: string | null;
  status: OrderStatus;
  createdAt: string;
}

export type PaymentMethod = 'credit_card' | 'boleto' | 'pix';

export interface PaymentInstallment {
  id: string;
  stockEntryId: string;
  installmentNumber: number;
  value: number;
  dueDate: string;
  paidAt: string | null;
}

export interface StockEntry {
  id: string;
  date: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  supplier: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  paymentMethod: PaymentMethod;
  installments: number;
  createdBy: string;
  createdByName: string;
  approvedBy: string | null;
  approvedByName: string | null;
  createdAt: string;
}

export interface StockItem {
  id: string;
  stockEntryId: string;
  productId: string;
  productName: string;
  supplier: string;
  unitCost: number;
  entryDate: string;
  status: 'available' | 'exited';
  exitId: string | null;
}

export interface StockExit {
  id: string;
  stockItemIds: string[];
  productId: string;
  productName: string;
  supplier: string;
  quantity: number;
  totalCost: number;
  entryDate: string;
  exitDate: string;
  observation: string;
  createdBy: string;
  createdByName: string;
  confirmedBy: string | null;
  confirmedByName: string | null;
  confirmedAt: string | null;
}

// Dashboard Stats
export interface DashboardStats {
  totalProducts: number;
  pendingOrders: number;
  totalStockValue: number;
  stockItemsCount: number;
  monthlyEntries: number;
  monthlyExits: number;
}

// API Response types (para quando conectar com GCP)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
