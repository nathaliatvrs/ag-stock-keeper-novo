import { useState, useEffect } from 'react';
import { Plus, Search, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { getStockItems, getStockExits, createStockExit, confirmStockExit, getCurrentUser } from '@/services/api';
import { StockItem, StockExit, User } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

export default function StockExits() {
  const [exits, setExits] = useState<StockExit[]>([]);
  const [availableItems, setAvailableItems] = useState<StockItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    exitDate: new Date().toISOString().split('T')[0],
    observation: '',
  });
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [exitsRes, itemsRes, userRes] = await Promise.all([
        getStockExits(),
        getStockItems({ status: 'available' }),
        getCurrentUser(),
      ]);
      if (exitsRes.success && exitsRes.data) setExits(exitsRes.data);
      if (itemsRes.success && itemsRes.data) setAvailableItems(itemsRes.data);
      if (userRes.success && userRes.data) setCurrentUser(userRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
        observation: formData.observation,
      });
      if (response.success) {
        toast({ title: 'Sucesso', description: response.message });
        fetchData();
        setDialogOpen(false);
        setSelectedItems([]);
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

  const selectedTotal = availableItems
    .filter((i) => selectedItems.includes(i.id))
    .reduce((sum, i) => sum + i.unitCost, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Saídas de Estoque</h1>
          <p className="text-muted-foreground mt-1">Registre as saídas de produtos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nova Saída</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saídas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Data Saída</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead>Confirmado</TableHead>
                  {currentUser?.role === 'admin' && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {exits.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma saída</TableCell></TableRow>
                ) : exits.map((exit) => (
                  <TableRow key={exit.id}>
                    <TableCell className="font-medium">{exit.productName}</TableCell>
                    <TableCell>{exit.quantity}</TableCell>
                    <TableCell>{formatCurrency(exit.totalCost)}</TableCell>
                    <TableCell>{formatDate(exit.exitDate)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{exit.observation}</TableCell>
                    <TableCell>
                      {exit.confirmedBy ? (
                        <Badge className="bg-success text-success-foreground">{exit.confirmedByName}</Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    {currentUser?.role === 'admin' && (
                      <TableCell>
                        {!exit.confirmedBy && (
                          <Button variant="ghost" size="icon" onClick={() => handleConfirm(exit.id)} className="text-success">
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Saída de Estoque</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Selecione os itens para saída:</Label>
              <div className="border rounded-md max-h-[200px] overflow-y-auto">
                {availableItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 border-b last:border-b-0 hover:bg-muted/50">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => {
                        setSelectedItems(checked ? [...selectedItems, item.id] : selectedItems.filter((i) => i !== item.id));
                      }}
                    />
                    <span className="flex-1">{item.productName}</span>
                    <span className="text-sm text-muted-foreground">{formatCurrency(item.unitCost)}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{selectedItems.length} itens selecionados - Total: {formatCurrency(selectedTotal)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exitDate">Data da Saída</Label>
              <Input id="exitDate" type="date" value={formData.exitDate} onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observation">Observação</Label>
              <Textarea id="observation" value={formData.observation} onChange={(e) => setFormData({ ...formData, observation: e.target.value })} placeholder="Ex: Saída para paciente..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={selectedItems.length === 0}>Registrar Saída</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
