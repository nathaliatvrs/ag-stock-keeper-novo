# AG Consultoria - Regras de Negócio

## Visão Geral

Este documento descreve as regras de negócio implementadas no sistema de inventário AG Consultoria.

---

## 1. Hierarquia de Usuários

### 1.1 Roles
- **Admin**: Usuário com permissões completas de gerenciamento
- **User**: Usuário comum com permissões limitadas

### 1.2 Permissões por Role

| Funcionalidade | User | Admin |
|---------------|------|-------|
| Criar pedido | ✅ | ✅ |
| Editar pedido próprio | ✅ | ✅ |
| Editar qualquer pedido | ❌ | ✅ |
| Aprovar/rejeitar pedido | ❌ | ✅ |
| Aprovar/rejeitar item individual | ❌ | ✅ |
| Criar entrada de estoque | ✅ | ✅ |
| Criar saída de estoque | ✅ | ✅ |
| Confirmar saída de estoque | ❌ | ✅ |
| Editar saída de estoque | ❌ | ✅ |
| Excluir saída de estoque | ❌ | ✅ |
| Gerenciar produtos | ❌ | ✅ |

### 1.3 Workflow de Aprovação

```
┌─────────────────┐
│  User cria      │
│  pedido         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Status:        │
│  PENDENTE       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Admin revisa   │────▶│  APROVADO       │
│                 │     └─────────────────┘
│                 │     ┌─────────────────┐
│                 │────▶│  REJEITADO      │
│                 │     └─────────────────┘
│                 │     ┌─────────────────┐
│                 │────▶│  PARCIAL        │
└─────────────────┘     │  (alguns itens) │
                        └─────────────────┘
```

---

## 2. Gestão de Produtos

### 2.1 Cadastro de Produto
- Todo produto deve ter: nome, fornecedor, custo unitário e unidade de medida
- Fornecedor e custo são vinculados ao produto no cadastro
- Unidade de medida é consistente em todo o fluxo

### 2.2 Vinculação Automática
Quando um produto é selecionado em pedidos ou entradas:
- **Fornecedor**: preenchido automaticamente do cadastro
- **Custo unitário**: preenchido automaticamente do cadastro

---

## 3. Pedidos Multi-Produto

### 3.1 Estrutura
- Um pedido pode conter até 50 produtos diferentes
- Cada produto é um "item do pedido" com quantidade própria
- Número do pedido é único no sistema

### 3.2 Status de Itens
Cada item do pedido tem status independente:
- `pending`: aguardando aprovação
- `approved`: aprovado para entrada
- `rejected`: rejeitado

### 3.3 Status do Pedido
O status geral do pedido é derivado dos itens:
- `pending`: todos os itens pendentes
- `approved`: todos os itens aprovados
- `rejected`: todos os itens rejeitados
- `partial`: mix de aprovados/rejeitados

### 3.4 Edição de Pedidos

**Usuário comum edita:**
1. Pedido volta ao status `pending`
2. Requer nova aprovação do admin

**Admin edita:**
1. Alterações aplicadas imediatamente
2. Não requer re-aprovação

---

## 4. Entrada de Estoque

### 4.1 Pré-requisitos
- Pedido deve estar aprovado (ou parcialmente aprovado)
- Apenas itens aprovados podem ter entrada

### 4.2 Controle de Quantidade

```
Quantidade Disponível = Quantidade Aprovada - Quantidade Já Entrada
```

**Regra crítica**: O sistema NÃO permite entrada maior que a quantidade disponível.

**Exemplo:**
- Pedido: 100 unidades de Produto A
- Entrada 1: 60 unidades (NF 123)
- Disponível para Entrada 2: 40 unidades
- Tentativa de entrar 50 unidades → BLOQUEADO

### 4.3 Múltiplas Notas Fiscais (NFs)
Uma única entrada de estoque pode conter várias NFs:

```
Entrada de Estoque #001
├── NF 123
│   ├── Produto A: 30 un (custo: R$ 100)
│   └── Produto B: 20 un (custo: R$ 50)
├── NF 456
│   ├── Produto C: 15 un (custo: R$ 200)
│   └── Produto A: 10 un (custo: R$ 105)
```

### 4.4 Ajuste de Preço por Produto
- Cada produto pode ter seu custo ajustado independentemente
- Ajuste afeta apenas o produto específico
- Original e ajustado são armazenados separadamente

**Exemplo:**
```
Produto A (cadastro): R$ 100,00
Produto A (entrada):  R$ 105,00 ← ajustado
Produto B (cadastro): R$ 50,00
Produto B (entrada):  R$ 50,00  ← mantido
```

### 4.5 Geração de Itens de Estoque
Para cada unidade de produto entrada, é criado um registro individual:

```
Entrada: 5 unidades de Produto A

Resultado no estoque:
├── Item #001: Produto A, R$ 105, 15/01/2025, Fornecedor X
├── Item #002: Produto A, R$ 105, 15/01/2025, Fornecedor X
├── Item #003: Produto A, R$ 105, 15/01/2025, Fornecedor X
├── Item #004: Produto A, R$ 105, 15/01/2025, Fornecedor X
└── Item #005: Produto A, R$ 105, 15/01/2025, Fornecedor X
```

---

## 5. Parcelas de Pagamento

### 5.1 Métodos de Pagamento
- **Cartão de Crédito**: permite parcelamento
- **Boleto**: permite parcelamento
- **PIX**: pagamento à vista (1 parcela)

### 5.2 Cálculo de Datas de Vencimento
Usuário informa apenas a **primeira data de vencimento**.

