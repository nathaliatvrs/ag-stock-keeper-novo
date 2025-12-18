# AG Consultoria - Sistema de Inventário

Sistema de gestão de inventário desenvolvido para AG Consultoria, com controle de pedidos, entrada/saída de estoque, e gestão de pagamentos.

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [DATABASE.md](./docs/DATABASE.md) | Scripts SQL, schema, índices e políticas RLS |
| [BUSINESS_RULES.md](./docs/BUSINESS_RULES.md) | Regras de negócio e workflows |
| [API_REFERENCE.md](./docs/API_REFERENCE.md) | Documentação completa dos endpoints REST |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Arquitetura do sistema e stack tecnológica |

## Stack Tecnológica

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend (planejado)**: GCP Cloud Functions, Cloud SQL (PostgreSQL)

## Funcionalidades

- ✅ Cadastro de produtos com fornecedor e custo
- ✅ Pedidos multi-produto com workflow de aprovação
- ✅ Entrada de estoque com múltiplas NFs e ajuste de preço
- ✅ Visão explodida do estoque (1 linha = 1 unidade)
- ✅ Saída de estoque com rastreabilidade
- ✅ Gestão de parcelas de pagamento
- ✅ Exportação Excel em todas as telas
- ✅ Hierarquia de usuários (Admin/User)

## Instalação

```sh
# Clone o repositório
git clone <YOUR_GIT_URL>

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

## Variáveis de Ambiente

```env
VITE_API_URL=https://api.agconsultoria.com.br/v1
VITE_ENV=production
```

## Desenvolvimento

O projeto segue abordagem **frontend-first**:
1. Frontend completo com dados mockados (`src/services/mockData.ts`)
2. API documentada em `docs/API_REFERENCE.md`
3. Equipe backend implementa endpoints seguindo documentação
4. Substituir mock por chamadas reais em `src/services/api.ts`

## Deploy

Abra o projeto no [Lovable](https://lovable.dev) e clique em Share → Publish.
