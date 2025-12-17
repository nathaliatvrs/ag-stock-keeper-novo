import { useState, useEffect } from 'react';
import { Plus, Check, Download, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getStockItems, getStockExits, getProducts, createStockExit, confirmStockExit, updateStockExit, deleteStockExit } from '@/services/api';
import { StockItem, StockExit, Product, StockExitItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToExcel } from '@/lib/excel';

export default function StockExits() {
  const [exits, setExits] = useState<StockExit[]>([]);
  const [availableItems, setAvailableItems] = useState<StockItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExit, setSelectedExit] = useState<StockExit | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [formData, setFormData] = useState({ exitDate: new Date().toISOString().split('T')[0], observation: '' });
  const [editFormData, setEditFormData] = useState({ exitDate: '', observation: '' });
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const fetchData = async () => {
    try {
      const [exitsRes, itemsRes, productsRes] = await Promise.all([
        getStockExits(), getStockItems({ status: 'available' }), getProducts()
      ]);
      if (exitsRes.success && exitsRes.data) setExits(exitsRes.data);
      if (itemsRes.success && itemsRes.data) setAvailableItems(itemsRes.data);
      if (productsRes.success && productsRes.data) setProducts(productsRes.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getProductInfo = (productId: string) => products.find((p) => p.id === productId);

  // Calcula os itens da saída agrupados por produto
  const getExitItems = (exit: StockExit): StockExitItem[] => {
    // Se já tem items, usa
    if (exit.items && exit.items.length > 0) {
      return exit.items;
    }
    // Fallback para saídas antigas (single product)
    return [{
      productId: exit.productId,
      productName: exit.productName,
      supplier: exit.supplier,
      quantity: exit.quantity,
      totalCost: exit.totalCost,
      unitCost: exit.totalCost / exit.quantity,
    }];
  };

  // Expande as saídas para exibir uma linha por produto
  const expandedExits = exits.flatMap(exit => {
    const items = getExitItems(exit);
    return items.map((item, idx) => ({
      ...exit,
      _displayItem: item,
      _isFirstRow: idx === 0,
      _totalItems: items.length,
    }));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) { 
      toast({ title: 'Erro', description: 'Selecione ao menos um item.', variant: 'destructive' }); 
      return; 
    }
    try {
      const response = await createStockExit({ 
        stockItemIds: selectedItems, 
        exitDate: formData.exitDate, 
        observation: formData.observation 
      });
      if (response.success) { 
        toast({ title: 'Sucesso', description: response.message }); 
        fetchData(); 
        setDialogOpen(false); 
        setSelectedItems([]); 
        setFormData({ exitDate: new Date().toISOString().split('T')[0], observation: '' });
      }
    } catch (error) { 
      toast({ title: 'Erro', description: 'Não foi possível registrar.', variant: 'destructive' }); 
    }
  };

  const handleConfirm = async (exitId: string) => {
    try {
      const response = await confirmStockExit(exitId);
      if (response.success) { 
        toast({ title: 'Sucesso', description: response.message }); 
        fetchData(); 
      }
    } catch (error) { 
      toast({ title: 'Erro', description: 'Não foi possível confirmar.', variant: 'destructive' }); 
    }
  };

  const handleEdit = (exit: StockExit) => {
    setSelectedExit(exit);
    setEditFormData({ exitDate: exit.exitDate, observation: exit.observation });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExit) return;
    
    try {
      const response = await updateStockExit(selectedExit.id, editFormData);
      if (response.success) {
        toast({ title: 'Sucesso', description: response.message });
        fetchData();
        setEditDialogOpen(false);
        setSelectedExit(null);
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar.', variant: 'destructive' });
    }
  };

  const handleDeleteClick = (exit: StockExit) => {
    setSelectedExit(exit);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedExit) return;
    
    try {
      const response = await deleteStockExit(selectedExit.id);
      if (response.success) {
        toast({ title: 'Sucesso', description: response.message });
        fetchData();
        setDeleteDialogOpen(false);
        setSelectedExit(null);
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' });
    }
  };

  const handleExport = () => {
    const dataToExport: any[] = [];
    exits.forEach((exit) => {
      const items = getExitItems(exit);
      items.forEach((item) => {
        const product = getProductInfo(item.productId);
        dataToExport.push({
          'Produto': item.productName,
          'Fornecedor': item.supplier,
          'Unidade': product?.unitType || '-',
          'Quantidade': item.quantity,
          'Custo Unit.': item.unitCost,
          'Valor Total': item.totalCost,
          'Data Saída': formatDate(exit.exitDate),
          'Observação': exit.observation,
          'Criado Por': exit.createdByName,
          'Confirmado Por': exit.confirmedByName || 'Pendente',
        });
      });
    });
    exportToExcel(dataToExport, 'saidas_estoque');
    toast({ title: 'Sucesso', description: 'Arquivo exportado com sucesso!' });
  };

  const selectedTotal = availableItems.filter((i) => selectedItems.includes(i.id)).reduce((sum, i) => sum + i.unitCost, 0);

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
          <h1 className="text-3xl font-bold">Saídas de Estoque</h1>
          <p className="text-muted-foreground mt-1">Registre as saídas de produtos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />Exportar Excel
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Nova Saída
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Saídas Registradas</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Custo Unit.</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Data Saída</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead>Confirmado</TableHead>
                  {isAdmin && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expandedExits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Nenhuma saída
                    </TableCell>
                  </TableRow>
                ) : expandedExits.map((row, idx) => {
                  const product = getProductInfo(row._displayItem.productId);
                  return (
                    <TableRow key={`${row.id}-${idx}`}>
                      <TableCell className="font-medium">{row._displayItem.productName}</TableCell>
                      <TableCell>{row._displayItem.supplier}</TableCell>
                      <TableCell className="capitalize">{product?.unitType || '-'}</TableCell>
                      <TableCell>{row._displayItem.quantity}</TableCell>
                      <TableCell>{formatCurrency(row._displayItem.unitCost)}</TableCell>
                      <TableCell>{formatCurrency(row._displayItem.totalCost)}</TableCell>
                      <TableCell>{formatDate(row.exitDate)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{row.observation}</TableCell>
                      <TableCell>
                        {row.confirmedBy ? (
                          <Badge className="bg-success text-success-foreground">{row.confirmedByName}</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!row.confirmedBy && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleConfirm(row.id)} 
                                className="text-success"
                                title="Confirmar"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {row._isFirstRow && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleEdit(row)}
                                  title="Editar"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteClick(row)}
                                  className="text-destructive"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Nova Saída */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Saída de Estoque</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Selecione os itens para saída:</Label>
              <div className="border rounded-md max-h-[300px] overflow-y-auto">
                {availableItems.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">Nenhum item disponível no estoque</p>
                ) : availableItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50">
                    <Checkbox 
                      checked={selectedItems.includes(item.id)} 
                      onCheckedChange={(checked) => setSelectedItems(checked ? [...selectedItems, item.id] : selectedItems.filter((i) => i !== item.id))} 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.productName}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span>Fornecedor: {item.supplier}</span>
                        <span>Entrada: {formatDate(item.entryDate)}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary whitespace-nowrap">{formatCurrency(item.unitCost)}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedItems.length} itens selecionados - Total: {formatCurrency(selectedTotal)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exitDate">Data da Saída</Label>
              <Input 
                id="exitDate" 
                type="date" 
                value={formData.exitDate} 
                onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observation">Observação</Label>
              <Textarea 
                id="observation" 
                value={formData.observation} 
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })} 
                placeholder="Ex: Saída para paciente..." 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={selectedItems.length === 0}>Registrar Saída</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Saída */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Saída de Estoque</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editExitDate">Data da Saída</Label>
              <Input 
                id="editExitDate" 
                type="date" 
                value={editFormData.exitDate} 
                onChange={(e) => setEditFormData({ ...editFormData, exitDate: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editObservation">Observação</Label>
              <Textarea 
                id="editObservation" 
                value={editFormData.observation} 
                onChange={(e) => setEditFormData({ ...editFormData, observation: e.target.value })} 
                placeholder="Ex: Saída para paciente..." 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Excluir */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Saída de Estoque</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta saída? Os itens serão devolvidos ao estoque disponível.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
