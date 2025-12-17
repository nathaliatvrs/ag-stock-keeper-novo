/**
 * API Service for AG Consultoria Inventory System
 * 
 * This file contains all API calls that will connect to your GCP backend.
 * Currently using mock data - replace with actual API calls when ready.
 * 
 * ================================================================
 * DOCUMENTAÇÃO DOS ENDPOINTS NECESSÁRIOS PARA O BACKEND GCP
 * ================================================================
 * 
 * Base URL: https://your-gcp-api.com/api/v1
 * 
 * AUTENTICAÇÃO:
 * - POST /auth/login - Login do usuário
 * - POST /auth/logout - Logout
 * - GET /auth/me - Dados do usuário logado
 * 
 * PRODUTOS:
 * - GET /products - Lista todos os produtos
 * - GET /products/:id - Busca produto por ID
 * - POST /products - Cria novo produto
 * - PUT /products/:id - Atualiza produto
 * - DELETE /products/:id - Remove produto
 * 
 * PEDIDOS:
 * - GET /orders - Lista todos os pedidos
 * - GET /orders/:id - Busca pedido por ID
 * - POST /orders - Cria novo pedido
 * - PUT /orders/:id - Atualiza pedido
 * - PUT /orders/:id/approve - Aprova pedido (admin only)
 * - PUT /orders/:id/reject - Rejeita pedido (admin only)
 * 
 * ENTRADA DE ESTOQUE:
 * - GET /stock-entries - Lista todas as entradas
 * - GET /stock-entries/:id - Busca entrada por ID
 * - POST /stock-entries - Cria nova entrada (gera StockItems automaticamente)
 * 
 * ITENS DE ESTOQUE (view explodida):
 * - GET /stock-items - Lista todos os itens
 * - GET /stock-items?status=available - Filtra por status
 * - GET /stock-items?productId=xxx - Filtra por produto
 * 
 * SAÍDAS DE ESTOQUE:
 * - GET /stock-exits - Lista todas as saídas
 * - GET /stock-exits/:id - Busca saída por ID
 * - POST /stock-exits - Cria nova saída
 * - PUT /stock-exits/:id/confirm - Confirma saída (admin only)
 * 
 * PARCELAS DE PAGAMENTO:
 * - GET /installments?stockEntryId=xxx - Lista parcelas de uma entrada
 * 
 * DASHBOARD:
 * - GET /dashboard/stats - Estatísticas do dashboard
 * 
 * ================================================================
 */

import { 
  Product, 
  Order, 
  StockEntry, 
  StockItem, 
  StockExit,
  DashboardStats,
  ApiResponse,
  User,
  PaymentMethod
} from '@/types';

import {
  mockProducts,
  mockOrders,
  mockStockEntries,
  mockStockItems,
  mockStockExits,
  mockDashboardStats,
  currentUser,
  adminUser,
} from './mockData';

// Simulated delay to mimic API latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============ AUTH ============

export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  await delay(300);
  // Toggle between user and admin for testing
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  return { success: true, data: isAdmin ? adminUser : currentUser };
};

export const login = async (email: string, password: string): Promise<ApiResponse<User>> => {
  await delay(500);
  // Mock login - replace with actual API call
  if (email && password) {
    const isAdmin = email.includes('admin');
    localStorage.setItem('isAdmin', String(isAdmin));
    return { success: true, data: isAdmin ? adminUser : currentUser };
  }
  return { success: false, error: 'Credenciais inválidas' };
};

export const logout = async (): Promise<ApiResponse<null>> => {
  await delay(300);
  localStorage.removeItem('isAdmin');
  return { success: true };
};

// ============ PRODUCTS ============

let products = [...mockProducts];

export const getProducts = async (): Promise<ApiResponse<Product[]>> => {
  await delay(300);
  return { success: true, data: products };
};

export const getProductById = async (id: string): Promise<ApiResponse<Product>> => {
  await delay(200);
  const product = products.find(p => p.id === id);
  if (product) {
    return { success: true, data: product };
  }
  return { success: false, error: 'Produto não encontrado' };
};

