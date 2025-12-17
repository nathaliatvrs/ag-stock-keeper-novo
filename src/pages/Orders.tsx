import { useState, useEffect } from 'react';
import { Plus, Search, Check, X, ArrowUpDown, Download } from 'lucide-react';
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
import { getOrders, getProducts, createOrder, approveOrder, rejectOrder } from '@/services/api';
import { Order, Product } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToExcel } from '@/lib/excel';

type SortField = 'date' | 'supplier' | 'totalValue' | 'orderNumber';
type SortDirection = 'asc' | 'desc';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    orderNumber: '',
    date: new Date().toISOString().split('T')[0],
    productId: '',
    quantity: '',
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

  const selectedProduct = products.find((p) => p.id === formData.productId);
  const calculatedTotal = selectedProduct && formData.quantity 
    ? selectedProduct.unitCost * parseInt(formData.quantity)
    : 0;

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
        order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'supplier':
          comparison = a.supplier.localeCompare(b.supplier);
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
    const dataToExport = filteredAndSortedOrders.map((order) => {
      const product = products.find(p => p.id === order.productId);
      return {
        'Nº Pedido': order.orderNumber,
        'Data': formatDate(order.date),
        'Produto': order.productName,
        'Fornecedor': order.supplier,
        'Unidade': product?.unitType || '-',
        'Quantidade': order.quantity,
        'Valor Total': order.totalValue,
        'Solicitante': order.createdByName,
        'Status': order.status === 'approved' ? 'Aprovado' : order.status === 'pending' ? 'Pendente' : 'Rejeitado',
        'Aprovador': order.approvedByName || '-',
      };
    });
    exportToExcel(dataToExport, 'pedidos');
    toast({ title: 'Sucesso', description: 'Arquivo exportado com sucesso!' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await createOrder({
        orderNumber: formData.orderNumber,
        date: formData.date,
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
      });
      
      if (response.success) {
        toast({ title: 'Sucesso', description: response.message });
        fetchData();
        setDialogOpen(false);
        setFormData({
          orderNumber: '',
          date: new Date().toISOString().split('T')[0],
          productId: '',
          quantity: '',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o pedido.',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (orderId: string) => {
    try {
      const response = await approveOrder(orderId);
      if (response.success) {
        toast({ title: 'Sucesso', description: response.message });
        fetchData();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar o pedido.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      const response = await rejectOrder(orderId);
      if (response.success) {
        toast({ title: 'Sucesso', description: response.message });
        fetchData();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar o pedido.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Aprovado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
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
          <Button onClick={() => setDialogOpen(true)}>
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
                  <TableHead><SortButton field="orderNumber">Nº Pedido</SortButton></TableHead>
                  <TableHead><SortButton field="date">Data</SortButton></TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead><SortButton field="supplier">Fornecedor</SortButton></TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead><SortButton field="totalValue">Valor Total</SortButton></TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aprovador</TableHead>
                  {isAdmin && (
                    <TableHead className="text-right">Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                      Nenhum pedido encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedOrders.map((order) => {
                    const product = products.find(p => p.id === order.productId);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{formatDate(order.date)}</TableCell>
                        <TableCell>{order.productName}</TableCell>
                        <TableCell>{order.supplier}</TableCell>
                        <TableCell className="capitalize">{product?.unitType || '-'}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>{formatCurrency(order.totalValue)}</TableCell>
                        <TableCell>{order.createdByName}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{order.approvedByName || '-'}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {order.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleApprove(order.id)}
                                  className="text-success hover:text-success hover:bg-success/10"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReject(order.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Pedido</DialogTitle>
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
            
            <div className="space-y-2">
              <Label htmlFor="product">Produto</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
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

            {selectedProduct && (
              <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{selectedProduct.supplier}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Custo Unitário</p>
                  <p className="font-medium">{formatCurrency(selectedProduct.unitCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unidade</p>
                  <p className="font-medium capitalize">{selectedProduct.unitType}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                placeholder="0"
              />
            </div>

            {calculatedTotal > 0 && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor Total do Pedido:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(calculatedTotal)}
                  </span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!formData.productId || !formData.quantity}>
                Criar Pedido
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
