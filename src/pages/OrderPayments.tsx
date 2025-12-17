import { useState, useEffect } from 'react';
import { Search, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { getPaymentInstallments, getStockEntries, getProducts } from '@/services/api';
import { PaymentInstallment, StockEntry as StockEntryType, Product } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToExcel } from '@/lib/excel';

export default function OrderPayments() {
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [entries, setEntries] = useState<StockEntryType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [installmentsRes, entriesRes, productsRes] = await Promise.all([
          getPaymentInstallments(),
          getStockEntries(),
          getProducts(),
        ]);
        if (installmentsRes.success && installmentsRes.data) {
          setInstallments(installmentsRes.data);
        }
        if (entriesRes.success && entriesRes.data) {
          setEntries(entriesRes.data);
        }
        if (productsRes.success && productsRes.data) {
          setProducts(productsRes.data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getEntryInfo = (stockEntryId: string) => {
    return entries.find((e) => e.id === stockEntryId);
  };

  const getProductInfo = (productId: string) => {
    return products.find((p) => p.id === productId);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const filteredInstallments = installments.filter((inst) => {
    const entry = getEntryInfo(inst.stockEntryId);
    const matchesSearch = 
      entry?.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry?.productName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isPaid = inst.paidAt !== null;
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'paid' && isPaid) ||
      (statusFilter === 'pending' && !isPaid);
    
    return matchesSearch && matchesStatus;
  });

  const totalPending = filteredInstallments
    .filter((i) => !i.paidAt)
    .reduce((sum, i) => sum + i.value, 0);

  const totalPaid = filteredInstallments
    .filter((i) => i.paidAt)
    .reduce((sum, i) => sum + i.value, 0);

  const handleExport = () => {
    const dataToExport = filteredInstallments.map((inst) => {
      const entry = getEntryInfo(inst.stockEntryId);
      const product = entry ? getProductInfo(entry.productId) : null;
      return {
        'Nº Pedido': entry?.orderNumber || '-',
        'Produto': entry?.productName || '-',
        'Fornecedor': entry?.supplier || '-',
        'Unidade': product?.unitType || '-',
        'Parcela': `${inst.installmentNumber}/${entry?.installments || '-'}`,
        'Valor': inst.value,
        'Vencimento': formatDate(inst.dueDate),
        'Status': inst.paidAt ? 'Pago' : isOverdue(inst.dueDate) ? 'Vencido' : 'Pendente',
        'Data Pagamento': inst.paidAt ? formatDate(inst.paidAt) : '-',
      };
    });
    exportToExcel(dataToExport, 'pagamentos_pedidos');
    toast({ title: 'Sucesso', description: 'Arquivo exportado com sucesso!' });
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
          <h1 className="text-3xl font-bold text-foreground">Pagamento de Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Controle de parcelas e vencimentos
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pendente</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(totalPending)}</p>
              </div>
              <Calendar className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalPaid)}</p>
              </div>
              <Badge className="bg-success text-success-foreground">Pago</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Parcelas</p>
                <p className="text-2xl font-bold text-primary">{filteredInstallments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Parcelas</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por pedido ou produto..."
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
                  <SelectItem value="paid">Pago</SelectItem>
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
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstallments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhuma parcela encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInstallments.map((inst) => {
                    const entry = getEntryInfo(inst.stockEntryId);
                    const product = entry ? getProductInfo(entry.productId) : null;
                    const isPaid = inst.paidAt !== null;
                    const overdue = !isPaid && isOverdue(inst.dueDate);

                    return (
                      <TableRow key={inst.id} className={overdue ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-medium">{entry?.orderNumber || '-'}</TableCell>
                        <TableCell>{entry?.productName || '-'}</TableCell>
                        <TableCell>{entry?.supplier || '-'}</TableCell>
                        <TableCell className="capitalize">{product?.unitType || '-'}</TableCell>
                        <TableCell>{inst.installmentNumber}/{entry?.installments || '-'}</TableCell>
                        <TableCell>{formatCurrency(inst.value)}</TableCell>
                        <TableCell>{formatDate(inst.dueDate)}</TableCell>
                        <TableCell>
                          {isPaid ? (
                            <Badge className="bg-success text-success-foreground">Pago</Badge>
                          ) : overdue ? (
                            <Badge variant="destructive">Vencido</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-warning text-warning-foreground">Pendente</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
