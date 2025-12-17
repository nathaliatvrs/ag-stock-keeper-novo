import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
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
import { getOrders, getStockEntries, createStockEntry } from '@/services/api';
import { Order, StockEntry as StockEntryType, PaymentMethod } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'boleto', label: 'Boleto Bancário' },
  { value: 'pix', label: 'PIX' },
];

const installmentOptions = [
  { value: 1, label: 'À Vista' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' },
  { value: 5, label: '5x' },
  { value: 6, label: '6x' },
  { value: 10, label: '10x' },
  { value: 12, label: '12x' },
];

export default function StockEntry() {
  const [entries, setEntries] = useState<StockEntryType[]>([]);
  const [approvedOrders, setApprovedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    orderId: '',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    paymentMethod: '' as PaymentMethod | '',
    installments: '1',
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [entriesRes, ordersRes] = await Promise.all([
        getStockEntries(),
        getOrders(),
      ]);
      
      if (entriesRes.success && entriesRes.data) {
        setEntries(entriesRes.data);
      }
      if (ordersRes.success && ordersRes.data) {
        setApprovedOrders(ordersRes.data.filter((o) => o.status === 'approved'));
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

  const selectedOrder = approvedOrders.find((o) => o.id === formData.orderId);
  const calculatedTotal = selectedOrder && formData.quantity 
    ? selectedOrder.unitCost * parseInt(formData.quantity)
    : 0;
  const installmentValue = calculatedTotal && parseInt(formData.installments) > 0
    ? calculatedTotal / parseInt(formData.installments)
    : 0;

  const filteredEntries = entries.filter(
    (entry) =>
      entry.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.paymentMethod) {
      toast({
        title: 'Erro',
        description: 'Selecione uma forma de pagamento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await createStockEntry({
        orderId: formData.orderId,
        date: formData.date,
        quantity: parseInt(formData.quantity),
        paymentMethod: formData.paymentMethod,
        installments: parseInt(formData.installments),
      });
      
      if (response.success) {
        toast({ title: 'Sucesso', description: response.message });
        fetchData();
        setDialogOpen(false);
        // Navigate to stock consultation after entry
        navigate('/estoque/consultar');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a entrada.',
        variant: 'destructive',
      });
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    return paymentMethods.find((m) => m.value === method)?.label || method;
  };

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
          <h1 className="text-3xl font-bold text-foreground">Entrada de Estoque</h1>
          <p className="text-muted-foreground mt-1">
            Registre a entrada de produtos no estoque
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Entrada
        </Button>
      </div>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle>Entradas Registradas</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar entradas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Data Entrada</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nenhuma entrada encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.orderNumber}</TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>{entry.productName}</TableCell>
                      <TableCell>{entry.supplier}</TableCell>
                      <TableCell>{entry.quantity}</TableCell>
                      <TableCell>{formatCurrency(entry.totalValue)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPaymentMethodLabel(entry.paymentMethod)}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.installments}x</TableCell>
                      <TableCell>{entry.createdByName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Entrada de Estoque</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order">Pedido Aprovado</Label>
              <Select
                value={formData.orderId}
                onValueChange={(value) => setFormData({ ...formData, orderId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um pedido aprovado" />
                </SelectTrigger>
                <SelectContent>
                  {approvedOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.orderNumber} - {order.productName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOrder && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Produto</p>
                  <p className="font-medium">{selectedOrder.productName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{selectedOrder.supplier}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Custo Unitário</p>
                  <p className="font-medium">{formatCurrency(selectedOrder.unitCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Qtd. Pedida</p>
                  <p className="font-medium">{selectedOrder.quantity}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data da Entrada</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedOrder?.quantity}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as PaymentMethod })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="installments">Parcelas</Label>
                <Select
                  value={formData.installments}
                  onValueChange={(value) => setFormData({ ...formData, installments: value })}
                  disabled={formData.paymentMethod === 'pix'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {installmentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {calculatedTotal > 0 && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor Total:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(calculatedTotal)}
                  </span>
                </div>
                {parseInt(formData.installments) > 1 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Valor por Parcela:</span>
                    <span className="font-medium">
                      {formData.installments}x de {formatCurrency(installmentValue)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.orderId || !formData.quantity || !formData.paymentMethod}
              >
                Registrar Entrada
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