export const createProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> => {
  await delay(400);
  const newProduct: Product = {
    ...product,
    id: `prod-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  products = [...products, newProduct];
  return { success: true, data: newProduct, message: 'Produto cadastrado com sucesso!' };
};

export const updateProduct = async (id: string, data: Partial<Product>): Promise<ApiResponse<Product>> => {
  await delay(400);
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return { success: false, error: 'Produto não encontrado' };
  }
  products[index] = { ...products[index], ...data, updatedAt: new Date().toISOString() };
  return { success: true, data: products[index], message: 'Produto atualizado com sucesso!' };
};

export const deleteProduct = async (id: string): Promise<ApiResponse<null>> => {
  await delay(300);
  products = products.filter(p => p.id !== id);
  return { success: true, message: 'Produto removido com sucesso!' };
};

// ============ ORDERS ============

let orders = [...mockOrders];

export const getOrders = async (): Promise<ApiResponse<Order[]>> => {
  await delay(300);
  return { success: true, data: orders };
};

export const getOrderById = async (id: string): Promise<ApiResponse<Order>> => {
  await delay(200);
  const order = orders.find(o => o.id === id);
  if (order) {
    return { success: true, data: order };
  }
  return { success: false, error: 'Pedido não encontrado' };
};

export const createOrder = async (orderData: {
  orderNumber: string;
  date: string;
  productId: string;
  quantity: number;
}): Promise<ApiResponse<Order>> => {
  await delay(400);
  const product = products.find(p => p.id === orderData.productId);
  if (!product) {
    return { success: false, error: 'Produto não encontrado' };
  }

  const user = await getCurrentUser();
  const newOrder: Order = {
    id: `order-${Date.now()}`,
    orderNumber: orderData.orderNumber,
    date: orderData.date,
    productId: orderData.productId,
    productName: product.name,
    supplier: product.supplier,
    unitCost: product.unitCost,
    quantity: orderData.quantity,
    totalValue: product.unitCost * orderData.quantity,
    createdBy: user.data?.id || '',
    createdByName: user.data?.name || '',
    approvedBy: null,
    approvedByName: null,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orders = [...orders, newOrder];
  return { success: true, data: newOrder, message: 'Pedido criado com sucesso!' };
};

export const approveOrder = async (id: string): Promise<ApiResponse<Order>> => {
  await delay(400);
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) {
    return { success: false, error: 'Pedido não encontrado' };
  }
  orders[index] = { 
    ...orders[index], 
    status: 'approved',
    approvedBy: adminUser.id,
    approvedByName: adminUser.name,
  };
  return { success: true, data: orders[index], message: 'Pedido aprovado!' };
};

export const rejectOrder = async (id: string): Promise<ApiResponse<Order>> => {
  await delay(400);
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) {
    return { success: false, error: 'Pedido não encontrado' };
  }
  orders[index] = { ...orders[index], status: 'rejected' };
  return { success: true, data: orders[index], message: 'Pedido rejeitado!' };
};

// ============ STOCK ENTRIES ============

let stockEntries = [...mockStockEntries];
let stockItems = [...mockStockItems];

export const getStockEntries = async (): Promise<ApiResponse<StockEntry[]>> => {
  await delay(300);
  return { success: true, data: stockEntries };
};

export const createStockEntry = async (entryData: {
  orderId: string;
  date: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  installments: number;
}): Promise<ApiResponse<StockEntry>> => {
  await delay(500);
  
  const order = orders.find(o => o.id === entryData.orderId);
  if (!order) {
    return { success: false, error: 'Pedido não encontrado' };
  }

  const user = await getCurrentUser();
  const newEntry: StockEntry = {
    id: `entry-${Date.now()}`,
    date: entryData.date,
    orderId: order.id,
    orderNumber: order.orderNumber,
    productId: order.productId,
    productName: order.productName,
    supplier: order.supplier,
    quantity: entryData.quantity,
    unitCost: order.unitCost,
    totalValue: order.unitCost * entryData.quantity,
    paymentMethod: entryData.paymentMethod,
    installments: entryData.installments,
    createdBy: user.data?.id || '',
    createdByName: user.data?.name || '',
    approvedBy: adminUser.id,
    approvedByName: adminUser.name,
    createdAt: new Date().toISOString(),
  };
  
  stockEntries = [...stockEntries, newEntry];
  
  // Create individual stock items (exploded view)
  const newItems: StockItem[] = Array.from({ length: entryData.quantity }, (_, i) => ({
    id: `item-${Date.now()}-${i}`,
    stockEntryId: newEntry.id,
    productId: order.productId,
    productName: order.productName,
    supplier: order.supplier,
    unitCost: order.unitCost,
    entryDate: entryData.date,
    status: 'available' as const,
    exitId: null,
  }));
  
  stockItems = [...stockItems, ...newItems];
  
  return { success: true, data: newEntry, message: 'Entrada de estoque registrada!' };
};

// ============ STOCK ITEMS ============

export const getStockItems = async (filters?: { 
  status?: 'available' | 'exited';
  productId?: string;
}): Promise<ApiResponse<StockItem[]>> => {
  await delay(300);
  let filtered = [...stockItems];
  
  if (filters?.status) {
    filtered = filtered.filter(item => item.status === filters.status);
  }
  if (filters?.productId) {
    filtered = filtered.filter(item => item.productId === filters.productId);
  }
  
  return { success: true, data: filtered };
};

// ============ STOCK EXITS ============

let stockExits = [...mockStockExits];

export const getStockExits = async (): Promise<ApiResponse<StockExit[]>> => {
  await delay(300);
  return { success: true, data: stockExits };
};

export const createStockExit = async (exitData: {
  stockItemIds: string[];
  exitDate: string;
  observation: string;
}): Promise<ApiResponse<StockExit>> => {
  await delay(500);
  
  const items = stockItems.filter(item => exitData.stockItemIds.includes(item.id));
  if (items.length === 0) {
    return { success: false, error: 'Itens não encontrados' };
  }

  const user = await getCurrentUser();
  const newExit: StockExit = {
    id: `exit-${Date.now()}`,
    stockItemIds: exitData.stockItemIds,
    productId: items[0].productId,
    productName: items[0].productName,
    supplier: items[0].supplier,
    quantity: items.length,
    totalCost: items.reduce((sum, item) => sum + item.unitCost, 0),
    entryDate: items[0].entryDate,
    exitDate: exitData.exitDate,
    observation: exitData.observation,
    createdBy: user.data?.id || '',
    createdByName: user.data?.name || '',
    confirmedBy: null,
    confirmedByName: null,
    confirmedAt: null,
  };
  
  stockExits = [...stockExits, newExit];
  
  // Update stock items status
  stockItems = stockItems.map(item => 
    exitData.stockItemIds.includes(item.id) 
      ? { ...item, status: 'exited' as const, exitId: newExit.id }
      : item
  );
  
  return { success: true, data: newExit, message: 'Saída de estoque registrada!' };
};

export const confirmStockExit = async (id: string): Promise<ApiResponse<StockExit>> => {
  await delay(400);
  const index = stockExits.findIndex(e => e.id === id);
  if (index === -1) {
    return { success: false, error: 'Saída não encontrada' };
  }
  stockExits[index] = { 
    ...stockExits[index], 
    confirmedBy: adminUser.id,
    confirmedByName: adminUser.name,
    confirmedAt: new Date().toISOString(),
  };
  return { success: true, data: stockExits[index], message: 'Saída confirmada!' };
};

// ============ DASHBOARD ============

export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  await delay(300);
  
  const availableItems = stockItems.filter(item => item.status === 'available');
  const stats: DashboardStats = {
    totalProducts: products.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalStockValue: availableItems.reduce((sum, item) => sum + item.unitCost, 0),
    stockItemsCount: availableItems.length,
    monthlyEntries: stockEntries.reduce((sum, entry) => sum + entry.totalValue, 0),
    monthlyExits: stockExits.reduce((sum, exit) => sum + exit.totalCost, 0),
  };
  
  return { success: true, data: stats };
};
