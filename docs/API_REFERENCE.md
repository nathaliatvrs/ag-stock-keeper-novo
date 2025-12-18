# AG Consultoria - Referência de API

## Visão Geral

Esta documentação descreve todos os endpoints da API REST para o sistema de inventário AG Consultoria.

**Base URL**: `https://api.agconsultoria.com.br/v1`

**Autenticação**: Bearer Token (JWT)

---

## Autenticação

### POST /auth/login

Realiza login do usuário.

**Request Body:**
```json
{
  "email": "usuario@agconsultoria.com.br",
  "password": "senha123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-user-id",
      "name": "João Silva",
      "email": "joao@agconsultoria.com.br",
      "role": "admin",
      "createdAt": "2025-01-15T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": "Credenciais inválidas"
}
```

---

### POST /auth/logout

Realiza logout do usuário.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": null
}
```

---

### GET /auth/me

Retorna dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-user-id",
    "name": "João Silva",
    "email": "joao@agconsultoria.com.br",
    "role": "admin",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

---

## Produtos

### GET /products

Lista todos os produtos.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| search | string | Filtro por nome |
| supplier | string | Filtro por fornecedor |
| page | number | Página (default: 1) |
| limit | number | Itens por página (default: 50) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-product-1",
      "name": "Mounjaro 5mg",
      "supplier": "Lilly",
      "unitCost": 10000.00,
      "unitType": "caixa",
      "createdAt": "2025-01-10T08:00:00Z",
      "updatedAt": "2025-01-10T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1
  }
}
```

---

### GET /products/:id

Retorna um produto específico.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-product-1",
    "name": "Mounjaro 5mg",
    "supplier": "Lilly",
    "unitCost": 10000.00,
    "unitType": "caixa",
    "createdAt": "2025-01-10T08:00:00Z",
    "updatedAt": "2025-01-10T08:00:00Z"
  }
}
```

---

### POST /products

Cria um novo produto.

**Request Body:**
```json
{
  "name": "Sculptra",
  "supplier": "Galderma",
  "unitCost": 2500.00,
  "unitType": "unidade"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-product-new",
    "name": "Sculptra",
    "supplier": "Galderma",
    "unitCost": 2500.00,
    "unitType": "unidade",
    "createdAt": "2025-01-18T14:30:00Z",
    "updatedAt": "2025-01-18T14:30:00Z"
  }
}
```

---

### PUT /products/:id

Atualiza um produto.

**Request Body:**
```json
{
  "name": "Sculptra 150mg",
  "unitCost": 2600.00
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-product-1",
    "name": "Sculptra 150mg",
    "supplier": "Galderma",
    "unitCost": 2600.00,
    "unitType": "unidade",
    "createdAt": "2025-01-10T08:00:00Z",
    "updatedAt": "2025-01-18T15:00:00Z"
  }
}
```

---

### DELETE /products/:id

Remove um produto.

**Response 200:**
```json
{
  "success": true,
  "data": null
}
```

**Response 400:**
```json
{
  "success": false,
  "error": "Produto possui itens em estoque e não pode ser removido"
}
```

---

## Pedidos

### GET /orders

Lista todos os pedidos.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | pending, approved, rejected, partial |
| startDate | string | Data inicial (YYYY-MM-DD) |
| endDate | string | Data final (YYYY-MM-DD) |
| page | number | Página |
| limit | number | Itens por página |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-order-1",
      "orderNumber": "PED-2025-001",
      "date": "2025-01-15",
      "status": "approved",
      "userId": "uuid-user-1",
      "userName": "João Silva",
      "items": [
        {
          "id": "uuid-item-1",
          "productId": "uuid-product-1",
          "productName": "Mounjaro 5mg",
          "quantity": 50,
          "unitCost": 10000.00,
          "supplier": "Lilly",
          "status": "approved"
        },
        {
          "id": "uuid-item-2",
          "productId": "uuid-product-2",
          "productName": "Sculptra",
          "quantity": 30,
          "unitCost": 2500.00,
          "supplier": "Galderma",
          "status": "approved"
        }
      ],
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T14:00:00Z"
    }
  ]
}
```

---

### GET /orders/:id

