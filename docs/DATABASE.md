# AG Consultoria - Documentação do Banco de Dados

## Visão Geral

Este documento descreve a estrutura do banco de dados PostgreSQL para o sistema de inventário AG Consultoria.

## Diagrama ER

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   USERS     │     │  PRODUCTS   │     │   USER_ROLES    │
├─────────────┤     ├─────────────┤     ├─────────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)         │
│ name        │     │ name        │     │ user_id (FK)    │
│ email       │     │ supplier    │     │ role            │
│ created_at  │     │ unit_cost   │     └─────────────────┘
└─────────────┘     │ unit_type   │
       │            │ created_at  │
       │            │ updated_at  │
       │            └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────────┐
│   ORDERS    │     │  ORDER_ITEMS    │
├─────────────┤     ├─────────────────┤
│ id (PK)     │◄────│ id (PK)         │
│ order_number│     │ order_id (FK)   │
│ date        │     │ product_id (FK) │
│ status      │     │ quantity        │
│ user_id(FK) │     │ status          │
│ created_at  │     │ unit_cost       │
│ updated_at  │     │ supplier        │
└─────────────┘     └─────────────────┘
       │                   │
       ▼                   ▼
┌─────────────────┐  ┌─────────────────────┐
│ STOCK_ENTRIES   │  │ STOCK_ENTRY_INVOICES│
├─────────────────┤  ├─────────────────────┤
│ id (PK)         │◄─│ id (PK)             │
│ order_id (FK)   │  │ stock_entry_id (FK) │
│ date            │  │ invoice_number      │
│ payment_method  │  └─────────────────────┘
│ installments    │            │
│ first_due_date  │            ▼
│ created_at      │  ┌─────────────────────────┐
└─────────────────┘  │ STOCK_ENTRY_INVOICE_ITEMS│
       │             ├─────────────────────────┤
       │             │ id (PK)                 │
       ▼             │ invoice_id (FK)         │
┌─────────────────┐  │ order_item_id (FK)      │
│  STOCK_ITEMS    │  │ quantity                │
├─────────────────┤  │ adjusted_unit_cost      │
│ id (PK)         │  └─────────────────────────┘
│ stock_entry_id  │
│ invoice_item_id │
│ product_id (FK) │
│ unit_cost       │
│ entry_date      │
│ supplier        │
│ status          │
│ exit_id (FK)    │
└─────────────────┘
       │
       ▼
┌─────────────────┐     ┌─────────────────────┐
│  STOCK_EXITS    │     │  STOCK_EXIT_ITEMS   │
├─────────────────┤     ├─────────────────────┤
│ id (PK)         │◄────│ id (PK)             │
│ exit_date       │     │ stock_exit_id (FK)  │
│ observation     │     │ stock_item_id (FK)  │
│ status          │     │ product_id (FK)     │
│ user_id (FK)    │     │ quantity            │
│ confirmed_by    │     │ unit_cost           │
│ created_at      │     │ supplier            │
└─────────────────┘     └─────────────────────┘

┌─────────────────────┐
│ PAYMENT_INSTALLMENTS│
├─────────────────────┤
│ id (PK)             │
│ stock_entry_id (FK) │
│ invoice_id (FK)     │
│ installment_number  │
│ due_date            │
│ amount              │
│ status              │
│ paid_date           │
│ created_at          │
└─────────────────────┘
```

## Scripts SQL

### Tipos Enumerados

```sql
-- Roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Status de item de pedido
CREATE TYPE public.order_item_status AS ENUM ('pending', 'approved', 'rejected');

-- Status de pedido
CREATE TYPE public.order_status AS ENUM ('pending', 'approved', 'rejected', 'partial');

-- Métodos de pagamento
CREATE TYPE public.payment_method AS ENUM ('credit_card', 'boleto', 'pix');

-- Status de item de estoque
CREATE TYPE public.stock_item_status AS ENUM ('available', 'exited');

-- Status de saída de estoque
CREATE TYPE public.stock_exit_status AS ENUM ('pending', 'confirmed');