**Cartão de Crédito e Boleto:**
```
Primeira parcela: data informada
Segunda parcela: +30 dias
Terceira parcela: +60 dias
...
```

### 5.3 Cálculo de Valores
O valor total da NF é dividido igualmente entre as parcelas:

```
Total NF: R$ 1.000,00
Parcelas: 4

Parcela 1: R$ 250,00 (venc: 15/01)
Parcela 2: R$ 250,00 (venc: 15/02)
Parcela 3: R$ 250,00 (venc: 15/03)
Parcela 4: R$ 250,00 (venc: 15/04)
```

### 5.4 Impacto do Ajuste de Preço
Quando o preço de um produto é ajustado na entrada:
- Total da NF é recalculado
- Todas as parcelas são atualizadas
- Visualização de pagamentos reflete novo valor

---

## 6. Consulta de Estoque (Visão Explodida)

### 6.1 Conceito
Cada unidade de produto aparece como linha individual:

| ID | Produto | Custo | Data Entrada | Fornecedor | Status |
|----|---------|-------|--------------|------------|--------|
| 001 | Mounjaro | R$ 10.000 | 15/01/2025 | Lilly | Disponível |
| 002 | Mounjaro | R$ 10.000 | 15/01/2025 | Lilly | Disponível |
| 003 | Mounjaro | R$ 10.500 | 20/01/2025 | Lilly | Saído |
| 004 | Sculptra | R$ 2.500 | 18/01/2025 | Galderma | Disponível |

### 6.2 Filtros Disponíveis
- Por produto
- Por status (disponível/saído)
- Por fornecedor
- Por período de entrada

---

## 7. Saída de Estoque

### 7.1 Seleção de Itens
- Usuário seleciona itens específicos da visão explodida
- Apenas itens com status `available` podem ser selecionados
- Múltiplos produtos podem sair na mesma operação

### 7.2 Informações Exibidas na Saída
Para cada item selecionado, exibir:
- Fornecedor (do momento da entrada)
- Data de entrada
- Custo unitário (ajustado, se aplicável)

### 7.3 Status da Saída
- `pending`: aguardando confirmação do admin
- `confirmed`: confirmado pelo admin

### 7.4 Workflow de Confirmação

```
User registra saída → Status: PENDING
         │
         ▼
Admin confirma → Status: CONFIRMED
```

### 7.5 Edição e Exclusão (Admin)

**Edição:**
- Admin pode alterar: data, observação
- Itens da saída não podem ser alterados

**Exclusão:**
- Ao excluir uma saída, os itens voltam para `available`
- Atualização é propagada para todos os relatórios

---

## 8. Relatório de Pagamentos

### 8.1 Estrutura Expansível
Cada parcela mostra:
- Número da parcela
- Data de vencimento
- Valor
- Status (pendente/pago)

**Ao expandir:**
- Lista de produtos da NF
- Fornecedor de cada produto
- Custo individual de cada produto
- Valor total do pedido

### 8.2 Filtros
- Por fornecedor
- Por data de vencimento (período)
- Por status de pagamento

### 8.3 Marcar como Pago
- Usuário pode marcar parcela como paga
- Data de pagamento é registrada

---

## 9. Relatório de Estoque Consolidado

### 9.1 Agregação
Agrupa itens de estoque por produto:

| Produto | Fornecedor | Qtd Disponível | Valor Total | Última Entrada |
|---------|------------|----------------|-------------|----------------|
| Mounjaro | Lilly | 47 | R$ 470.000 | 20/01/2025 |
| Sculptra | Galderma | 23 | R$ 57.500 | 18/01/2025 |

### 9.2 Campos
- Nome do produto
- Fornecedor
- Quantidade disponível
- Valor total em estoque
- Data da última entrada

---

## 10. Exportação Excel

### 10.1 Páginas com Exportação
- ✅ Pedidos
- ✅ Entrada de Estoque
- ✅ Consultar Estoque
- ✅ Pagamento de Pedidos
- ✅ Saídas de Estoque

### 10.2 Regra
O arquivo Excel deve conter **exatamente** as mesmas colunas exibidas na tabela do frontend.

---

## 11. Unidade de Medida

### 11.1 Consistência
A unidade definida no cadastro do produto é usada em todo o fluxo:
- Cadastro: `caixa`
- Pedido: quantidade em `caixas`
- Entrada: quantidade em `caixas`
- Estoque: cada item = 1 `caixa`
- Saída: quantidade em `caixas`

### 11.2 Exemplo
```
Produto: Mounjaro
Unidade: caixa
Custo: R$ 10.000/caixa

Pedido: 50 caixas
Entrada: 50 caixas
Estoque: 50 itens individuais (cada um = 1 caixa)
Saída: selecionar X caixas específicas
```

---

## 12. Validações Críticas

### 12.1 Pedidos
- [ ] Número do pedido único
- [ ] Pelo menos 1 item no pedido
- [ ] Quantidade > 0 para cada item

### 12.2 Entrada de Estoque
- [ ] Pedido aprovado (ou parcialmente)
- [ ] Quantidade ≤ quantidade disponível
- [ ] NF informada
- [ ] Método de pagamento selecionado
- [ ] Data de vencimento válida

### 12.3 Saída de Estoque
- [ ] Pelo menos 1 item selecionado
- [ ] Itens com status `available`
- [ ] Data de saída informada

### 12.4 Exclusão de Saída
- [ ] Apenas admin pode excluir
- [ ] Itens devem voltar para `available`
- [ ] Atualizar todos os relatórios relacionados