Retorna um pedido específico com todos os itens.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-order-1",
    "orderNumber": "PED-2025-001",
    "date": "2025-01-15",
    "status": "approved",
    "items": [
      {
        "id": "uuid-item-1",
        "productId": "uuid-product-1",
        "productName": "Mounjaro 5mg",
        "quantity": 50,
        "unitCost": 10000.00,
        "supplier": "Lilly",
        "status": "approved",
        "enteredQuantity": 30,
        "pendingQuantity": 20
      }
    ],
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

---

### POST /orders

Cria um novo pedido.

**Request Body:**
```json
{
  "orderNumber": "PED-2025-002",
  "date": "2025-01-18",
  "items": [
    {
      "productId": "uuid-product-1",
      "quantity": 100
    },
    {
      "productId": "uuid-product-2",
      "quantity": 50
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-order-new",
    "orderNumber": "PED-2025-002",
    "date": "2025-01-18",
    "status": "pending",
    "items": [
      {
        "id": "uuid-item-new-1",
        "productId": "uuid-product-1",
        "productName": "Mounjaro 5mg",
        "quantity": 100,
        "unitCost": 10000.00,
        "supplier": "Lilly",
        "status": "pending"
      },
      {
        "id": "uuid-item-new-2",
        "productId": "uuid-product-2",
        "productName": "Sculptra",
        "quantity": 50,
        "unitCost": 2500.00,
        "supplier": "Galderma",
        "status": "pending"
      }
    ],
    "createdAt": "2025-01-18T16:00:00Z"
  }
}
```

---

### PUT /orders/:id

Atualiza um pedido.

**Request Body:**
```json
{
  "orderNumber": "PED-2025-002-REV",
  "date": "2025-01-19",
  "items": [
    {
      "productId": "uuid-product-1",
      "quantity": 120
    }
  ]
}
```

**Nota**: Se o usuário não for admin, o status volta para `pending`.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-order-1",
    "orderNumber": "PED-2025-002-REV",
    "status": "pending",
    "items": [...]
  }
}
```

---

### POST /orders/:id/approve

Aprova todos os itens do pedido.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-order-1",
    "status": "approved",
    "items": [
      {
        "id": "uuid-item-1",
        "status": "approved"
      }
    ]
  }
}
```

---

### POST /orders/:id/reject

Rejeita todos os itens do pedido.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-order-1",
    "status": "rejected"
  }
}
```

---

### POST /orders/:orderId/items/:itemId/approve

Aprova um item específico do pedido.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid-order-1",
    "orderStatus": "partial",
    "item": {
      "id": "uuid-item-1",
      "status": "approved"
    }
  }
}
```

---

### POST /orders/:orderId/items/:itemId/reject

Rejeita um item específico do pedido.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid-order-1",
    "orderStatus": "partial",
    "item": {
      "id": "uuid-item-1",
      "status": "rejected"
    }
  }
}
```

---

## Entrada de Estoque

### GET /stock-entries

Lista todas as entradas de estoque.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| orderId | string | Filtro por pedido |
| startDate | string | Data inicial |
| endDate | string | Data final |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-entry-1",
      "orderId": "uuid-order-1",
      "orderNumber": "PED-2025-001",
      "date": "2025-01-16",
      "paymentMethod": "credit_card",
      "installments": 3,
      "firstDueDate": "2025-02-15",
      "invoices": [
        {
          "id": "uuid-invoice-1",
          "invoiceNumber": "NF-12345",
          "items": [
            {
              "id": "uuid-inv-item-1",
              "orderItemId": "uuid-order-item-1",
              "productName": "Mounjaro 5mg",
              "quantity": 30,
              "originalUnitCost": 10000.00,
              "adjustedUnitCost": 10500.00,
              "supplier": "Lilly"
            }
          ]
        }
      ],
      "createdAt": "2025-01-16T09:00:00Z"
    }
  ]
}
```

---

### POST /stock-entries

Cria uma nova entrada de estoque.

