# AG Consultoria - Documentação de Arquitetura

## Visão Geral

O sistema de inventário AG Consultoria é uma aplicação web desenvolvida com abordagem **frontend-first**, onde a interface do usuário é completamente construída com dados mockados, permitindo desenvolvimento paralelo da API backend pela equipe GCP.

---

## Stack Tecnológica

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.x | Tipagem estática |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Estilização |
| shadcn/ui | - | Componentes UI |
| React Router | 6.x | Roteamento SPA |
| TanStack Query | 5.x | Gerenciamento de estado servidor |
| React Hook Form | 7.x | Gerenciamento de formulários |
| Zod | 3.x | Validação de schemas |
| date-fns | 3.x | Manipulação de datas |
| xlsx | 0.18.5 | Exportação Excel |
| Recharts | 2.x | Gráficos |

### Backend (Planejado)
| Tecnologia | Propósito |
|------------|-----------|
| GCP Cloud Functions | API serverless |
| Cloud SQL (PostgreSQL) | Banco de dados |
| Cloud Run | Serviços containerizados |
| Cloud Storage | Armazenamento de arquivos |
| Firebase Auth | Autenticação |

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Pages     │  │  Components  │  │    Hooks     │          │
│  │              │  │              │  │              │          │
│  │ - Dashboard  │  │ - Layout     │  │ - useAuth    │          │
│  │ - Login      │  │ - NavLink    │  │ - useToast   │          │
│  │ - Products   │  │ - UI (shadcn)│  │ - useMobile  │          │
│  │ - Orders     │  │              │  │              │          │
│  │ - StockEntry │  │              │  │              │          │
│  │ - StockExits │  │              │  │              │          │
│  │ - etc...     │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Services Layer                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │   │
│  │  │   api.ts    │  │  mockData   │  │  excel.ts   │       │   │
│  │  │ (API calls) │  │ (temp data) │  │ (exports)   │       │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Contexts                              │   │
│  │  ┌─────────────────────────────────────────────────┐     │   │
│  │  │              AuthContext                         │     │   │
│  │  │  - user state                                    │     │   │
│  │  │  - login/logout                                  │     │   │
│  │  │  - isAuthenticated                               │     │   │
│  │  │  - isAdmin                                       │     │   │
│  │  └─────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (GCP)                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  API Gateway                              │   │
│  │              (Cloud Endpoints)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Auth      │     │  Products   │     │   Orders    │       │
│  │  Functions  │     │  Functions  │     │  Functions  │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│         │                    │                    │             │
│         └────────────────────┼────────────────────┘             │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Cloud SQL (PostgreSQL)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Diretórios

```
src/
├── assets/              # Imagens e recursos estáticos
│   ├── ag-logo.png
│   └── ag-marca.png
│
├── components/          # Componentes reutilizáveis
│   ├── Layout.tsx       # Layout principal com sidebar
│   ├── NavLink.tsx      # Links de navegação
│   └── ui/              # Componentes shadcn/ui
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── table.tsx
│       └── ...
│
├── contexts/            # Contextos React
│   └── AuthContext.tsx  # Gerenciamento de autenticação
│
├── hooks/               # Custom hooks
│   ├── use-mobile.tsx   # Detecção de dispositivo móvel
│   └── use-toast.ts     # Sistema de notificações
│
├── lib/                 # Utilitários
│   ├── excel.ts         # Funções de exportação Excel
│   └── utils.ts         # Funções utilitárias (cn, etc)
│
├── pages/               # Páginas da aplicação
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── Index.tsx        # Página inicial
│   ├── Login.tsx        # Página de login
│   ├── NotFound.tsx     # Página 404
│   ├── OrderPayments.tsx # Pagamento de pedidos
│   ├── Orders.tsx       # Gestão de pedidos
│   ├── Products.tsx     # Cadastro de produtos
│   ├── StockConsult.tsx # Consulta de estoque (explodido)
│   ├── StockEntry.tsx   # Entrada de estoque
│   ├── StockExits.tsx   # Saída de estoque
│   └── StockReport.tsx  # Relatório consolidado
│
├── services/            # Serviços e API
│   ├── api.ts           # Funções de chamada à API
│   └── mockData.ts      # Dados mockados para desenvolvimento
│
├── types/               # Definições de tipos TypeScript
│   └── index.ts         # Todos os tipos do sistema
│
├── App.tsx              # Componente raiz e rotas
├── App.css              # Estilos globais
├── index.css            # Tailwind e variáveis CSS
└── main.tsx             # Entry point
```

---

## Fluxo de Dados

### Fluxo de Pedidos

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   Usuário  │     │   Pedido   │     │  Aprovação │     │  Entrada   │
│   Cria     │────▶│   Pending  │────▶│   Admin    │────▶│  Estoque   │
│   Pedido   │     │            │     │            │     │            │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
                                             │
                                             ▼
                                   ┌────────────────────┐
                                   │  Aprovado/Rejeitado│
                                   │  Parcial           │
                                   └────────────────────┘