-- Status de parcela
CREATE TYPE public.installment_status AS ENUM ('pending', 'paid');
```

### Tabela: users

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON public.users(email);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

### Tabela: user_roles

```sql
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Índices
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar role (SECURITY DEFINER para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Política: usuários podem ver seus próprios roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### Tabela: products

```sql
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    unit_cost DECIMAL(12, 2) NOT NULL,
    unit_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_supplier ON public.products(supplier);

-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products"
ON public.products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

### Tabela: orders

```sql
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    user_id UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_date ON public.orders(date);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending orders"
ON public.orders FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() AND status = 'pending'
    OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

### Tabela: order_items

```sql
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(12, 2) NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    status order_item_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_order_items_status ON public.order_items(status);

-- RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all order items"
ON public.order_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert order items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE id = order_id AND user_id = auth.uid()
    )
);
```

### Tabela: stock_entries

```sql
CREATE TABLE public.stock_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) NOT NULL,
    date DATE NOT NULL,
    payment_method payment_method NOT NULL,
    installments INTEGER NOT NULL DEFAULT 1 CHECK (installments >= 1),
    first_due_date DATE NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_stock_entries_order_id ON public.stock_entries(order_id);
CREATE INDEX idx_stock_entries_date ON public.stock_entries(date);
CREATE INDEX idx_stock_entries_user_id ON public.stock_entries(user_id);

-- RLS
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all stock entries"
ON public.stock_entries FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert stock entries"
ON public.stock_entries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### Tabela: stock_entry_invoices

```sql
CREATE TABLE public.stock_entry_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_entry_id UUID REFERENCES public.stock_entries(id) ON DELETE CASCADE NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_stock_entry_invoices_stock_entry_id ON public.stock_entry_invoices(stock_entry_id);
CREATE INDEX idx_stock_entry_invoices_invoice_number ON public.stock_entry_invoices(invoice_number);

-- RLS
ALTER TABLE public.stock_entry_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all invoices"
ON public.stock_entry_invoices FOR SELECT
TO authenticated
USING (true);
```

### Tabela: stock_entry_invoice_items

```sql
CREATE TABLE public.stock_entry_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.stock_entry_invoices(id) ON DELETE CASCADE NOT NULL,
    order_item_id UUID REFERENCES public.order_items(id) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    adjusted_unit_cost DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_invoice_items_invoice_id ON public.stock_entry_invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_order_item_id ON public.stock_entry_invoice_items(order_item_id);

-- RLS
ALTER TABLE public.stock_entry_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all invoice items"
ON public.stock_entry_invoice_items FOR SELECT
TO authenticated
USING (true);
```

### Tabela: stock_items

```sql
CREATE TABLE public.stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_entry_id UUID REFERENCES public.stock_entries(id) NOT NULL,
    invoice_item_id UUID REFERENCES public.stock_entry_invoice_items(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_cost DECIMAL(12, 2) NOT NULL,
    entry_date DATE NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    status stock_item_status NOT NULL DEFAULT 'available',
    exit_id UUID REFERENCES public.stock_exits(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_stock_items_stock_entry_id ON public.stock_items(stock_entry_id);
CREATE INDEX idx_stock_items_product_id ON public.stock_items(product_id);
CREATE INDEX idx_stock_items_status ON public.stock_items(status);
CREATE INDEX idx_stock_items_exit_id ON public.stock_items(exit_id);
CREATE INDEX idx_stock_items_entry_date ON public.stock_items(entry_date);

-- RLS
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all stock items"
ON public.stock_items FOR SELECT
TO authenticated
USING (true);
```

### Tabela: stock_exits

```sql
CREATE TABLE public.stock_exits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exit_date DATE NOT NULL,
    observation TEXT,
    status stock_exit_status NOT NULL DEFAULT 'pending',
    user_id UUID REFERENCES public.users(id) NOT NULL,
    confirmed_by UUID REFERENCES public.users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_stock_exits_exit_date ON public.stock_exits(exit_date);
CREATE INDEX idx_stock_exits_status ON public.stock_exits(status);
CREATE INDEX idx_stock_exits_user_id ON public.stock_exits(user_id);

-- RLS
ALTER TABLE public.stock_exits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all stock exits"
ON public.stock_exits FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert stock exits"
ON public.stock_exits FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update stock exits"
ON public.stock_exits FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete stock exits"
ON public.stock_exits FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

### Tabela: stock_exit_items

```sql
CREATE TABLE public.stock_exit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_exit_id UUID REFERENCES public.stock_exits(id) ON DELETE CASCADE NOT NULL,
    stock_item_id UUID REFERENCES public.stock_items(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost DECIMAL(12, 2) NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_stock_exit_items_stock_exit_id ON public.stock_exit_items(stock_exit_id);
CREATE INDEX idx_stock_exit_items_stock_item_id ON public.stock_exit_items(stock_item_id);
CREATE INDEX idx_stock_exit_items_product_id ON public.stock_exit_items(product_id);

-- RLS
ALTER TABLE public.stock_exit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all stock exit items"
ON public.stock_exit_items FOR SELECT
TO authenticated
USING (true);
```

### Tabela: payment_installments

```sql
CREATE TABLE public.payment_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_entry_id UUID REFERENCES public.stock_entries(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES public.stock_entry_invoices(id) NOT NULL,
    installment_number INTEGER NOT NULL CHECK (installment_number >= 1),
    due_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status installment_status NOT NULL DEFAULT 'pending',
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_payment_installments_stock_entry_id ON public.payment_installments(stock_entry_id);
CREATE INDEX idx_payment_installments_invoice_id ON public.payment_installments(invoice_id);
CREATE INDEX idx_payment_installments_due_date ON public.payment_installments(due_date);
CREATE INDEX idx_payment_installments_status ON public.payment_installments(status);

-- RLS
ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all installments"
ON public.payment_installments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update installment status"
ON public.payment_installments FOR UPDATE
TO authenticated
USING (true);
```

## Views Úteis

### View: estoque_consolidado

```sql
CREATE OR REPLACE VIEW public.v_stock_summary AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.supplier,
    p.unit_type,
    COUNT(CASE WHEN si.status = 'available' THEN 1 END) AS available_quantity,
    COALESCE(SUM(CASE WHEN si.status = 'available' THEN si.unit_cost END), 0) AS total_value,
    MAX(si.entry_date) AS last_entry_date
FROM public.products p
LEFT JOIN public.stock_items si ON p.id = si.product_id
GROUP BY p.id, p.name, p.supplier, p.unit_type;
```

### View: pedidos_pendentes

```sql
CREATE OR REPLACE VIEW public.v_pending_orders AS
SELECT 
    o.id,
    o.order_number,
    o.date,
    o.status,
    u.name AS user_name,
    COUNT(oi.id) AS item_count,
    SUM(oi.quantity * oi.unit_cost) AS total_value
FROM public.orders o
JOIN public.users u ON o.user_id = u.id
JOIN public.order_items oi ON o.id = oi.order_id
WHERE o.status = 'pending'
GROUP BY o.id, o.order_number, o.date, o.status, u.name;
```

## Triggers

### Trigger: atualizar updated_at

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_exits_updated_at
    BEFORE UPDATE ON public.stock_exits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

### Trigger: atualizar status do pedido

```sql
CREATE OR REPLACE FUNCTION public.update_order_status()
RETURNS TRIGGER AS $$
DECLARE
    approved_count INTEGER;
    rejected_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT 
        COUNT(CASE WHEN status = 'approved' THEN 1 END),
        COUNT(CASE WHEN status = 'rejected' THEN 1 END),
        COUNT(*)
    INTO approved_count, rejected_count, total_count
    FROM public.order_items
    WHERE order_id = NEW.order_id;
    
    IF approved_count = total_count THEN
        UPDATE public.orders SET status = 'approved' WHERE id = NEW.order_id;
    ELSIF rejected_count = total_count THEN
        UPDATE public.orders SET status = 'rejected' WHERE id = NEW.order_id;
    ELSIF approved_count > 0 OR rejected_count > 0 THEN
        UPDATE public.orders SET status = 'partial' WHERE id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_status_on_item_change
    AFTER UPDATE ON public.order_items
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.update_order_status();
```

## Constraints de Negócio

```sql
-- Garantir que quantidade de entrada não exceda quantidade do pedido
CREATE OR REPLACE FUNCTION public.check_entry_quantity()
RETURNS TRIGGER AS $$
DECLARE
    order_quantity INTEGER;
    already_entered INTEGER;
BEGIN
    SELECT oi.quantity INTO order_quantity
    FROM public.order_items oi
    WHERE oi.id = NEW.order_item_id;
    
    SELECT COALESCE(SUM(seii.quantity), 0) INTO already_entered
    FROM public.stock_entry_invoice_items seii
    WHERE seii.order_item_id = NEW.order_item_id
      AND seii.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000');
    
    IF (already_entered + NEW.quantity) > order_quantity THEN
        RAISE EXCEPTION 'Quantidade de entrada excede quantidade pendente do pedido';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_entry_quantity_trigger
    BEFORE INSERT OR UPDATE ON public.stock_entry_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.check_entry_quantity();
```