**Request Body:**
```json
{
  "orderId": "uuid-order-1",
  "date": "2025-01-18",
  "paymentMethod": "boleto",
  "installments": 2,
  "firstDueDate": "2025-02-18",
  "invoices": [
    {
      "invoiceNumber": "NF-67890",
      "items": [
        {
          "orderItemId": "uuid-order-item-1",
          "quantity": 20,
          "adjustedUnitCost": 10200.00
        },
        {
          "orderItemId": "uuid-order-item-2",
          "quantity": 15,
          "adjustedUnitCost": 2500.00
        }
      ]
    },
    {
      "invoiceNumber": "NF-67891",
      "items": [
        {
          "orderItemId": "uuid-order-item-1",
          "quantity": 10,
          "adjustedUnitCost": 10000.00
        }
      ]
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-entry-new",
    "stockItems": [
      {
        "id": "uuid-stock-item-1",
        "productId": "uuid-product-1",
        "productName": "Mounjaro 5mg",
        "unitCost": 10200.00,
        "entryDate": "2025-01-18",
        "status": "available"
      }
    ],
    "installments": [
      {
        "id": "uuid-installment-1",
        "installmentNumber": 1,
        "dueDate": "2025-02-18",
        "amount": 131500.00,
        "status": "pending"
      },
      {
        "id": "uuid-installment-2",
        "installmentNumber": 2,
        "dueDate": "2025-03-18",
        "amount": 131500.00,
        "status": "pending"
      }
    ]
  }
}
```

**Response 400:**
```json
{
  "success": false,
  "error": "Quantidade excede quantidade pendente do item do pedido"
}
```

---

## Itens de Estoque

### GET /stock-items

Lista todos os itens de estoque (visão explodida).

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | available, exited |
| productId | string | Filtro por produto |
| supplier | string | Filtro por fornecedor |
| startDate | string | Data entrada inicial |
| endDate | string | Data entrada final |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-stock-item-1",
      "stockEntryId": "uuid-entry-1",
      "invoiceItemId": "uuid-inv-item-1",
      "productId": "uuid-product-1",
      "productName": "Mounjaro 5mg",
      "unitCost": 10500.00,
      "entryDate": "2025-01-16",
      "supplier": "Lilly",
      "status": "available",
      "exitId": null
    },
    {
      "id": "uuid-stock-item-2",
      "stockEntryId": "uuid-entry-1",
      "invoiceItemId": "uuid-inv-item-1",
      "productId": "uuid-product-1",
      "productName": "Mounjaro 5mg",
      "unitCost": 10500.00,
      "entryDate": "2025-01-16",
      "supplier": "Lilly",
      "status": "exited",
      "exitId": "uuid-exit-1"
    }
  ]
}
```

---

## Saída de Estoque

### GET /stock-exits

Lista todas as saídas de estoque.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | pending, confirmed |
| startDate | string | Data saída inicial |
| endDate | string | Data saída final |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-exit-1",
      "exitDate": "2025-01-17",
      "observation": "Saída para cliente ABC",
      "status": "confirmed",
      "userId": "uuid-user-1",
      "userName": "Maria Santos",
      "confirmedBy": "uuid-user-admin",
      "confirmedByName": "João Admin",
      "confirmedAt": "2025-01-17T15:00:00Z",
      "items": [
        {
          "id": "uuid-exit-item-1",
          "stockItemId": "uuid-stock-item-2",
          "productId": "uuid-product-1",
          "productName": "Mounjaro 5mg",
          "quantity": 1,
          "unitCost": 10500.00,
          "supplier": "Lilly"
        },
        {
          "id": "uuid-exit-item-2",
          "stockItemId": "uuid-stock-item-5",
          "productId": "uuid-product-2",
          "productName": "Sculptra",
          "quantity": 1,
          "unitCost": 2500.00,
          "supplier": "Galderma"
        }
      ],
      "totalValue": 13000.00,
      "createdAt": "2025-01-17T14:00:00Z"
    }
  ]
}
```

---

### POST /stock-exits

Cria uma nova saída de estoque.

