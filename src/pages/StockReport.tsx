import { useState, useEffect } from 'react';
import { FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStockItems, getProducts } from '@/services/api';
import { StockItem, Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function StockReport() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [itemsRes, productsRes] = await Promise.all([getStockItems(), getProducts()]);
      if (itemsRes.success && itemsRes.data) setStockItems(itemsRes.data);
      if (productsRes.success && productsRes.data) setProducts(productsRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const availableItems = stockItems.filter((i) => i.status === 'available');
  
  const reportData = products.map((product) => {
    const items = availableItems.filter((i) => i.productId === product.id);
    return {
      product: product.name,
      supplier: product.supplier,
      unitType: product.unitType,
      quantity: items.length,
      unitCost: product.unitCost,
      totalValue: items.reduce((sum, i) => sum + i.unitCost, 0),
    };
  }).filter((r) => r.quantity > 0);

  const grandTotal = reportData.reduce((sum, r) => sum + r.totalValue, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Qtd. Disponível</TableHead>
                  <TableHead className="text-right">Custo Unitário</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum item em estoque</TableCell></TableRow>
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
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={5}>TOTAL GERAL</TableCell>
                      <TableCell className="text-right text-primary">{formatCurrency(grandTotal)}</TableCell>
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
