import { useState, useEffect } from 'react';
import { Plus, Search, Download, Trash2 } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { getOrders, getStockEntries, getProducts, createStockEntry } from '@/services/api';
import { Order, StockEntry as StockEntryType, PaymentMethod, Product, OrderItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToExcel } from '@/lib/excel';
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

interface InvoiceFormItem {
  orderItemId: string;
  quantity: string;
  adjustedUnitCost: string;
}

interface InvoiceForm {
  invoiceNumber: string;
  items: InvoiceFormItem[];
}

export default function StockEntry() {
  const [entries, setEntries] = useState<StockEntryType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [approvedOrders, setApprovedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    orderId: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: '' as PaymentMethod | '',
    installments: '1',
    firstDueDate: new Date().toISOString().split('T')[0],
    invoices: [] as InvoiceForm[],
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [entriesRes, ordersRes, productsRes] = await Promise.all([
        getStockEntries(),
        getOrders(),
        getProducts(),
      ]);
      
      if (entriesRes.success && entriesRes.data) {
        setEntries(entriesRes.data);
      }
      if (ordersRes.success && ordersRes.data) {
        // Filtra pedidos com pelo menos um item aprovado
        setApprovedOrders(ordersRes.data.filter((o) => 
          o.status === 'approved' || o.status === 'partial'
        ));
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

  const selectedOrder = approvedOrders.find((o) => o.id === formData.orderId);
  const approvedItems = selectedOrder?.items.filter(item => item.status === 'approved') || [];

  // Calcula o total de todas as NFs
  const calculateTotalValue = () => {
    return formData.invoices.reduce((total, inv) => {
      return total + inv.items.reduce((invTotal, item) => {
        const qty = parseInt(item.quantity) || 0;
        const cost = parseFloat(item.adjustedUnitCost) || 0;
        return invTotal + (qty * cost);
      }, 0);
    }, 0);
  };

  const totalValue = calculateTotalValue();
  const installmentValue = totalValue && parseInt(formData.installments) > 0
    ? totalValue / parseInt(formData.installments)
    : 0;

  const filteredEntries = entries.filter(
    (entry) =>
      entry.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.invoices.some(inv => 
        inv.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
  );

  const getEntryProductsDisplay = (entry: StockEntryType) => {
    const names = entry.invoices.flatMap(inv => inv.items.map(item => item.productName));
    if (names.length === 1) return names[0];
    return `${names[0]} +${names.length - 1}`;
  };

  const handleExport = () => {
    const dataToExport: any[] = [];
    filteredEntries.forEach((entry) => {
      entry.invoices.forEach((inv) => {
        inv.items.forEach((item) => {
          const product = products.find(p => p.id === item.productId);
          dataToExport.push({
            'Nº Pedido': entry.orderNumber,
            'NF': inv.invoiceNumber,
            'Data Entrada': formatDate(entry.date),
            'Produto': item.productName,
            'Fornecedor': item.supplier,
            'Unidade': product?.unitType || '-',
            'Quantidade': item.quantity,
            'Custo Unit.': item.adjustedUnitCost,
            'Valor Total': item.totalValue,
            'Pagamento': getPaymentMethodLabel(entry.paymentMethod),
            'Parcelas': entry.installments,
            'Responsável': entry.createdByName,
          });
        });
      });
    });
    exportToExcel(dataToExport, 'entradas_estoque');
    toast({ title: 'Sucesso', description: 'Arquivo exportado com sucesso!' });
  };

  const handleAddInvoice = () => {
    setFormData({
      ...formData,
      invoices: [...formData.invoices, { invoiceNumber: '', items: [] }],
    });
  };

  const handleRemoveInvoice = (index: number) => {
    const newInvoices = formData.invoices.filter((_, i) => i !== index);
    setFormData({ ...formData, invoices: newInvoices });
  };

  const handleInvoiceChange = (invIndex: number, field: string, value: string) => {
    const newInvoices = [...formData.invoices];
    newInvoices[invIndex] = { ...newInvoices[invIndex], [field]: value };
    setFormData({ ...formData, invoices: newInvoices });
  };

  const handleToggleItemInInvoice = (invIndex: number, orderItem: OrderItem) => {
    const newInvoices = [...formData.invoices];
    const existingIndex = newInvoices[invIndex].items.findIndex(i => i.orderItemId === orderItem.id);
    
    if (existingIndex >= 0) {
      newInvoices[invIndex].items.splice(existingIndex, 1);
    } else {
      newInvoices[invIndex].items.push({
        orderItemId: orderItem.id,
        quantity: orderItem.quantity.toString(),
        adjustedUnitCost: orderItem.unitCost.toString(),
      });
    }
    setFormData({ ...formData, invoices: newInvoices });
  };

  const handleItemFieldChange = (invIndex: number, itemIndex: number, field: string, value: string) => {
    const newInvoices = [...formData.invoices];
    newInvoices[invIndex].items[itemIndex] = { ...newInvoices[invIndex].items[itemIndex], [field]: value };
    setFormData({ ...formData, invoices: newInvoices });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.paymentMethod) {
      toast({ title: 'Erro', description: 'Selecione uma forma de pagamento.', variant: 'destructive' });
      return;
    }

    if (formData.invoices.length === 0 || formData.invoices.every(inv => inv.items.length === 0)) {
      toast({ title: 'Erro', description: 'Adicione pelo menos uma NF com produtos.', variant: 'destructive' });
      return;
    }

    try {
      const response = await createStockEntry({
        orderId: formData.orderId,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        installments: parseInt(formData.installments),
        firstDueDate: formData.firstDueDate,
        invoices: formData.invoices.map(inv => ({
          invoiceNumber: inv.invoiceNumber,
          items: inv.items.map(item => ({
            orderItemId: item.orderItemId,
            quantity: parseInt(item.quantity),
            adjustedUnitCost: parseFloat(item.adjustedUnitCost),
          })),
        })),
      });
      
      if (response.success) {
        toast({ title: 'Sucesso', description: response.message });
        fetchData();
        setDialogOpen(false);
        navigate('/estoque/consultar');
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível registrar a entrada.', variant: 'destructive' });
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    return paymentMethods.find((m) => m.value === method)?.label || method;
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: '' as PaymentMethod | '',
      installments: '1',
      firstDueDate: new Date().toISOString().split('T')[0],
      invoices: [],
    });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Entrada de Estoque</h1>
          <p className="text-muted-foreground mt-1">Registre a entrada de produtos no estoque</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Entrada
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle>Entradas Registradas</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar entradas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>NFs</TableHead>
                  <TableHead>Data Entrada</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Qtd. Total</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma entrada encontrada</TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.orderNumber}</TableCell>
                      <TableCell>{entry.invoices.map(inv => inv.invoiceNumber).join(', ')}</TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell title={entry.invoices.flatMap(inv => inv.items.map(i => i.productName)).join(', ')}>
                        {getEntryProductsDisplay(entry)}
                      </TableCell>
                      <TableCell>{entry.totalQuantity}</TableCell>
                      <TableCell>{formatCurrency(entry.totalValue)}</TableCell>
                      <TableCell><Badge variant="outline">{getPaymentMethodLabel(entry.paymentMethod)}</Badge></TableCell>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Entrada de Estoque</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Pedido Aprovado</Label>
              <Select value={formData.orderId} onValueChange={(value) => setFormData({ ...formData, orderId: value, invoices: [] })}>
                <SelectTrigger><SelectValue placeholder="Selecione um pedido aprovado" /></SelectTrigger>
                <SelectContent>
                  {approvedOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.orderNumber} - {order.items.filter(i => i.status === 'approved').length} item(s) aprovado(s)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOrder && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data da Entrada</Label>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as PaymentMethod })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (<SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Parcelas</Label>
                    <Select value={formData.installments} onValueChange={(value) => setFormData({ ...formData, installments: value })} disabled={formData.paymentMethod === 'pix'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {installmentOptions.map((option) => (<SelectItem key={option.value} value={option.value.toString()}>{option.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data do Primeiro Vencimento</Label>
                    <Input type="date" value={formData.firstDueDate} onChange={(e) => setFormData({ ...formData, firstDueDate: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Notas Fiscais</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddInvoice}>
                      <Plus className="h-3 w-3 mr-1" />Adicionar NF
                    </Button>
                  </div>

                  {formData.invoices.map((inv, invIndex) => (
                    <div key={invIndex} className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input placeholder="Número da NF" value={inv.invoiceNumber} onChange={(e) => handleInvoiceChange(invIndex, 'invoiceNumber', e.target.value)} className="flex-1" />
                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveInvoice(invIndex)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Selecione os produtos desta NF:</Label>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                          {approvedItems.map((orderItem) => {
                            const isSelected = inv.items.some(i => i.orderItemId === orderItem.id);
                            const itemData = inv.items.find(i => i.orderItemId === orderItem.id);
                            const itemIndex = inv.items.findIndex(i => i.orderItemId === orderItem.id);
                            
                            return (
                              <div key={orderItem.id} className="p-2 border rounded bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <Checkbox checked={isSelected} onCheckedChange={() => handleToggleItemInInvoice(invIndex, orderItem)} />
                                  <span className="flex-1 text-sm">{orderItem.productName} ({orderItem.supplier})</span>
                                </div>
                                {isSelected && itemData && (
                                  <div className="grid grid-cols-2 gap-2 mt-2 pl-6">
                                    <div>
                                      <Label className="text-xs">Quantidade</Label>
                                      <Input type="number" min="1" max={orderItem.quantity} value={itemData.quantity} onChange={(e) => handleItemFieldChange(invIndex, itemIndex, 'quantity', e.target.value)} className="h-8" />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Custo Unit. Ajustado</Label>
                                      <Input type="number" step="0.01" value={itemData.adjustedUnitCost} onChange={(e) => handleItemFieldChange(invIndex, itemIndex, 'adjustedUnitCost', e.target.value)} className="h-8" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalValue > 0 && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span>Total do Pedido:</span>
                      <span className="text-xl font-bold text-primary">{formatCurrency(totalValue)}</span>
                    </div>
                    {parseInt(formData.installments) > 1 && (
                      <p className="text-sm text-muted-foreground mt-1">{formData.installments}x de {formatCurrency(installmentValue)}</p>
                    )}
                  </div>
                )}
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!selectedOrder || formData.invoices.length === 0}>Registrar Entrada</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}