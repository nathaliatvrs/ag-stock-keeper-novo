import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStockItems, getProducts, getStockEntries } from '@/services/api';
import { StockItem, Product, StockEntry } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function StockReport() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [itemsRes, productsRes, entriesRes] = await Promise.all([
        getStockItems(), 
        getProducts(),
        getStockEntries(),
      ]);
      if (itemsRes.success && itemsRes.data) setStockItems(itemsRes.data);
      if (productsRes.success && productsRes.data) setProducts(productsRes.data);
      if (entriesRes.success && entriesRes.data) setStockEntries(entriesRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const availableItems = stockItems.filter((i) => i.status === 'available');

  // Calcula a última data de entrada para cada produto
  const lastEntryDateByProduct = useMemo(() => {
    const map = new Map<string, string>();
    
    stockEntries.forEach(entry => {
      entry.invoices.forEach(inv => {
        inv.items.forEach(item => {
          const currentDate = map.get(item.productId);
          if (!currentDate || new Date(entry.date) > new Date(currentDate)) {
            map.set(item.productId, entry.date);
          }
        });
      });
    });
    
    return map;
  }, [stockEntries]);
  
  const reportData = products.map((product) => {
    const items = availableItems.filter((i) => i.productId === product.id);
    return {
      productId: product.id,
      product: product.name,
      supplier: product.supplier,
      unitType: product.unitType,
      quantity: items.length,
      unitCost: product.unitCost,
      totalValue: items.reduce((sum, i) => sum + i.unitCost, 0),
      lastEntryDate: lastEntryDateByProduct.get(product.id) || null,
    };
  }).filter((r) => r.quantity > 0);

  const grandTotal = reportData.reduce((sum, r) => sum + r.totalValue, 0);

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
          <h1 className="text-3xl font-bold">Relatório de Estoque</h1>
          <p className="text-muted-foreground mt-1">Resumo consolidado do estoque</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Estoque por Produto</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Qtd. Disponível</TableHead>
                  <TableHead className="text-right">Custo Unitário</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Última Entrada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum item em estoque
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {reportData.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.product}</TableCell>
                        <TableCell>{row.supplier}</TableCell>
                        <TableCell className="capitalize">{row.unitType}</TableCell>
                        <TableCell className="text-right">{row.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.unitCost)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.totalValue)}</TableCell>
                        <TableCell>{row.lastEntryDate ? formatDate(row.lastEntryDate) : '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={5}>TOTAL GERAL</TableCell>
                      <TableCell className="text-right text-primary">{formatCurrency(grandTotal)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