**Request Body:**
```json
{
  "stockItemIds": [
    "uuid-stock-item-3",
    "uuid-stock-item-4",
    "uuid-stock-item-10"
  ],
  "exitDate": "2025-01-18",
  "observation": "Entrega para cliente XYZ"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-exit-new",
    "exitDate": "2025-01-18",
    "observation": "Entrega para cliente XYZ",
    "status": "pending",
    "items": [
      {
        "id": "uuid-exit-item-new-1",
        "stockItemId": "uuid-stock-item-3",
        "productName": "Mounjaro 5mg",
        "quantity": 1,
        "unitCost": 10000.00,
        "supplier": "Lilly"
      },
      {
        "id": "uuid-exit-item-new-2",
        "stockItemId": "uuid-stock-item-4",
        "productName": "Mounjaro 5mg",
        "quantity": 1,
        "unitCost": 10000.00,
        "supplier": "Lilly"
      },
      {
        "id": "uuid-exit-item-new-3",
        "stockItemId": "uuid-stock-item-10",
        "productName": "Sculptra",
        "quantity": 1,
        "unitCost": 2500.00,
        "supplier": "Galderma"
      }
    ]
  }
}
```

---

### PUT /stock-exits/:id

Atualiza uma saída de estoque (apenas admin).

**Request Body:**
```json
{
  "exitDate": "2025-01-19",
  "observation": "Entrega para cliente XYZ - atualizado"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-exit-1",
    "exitDate": "2025-01-19",
    "observation": "Entrega para cliente XYZ - atualizado",
    "updatedAt": "2025-01-18T16:00:00Z"
  }
}
```

---

### DELETE /stock-exits/:id

Remove uma saída de estoque (apenas admin).

**Comportamento:**
- Os itens de estoque voltam para status `available`
- O campo `exitId` dos itens é definido como `null`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "restoredItems": [
      "uuid-stock-item-3",
      "uuid-stock-item-4",
      "uuid-stock-item-10"
    ]
  }
}
```

---

### POST /stock-exits/:id/confirm

Confirma uma saída de estoque (apenas admin).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-exit-1",
    "status": "confirmed",
    "confirmedBy": "uuid-user-admin",
    "confirmedAt": "2025-01-18T17:00:00Z"
  }
}
```

---

## Parcelas de Pagamento

### GET /payment-installments

Lista todas as parcelas de pagamento.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| stockEntryId | string | Filtro por entrada |
| status | string | pending, paid |
| supplier | string | Filtro por fornecedor |
| startDueDate | string | Vencimento inicial |
| endDueDate | string | Vencimento final |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-installment-1",
      "stockEntryId": "uuid-entry-1",
      "invoiceId": "uuid-invoice-1",
      "invoiceNumber": "NF-12345",
      "orderNumber": "PED-2025-001",
      "installmentNumber": 1,
      "totalInstallments": 3,
      "dueDate": "2025-02-15",
      "amount": 105000.00,
      "status": "pending",
      "paidDate": null,
      "products": [
        {
          "productName": "Mounjaro 5mg",
          "supplier": "Lilly",
          "quantity": 30,
          "unitCost": 10500.00,
          "totalCost": 315000.00
        }
      ],
      "orderTotalValue": 500000.00
    }
  ]
}
```

---

### PUT /payment-installments/:id

Atualiza status de uma parcela (marcar como paga).

**Request Body:**
```json
{
  "status": "paid",
  "paidDate": "2025-02-14"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-installment-1",
    "status": "paid",
    "paidDate": "2025-02-14",
    "updatedAt": "2025-02-14T10:00:00Z"
  }
}
```

---

## Dashboard

### GET /dashboard/stats

Retorna estatísticas do dashboard.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 45,
    "pendingOrders": 8,
    "totalStockValue": 1250000.00,
    "stockItemCount": 523,
    "monthlyEntryValue": 450000.00,
    "monthlyExitValue": 180000.00,
    "pendingInstallments": 12,
    "pendingInstallmentsValue": 320000.00
  }
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido ou expirado |
| 403 | Forbidden - Sem permissão para esta ação |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Recurso já existe (ex: número de pedido duplicado) |
| 422 | Unprocessable Entity - Violação de regra de negócio |
| 500 | Internal Server Error - Erro interno |

---

## Rate Limiting

- **Limite**: 100 requests por minuto por usuário
- **Header**: `X-RateLimit-Remaining` indica requests restantes
- **Response 429**: Too Many Requests

---

## Paginação

Endpoints que retornam listas suportam paginação:

```
GET /products?page=2&limit=20
```

**Response headers:**
```
X-Total-Count: 150
X-Total-Pages: 8
X-Current-Page: 2
```
