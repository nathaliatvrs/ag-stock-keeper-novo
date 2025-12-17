import { useState, useEffect, useMemo } from 'react';
import { Search, Download, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getPaymentInstallments, getStockEntries, getProducts } from '@/services/api';
import { PaymentInstallment, StockEntry as StockEntryType, Product, StockEntryInvoiceItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToExcel } from '@/lib/excel';

export default function OrderPayments() {
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [entries, setEntries] = useState<StockEntryType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
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

  // Extrai lista de fornecedores únicos para o filtro
  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Set<string>();
    entries.forEach(entry => {
      entry.invoices.forEach(inv => {
        inv.items.forEach(item => {
          suppliers.add(item.supplier);
        });
      });
    });
    return Array.from(suppliers).sort();
  }, [entries]);

  // Helper para extrair informações dos produtos de uma entrada
  const getEntryProductsInfo = (entry: StockEntryType) => {
    const productNames: string[] = [];
    const suppliers = new Set<string>();
    
    entry.invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        productNames.push(item.productName);
        suppliers.add(item.supplier);
      });
    });
    
    return {
      productNames: productNames.join(', '),
      suppliers: Array.from(suppliers).join(', '),
    };
  };

  // Extrai detalhes dos produtos por NF
  const getInvoiceDetails = (entry: StockEntryType) => {
    return entry.invoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      items: inv.items,
      totalValue: inv.totalValue,
    }));
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const filteredInstallments = installments.filter((inst) => {
    const entry = getEntryInfo(inst.stockEntryId);
    if (!entry) return false;
    
    const entryInfo = getEntryProductsInfo(entry);
    const matchesSearch = 
      entry.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entryInfo.productNames.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isPaid = inst.paidAt !== null;
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'paid' && isPaid) ||
      (statusFilter === 'pending' && !isPaid);

    // Filtro por fornecedor
    const matchesSupplier = supplierFilter === 'all' || 
      entry.invoices.some(inv => inv.items.some(item => item.supplier === supplierFilter));

    // Filtro por data de vencimento
    const dueDate = new Date(inst.dueDate);
    const matchesDueFrom = !dueDateFrom || dueDate >= new Date(dueDateFrom);
    const matchesDueTo = !dueDateTo || dueDate <= new Date(dueDateTo);
    
    return matchesSearch && matchesStatus && matchesSupplier && matchesDueFrom && matchesDueTo;
  });

  const totalPending = filteredInstallments
    .filter((i) => !i.paidAt)
    .reduce((sum, i) => sum + i.value, 0);

  const totalPaid = filteredInstallments
    .filter((i) => i.paidAt)
    .reduce((sum, i) => sum + i.value, 0);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleExport = () => {
    const dataToExport = filteredInstallments.map((inst) => {
      const entry = getEntryInfo(inst.stockEntryId);
      const entryInfo = entry ? getEntryProductsInfo(entry) : { productNames: '-', suppliers: '-' };
      return {
        'Nº Pedido': entry?.orderNumber || '-',
        'Produtos': entryInfo.productNames,
        'Fornecedores': entryInfo.suppliers,
        'Parcela': `${inst.installmentNumber}/${entry?.installments || '-'}`,
        'Valor': inst.value,
        'Valor Total Pedido': entry?.totalValue || 0,
        'Vencimento': formatDate(inst.dueDate),
        'Status': inst.paidAt ? 'Pago' : isOverdue(inst.dueDate) ? 'Vencido' : 'Pendente',
        'Data Pagamento': inst.paidAt ? formatDate(inst.paidAt) : '-',
      };
    });
    exportToExcel(dataToExport, 'pagamentos_pedidos');
    toast({ title: 'Sucesso', description: 'Arquivo exportado com sucesso!' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSupplierFilter('all');
    setDueDateFrom('');
    setDueDateTo('');
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
            <div className="flex items-center justify-between">
              <CardTitle>Parcelas</CardTitle>
              {(searchTerm || statusFilter !== 'all' || supplierFilter !== 'all' || dueDateFrom || dueDateTo) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
            
            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por pedido ou produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>

              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Fornecedores</SelectItem>
                  {uniqueSuppliers.map(supplier => (
                    <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-1">
                <Label className="text-xs">Vencimento de</Label>
                <Input
                  type="date"
                  value={dueDateFrom}
                  onChange={(e) => setDueDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Vencimento até</Label>
                <Input
                  type="date"
                  value={dueDateTo}
                  onChange={(e) => setDueDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Valor Parcela</TableHead>
                  <TableHead>Valor Total Pedido</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstallments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma parcela encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInstallments.map((inst) => {
                    const entry = getEntryInfo(inst.stockEntryId);
                    const invoiceDetails = entry ? getInvoiceDetails(entry) : [];
                    const isPaid = inst.paidAt !== null;
                    const overdue = !isPaid && isOverdue(inst.dueDate);
                    const isExpanded = expandedRows.has(inst.id);

                    return (
                      <Collapsible key={inst.id} open={isExpanded} asChild>
                        <>
                          <TableRow className={overdue ? 'bg-destructive/5' : ''}>
                            <TableCell>
                              <CollapsibleTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => toggleExpanded(inst.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                            <TableCell className="font-medium">{entry?.orderNumber || '-'}</TableCell>
                            <TableCell>{inst.installmentNumber}/{entry?.installments || '-'}</TableCell>
                            <TableCell>{formatCurrency(inst.value)}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(entry?.totalValue || 0)}</TableCell>
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
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/30 hover:bg-muted/40">
                              <TableCell colSpan={7} className="p-0">
                                <div className="p-4 space-y-4">
                                  {invoiceDetails.map((inv, invIdx) => (
                                    <div key={invIdx} className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">NF: {inv.invoiceNumber}</Badge>
                                        <span className="text-sm text-muted-foreground">
                                          Total NF: {formatCurrency(inv.totalValue)}
                                        </span>
                                      </div>
                                      <div className="rounded border bg-background">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="text-xs">Produto</TableHead>
                                              <TableHead className="text-xs">Fornecedor</TableHead>
                                              <TableHead className="text-xs text-right">Qtd.</TableHead>
                                              <TableHead className="text-xs text-right">Custo Unit.</TableHead>
                                              <TableHead className="text-xs text-right">Total Produto</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {inv.items.map((item, itemIdx) => (
                                              <TableRow key={itemIdx}>
                                                <TableCell className="text-sm py-2">{item.productName}</TableCell>
                                                <TableCell className="text-sm py-2">{item.supplier}</TableCell>
                                                <TableCell className="text-sm py-2 text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-sm py-2 text-right">{formatCurrency(item.adjustedUnitCost)}</TableCell>
                                                <TableCell className="text-sm py-2 text-right font-medium">{formatCurrency(item.totalValue)}</TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
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