```

### Fluxo de Estoque

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Pedido    │     │   Notas    │     │   Itens    │     │  Parcelas  │
│  Aprovado  │────▶│  Fiscais   │────▶│  Estoque   │────▶│  Geradas   │
│            │     │   (NFs)    │     │  Criados   │     │            │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
                                             │
                                             ▼
                                   ┌────────────────────┐
                                   │  Cada unidade =    │
                                   │  1 registro        │
                                   │  (visão explodida) │
                                   └────────────────────┘
```

### Fluxo de Saída

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Seleção   │     │   Saída    │     │ Confirmação│     │   Itens    │
│  Itens     │────▶│  Criada    │────▶│   Admin    │────▶│  Status    │
│  Estoque   │     │  (Pending) │     │            │     │  "exited"  │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
```

---

## Componentes Principais

### Layout.tsx
Componente de layout principal com:
- Sidebar retrátil com navegação
- Header com informações do usuário
- Área de conteúdo principal
- Tema corporativo azul

### AuthContext.tsx
Contexto de autenticação que gerencia:
- Estado do usuário logado
- Funções de login/logout
- Verificação de permissões (isAdmin)
- Proteção de rotas

### Páginas de Estoque

#### StockEntry.tsx
- Formulário multi-step para entrada
- Suporte a múltiplas NFs
- Ajuste de preço por produto
- Geração automática de parcelas
- Controle de quantidade pendente

#### StockExits.tsx
- Seleção de itens da visão explodida
- Múltiplos produtos por saída
- Workflow de confirmação
- Edição/exclusão (admin)

#### StockConsult.tsx
- Visão explodida (1 linha = 1 unidade)
- Filtros por produto, status, fornecedor
- Exportação Excel

---

## Padrões de Código

### Tipagem
Todos os tipos estão centralizados em `src/types/index.ts`:
- Interfaces para entidades (Product, Order, StockEntry, etc.)
- Enums para status e métodos
- Types para responses da API

### Estilização
- Tailwind CSS para estilos utilitários
- Variáveis CSS em `:root` para temas
- Classes semânticas do shadcn/ui
- Fonte: Calibri (especificado pelo cliente)
- Tema: Azul corporativo

### Formulários
- React Hook Form para gerenciamento
- Zod para validação de schemas
- Componentes shadcn/ui para inputs

### Estado Servidor
- TanStack Query para cache e sync
- Mutations para operações de escrita
- Queries para leitura de dados

---

## Integração com Backend (Roadmap)

### Fase 1: Atual
- Frontend completo com mock data
- API documentada
- Tipos definidos

### Fase 2: Desenvolvimento Backend
- Implementar Cloud Functions seguindo API_REFERENCE.md
- Criar banco PostgreSQL seguindo DATABASE.md
- Configurar autenticação Firebase

### Fase 3: Integração
- Substituir chamadas mock por chamadas reais em `api.ts`
- Remover `mockData.ts`
- Configurar variáveis de ambiente
- Testes de integração

### Fase 4: Deploy
- Frontend: Vercel/Netlify ou Cloud Run
- Backend: Cloud Functions + Cloud SQL
- CDN para assets estáticos

---

## Variáveis de Ambiente

### Desenvolvimento
```env
VITE_API_URL=http://localhost:3000/api
VITE_ENV=development
```

### Produção
```env
VITE_API_URL=https://api.agconsultoria.com.br/v1
VITE_ENV=production
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
```

---

## Considerações de Segurança

### Frontend
- Tokens JWT armazenados em httpOnly cookies (recomendado)
- Validação de inputs com Zod
- Sanitização de dados exibidos
- HTTPS obrigatório

### Backend
- RLS (Row Level Security) no PostgreSQL
- Roles em tabela separada (não em users)
- Funções SECURITY DEFINER para verificação de roles
- Rate limiting na API
- Validação de todos os inputs

### Autenticação
- Nunca armazenar roles em localStorage
- Verificar permissões no servidor
- Tokens com expiração curta
- Refresh tokens para sessões longas

---

## Performance

### Frontend
- Code splitting por rotas
- Lazy loading de componentes pesados
- Memoização com useMemo/useCallback
- Virtualização para listas grandes (se necessário)

### Backend
- Índices otimizados no PostgreSQL
- Cache de queries frequentes
- Paginação obrigatória
- Connection pooling

---

## Monitoramento

### Recomendado
- Cloud Logging para logs estruturados
- Cloud Monitoring para métricas
- Error Reporting para exceções
- Trace para latência

### Métricas Chave
- Tempo de resposta da API
- Taxa de erros
- Uso de banco de dados
- Sessões ativas
