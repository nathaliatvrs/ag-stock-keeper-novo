import { useState, useEffect } from 'react';
import { Search, Filter, Download } from 'lucide-react';
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
import { getStockItems, getProducts } from '@/services/api';
import { StockItem, Product } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToExcel } from '@/lib/excel';

export default function StockConsult() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'exited'>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [itemsRes, productsRes] = await Promise.all([
        getStockItems(),
        getProducts(),
      ]);
      if (itemsRes.success && itemsRes.data) setStockItems(itemsRes.data);
      if (productsRes.success && productsRes.data) setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getProductInfo = (productId: string) => products.find((p) => p.id === productId);

  const filteredItems = stockItems.filter((item) => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesProduct = productFilter === 'all' || item.productId === productFilter;
    return matchesSearch && matchesStatus && matchesProduct;
  });

  const availableCount = stockItems.filter((i) => i.status === 'available').length;
  const exitedCount = stockItems.filter((i) => i.status === 'exited').length;
  const totalValue = stockItems.filter((i) => i.status === 'available').reduce((sum, item) => sum + item.unitCost, 0);

  const handleExport = () => {
    const dataToExport = filteredItems.map((item, index) => {
      const product = getProductInfo(item.productId);
      return {
        'Item #': index + 1,
        'Produto': item.productName,
        'Fornecedor': item.supplier,
        'Unidade': product?.unitType || '-',
        'Custo Unitário': item.unitCost,
        'Data Entrada': formatDate(item.entryDate),
        'Data Saída': item.exitDate ? formatDate(item.exitDate) : '-',
        'Status': item.status === 'available' ? 'Disponível' : 'Saída',
      };
    });
    exportToExcel(dataToExport, 'consulta_estoque');
    toast({ title: 'Sucesso', description: 'Arquivo exportado com sucesso!' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Consultar Estoque</h1>
          <p className="text-muted-foreground mt-1">Visualize todos os itens do estoque (visão explodida)</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />Exportar Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Itens Disponíveis</p><p className="text-2xl font-bold text-success">{availableCount}</p></div><Badge className="bg-success text-success-foreground">Disponível</Badge></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Itens com Saída</p><p className="text-2xl font-bold text-muted-foreground">{exitedCount}</p></div><Badge variant="secondary">Saída</Badge></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Valor Total em Estoque</p><p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Itens do Estoque</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por produto ou fornecedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2">
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Produto" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos os produtos</SelectItem>{products.map((product) => (<SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>))}</SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'available' | 'exited')}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="available">Disponível</SelectItem><SelectItem value="exited">Com Saída</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead className="w-[80px]">Item #</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Custo Unitário</TableHead>
                  <TableHead>Data Entrada</TableHead>
                  <TableHead>Data Saída</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum item encontrado</TableCell></TableRow>
                ) : (
                  filteredItems.map((item, index) => {
                    const product = getProductInfo(item.productId);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell>{item.supplier}</TableCell>
                        <TableCell className="capitalize">{product?.unitType || '-'}</TableCell>
                        <TableCell>{formatCurrency(item.unitCost)}</TableCell>
                        <TableCell>{formatDate(item.entryDate)}</TableCell>
                        <TableCell>{item.exitDate ? formatDate(item.exitDate) : '-'}</TableCell>
                        <TableCell>{item.status === 'available' ? <Badge className="bg-success text-success-foreground">Disponível</Badge> : <Badge variant="secondary">Saída</Badge>}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Mostrando {filteredItems.length} de {stockItems.length} itens</div>
        </CardContent>
      </Card>
    </div>
  );
}
