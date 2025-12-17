import { useState, useEffect } from 'react';
import { Plus, Search, Check, X, ArrowUpDown, Download, Pencil, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders, getProducts, createOrder, approveOrder, rejectOrder, updateOrder, approveOrderItem, rejectOrderItem } from '@/services/api';
import { Order, Product, OrderItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToExcel } from '@/lib/excel';

type SortField = 'date' | 'totalValue' | 'orderNumber';
type SortDirection = 'asc' | 'desc';

interface OrderFormItem {
  productId: string;
  quantity: string;
}

const MAX_ITEMS_PER_ORDER = 50;

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'partial'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    orderNumber: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ productId: '', quantity: '' }] as OrderFormItem[],
  });
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);
      
      if (ordersRes.success && ordersRes.data) {
        setOrders(ordersRes.data);
      }
      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      if (product && item.quantity) {
        return total + (product.unitCost * parseInt(item.quantity));
      }
      return total;
    }, 0);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedOrders = orders
    .filter((order) => {
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'totalValue':
          comparison = a.totalValue - b.totalValue;
          break;
        case 'orderNumber':
          comparison = a.orderNumber.localeCompare(b.orderNumber);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleExport = () => {
    const dataToExport: any[] = [];
    filteredAndSortedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find(p => p.id === item.productId);
        dataToExport.push({
          'Nº Pedido': order.orderNumber,
          'Data': formatDate(order.date),
          'Produto': item.productName,
          'Fornecedor': item.supplier,
          'Unidade': product?.unitType || '-',
          'Quantidade': item.quantity,
          'Valor Item': item.totalValue,
          'Status Item': item.status === 'approved' ? 'Aprovado' : item.status === 'pending' ? 'Pendente' : 'Rejeitado',
          'Solicitante': order.createdByName,
          'Status Pedido': getStatusLabel(order.status),
        });
      });
    });
    exportToExcel(dataToExport, 'pedidos');
    toast({ title: 'Sucesso', description: 'Arquivo exportado com sucesso!' });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      case 'partial': return 'Parcial';
      default: return status;
    }
  };

  const handleOpenDialog = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        orderNumber: order.orderNumber,
        date: order.date,
        items: order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity.toString(),
        })),
      });
    } else {
      setEditingOrder(null);
      setFormData({
        orderNumber: '',
        date: new Date().toISOString().split('T')[0],
        items: [{ productId: '', quantity: '' }],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingOrder(null);
    setFormData({
      orderNumber: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ productId: '', quantity: '' }],
    });
  };

  const handleAddItem = () => {
    if (formData.items.length < MAX_ITEMS_PER_ORDER) {
      setFormData({
        ...formData,
        items: [...formData.items, { productId: '', quantity: '' }],
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = formData.items.filter(item => item.productId && item.quantity);
    if (validItems.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um produto ao pedido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const orderPayload = {
        orderNumber: formData.orderNumber,
        date: formData.date,
        items: validItems.map(item => ({
          productId: item.productId,
          quantity: parseInt(item.quantity),
        })),
      };

      let response;
      if (editingOrder) {
        response = await updateOrder(editingOrder.id, orderPayload, isAdmin);
      } else {
        response = await createOrder(orderPayload);
      }
      
      if (response.success) {
        toast({ title: 'Sucesso', description: response.message });
        fetchData();
        handleCloseDialog();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: editingOrder ? 'Não foi possível atualizar o pedido.' : 'Não foi possível criar o pedido.',
        variant: 'destructive',
      });
    }
  };

  const handleApproveAll = async (orderId: string) => {
    try {
      const response = await approveOrder(orderId);
      if (response.success) {
        toast({ title: 'Sucesso', description: response.message });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível aprovar o pedido.', variant: 'destructive' });
    }
  };

  const handleRejectAll = async (orderId: string) => {
    try {
      const response = await rejectOrder(orderId);
      if (response.success) {
        toast({ title: 'Sucesso', description: response.message });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível rejeitar o pedido.', variant: 'destructive' });
    }
  };

  const handleApproveItem = async (orderId: string, itemId: string) => {
    try {
      const response = await approveOrderItem(orderId, itemId);
      if (response.success) {
        toast({ title: 'Sucesso', description: response.message });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível aprovar o item.', variant: 'destructive' });
    }
  };

  const handleRejectItem = async (orderId: string, itemId: string) => {
    try {
      const response = await rejectOrderItem(orderId, itemId);
      if (response.success) {
        toast({ title: 'Sucesso', description: response.message });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível rejeitar o item.', variant: 'destructive' });
    }
  };

  const toggleExpandOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Aprovado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'partial':
        return <Badge variant="outline" className="border-primary text-primary">Parcial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os pedidos de produtos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Lista de Pedidos</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pedidos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead><SortButton field="orderNumber">Nº Pedido</SortButton></TableHead>
                  <TableHead><SortButton field="date">Data</SortButton></TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead><SortButton field="totalValue">Valor Total</SortButton></TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhum pedido encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedOrders.map((order) => (
                    <>
                      <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpandOrder(order.id)}>
                        <TableCell>
                          {expandedOrders.has(order.id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{formatDate(order.date)}</TableCell>
                        <TableCell>{order.items.length} produto(s)</TableCell>
                        <TableCell>{formatCurrency(order.totalValue)}</TableCell>
                        <TableCell>{order.createdByName}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(order)}
                              title="Editar pedido"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {isAdmin && (order.status === 'pending' || order.status === 'partial') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleApproveAll(order.id)}
                                  className="text-success hover:text-success hover:bg-success/10"
                                  title="Aprovar todos"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRejectAll(order.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Rejeitar todos"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedOrders.has(order.id) && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={8} className="p-0">
                            <div className="p-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Fornecedor</TableHead>
                                    <TableHead>Unidade</TableHead>
                                    <TableHead>Qtd.</TableHead>
                                    <TableHead>Custo Unit.</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                    {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {order.items.map((item) => {
                                    const product = products.find(p => p.id === item.productId);
                                    return (
                                      <TableRow key={item.id}>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell>{item.supplier}</TableCell>
                                        <TableCell className="capitalize">{product?.unitType || '-'}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{formatCurrency(item.unitCost)}</TableCell>
                                        <TableCell>{formatCurrency(item.totalValue)}</TableCell>
                                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                                        {isAdmin && (
                                          <TableCell className="text-right">
                                            {item.status === 'pending' && (
                                              <div className="flex justify-end gap-1">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => handleApproveItem(order.id, item.id)}
                                                  className="h-7 w-7 text-success hover:text-success hover:bg-success/10"
                                                >
                                                  <Check className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => handleRejectItem(order.id, item.id)}
                                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            )}
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Editar Pedido' : 'Novo Pedido'}</DialogTitle>
            {editingOrder && !isAdmin && (
              <p className="text-sm text-muted-foreground">
                Ao salvar, o pedido voltará para aprovação.
              </p>
            )}
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderNumber">Número do Pedido</Label>
                <Input
                  id="orderNumber"
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  required
                  placeholder="PED-2024-XXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data do Pedido</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Produtos do Pedido</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  disabled={formData.items.length >= MAX_ITEMS_PER_ORDER}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar Produto
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.items.length}/{MAX_ITEMS_PER_ORDER} produtos
              </p>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {formData.items.map((item, index) => {
                  const selectedProduct = products.find(p => p.id === item.productId);
                  return (
                    <div key={index} className="p-3 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Produto</Label>
                          <Select
                            value={item.productId}
                            onValueChange={(value) => handleItemChange(index, 'productId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - {product.supplier}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      {selectedProduct && (
                        <div className="grid grid-cols-3 gap-2 text-xs bg-muted/50 p-2 rounded">
                          <div>
                            <span className="text-muted-foreground">Fornecedor:</span>
                            <p className="font-medium">{selectedProduct.supplier}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Custo Unit.:</span>
                            <p className="font-medium">{formatCurrency(selectedProduct.unitCost)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total:</span>
                            <p className="font-medium text-primary">
                              {item.quantity ? formatCurrency(selectedProduct.unitCost * parseInt(item.quantity)) : '-'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {calculateTotal() > 0 && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total do Pedido:</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingOrder ? 'Salvar Alterações' : 'Criar Pedido'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}