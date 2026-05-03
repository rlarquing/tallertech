// ============================================================
// Database Setup - Create tables if they don't exist
// Used by seed route to ensure schema exists before seeding
// ============================================================

import { createClient, type Client } from '@libsql/client'

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'admin',
  active BOOLEAN NOT NULL DEFAULT true,
  image TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Workshop (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'America/Havana',
  settings TEXT NOT NULL DEFAULT '{}',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS WorkshopUser (
  id TEXT PRIMARY KEY NOT NULL,
  workshopId TEXT NOT NULL,
  userId TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  joinedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workshopId) REFERENCES Workshop(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(workshopId, userId)
);

CREATE TABLE IF NOT EXISTS Category (
  id TEXT PRIMARY KEY NOT NULL,
  workshopId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'product',
  active BOOLEAN NOT NULL DEFAULT true,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workshopId) REFERENCES Workshop(id)
);

CREATE TABLE IF NOT EXISTS Supplier (
  id TEXT PRIMARY KEY NOT NULL,
  workshopId TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workshopId) REFERENCES Workshop(id)
);

CREATE TABLE IF NOT EXISTS Product (
  id TEXT PRIMARY KEY NOT NULL,
  workshopId TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  categoryId TEXT,
  supplierId TEXT,
  costPrice REAL NOT NULL DEFAULT 0,
  salePrice REAL NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  minStock INTEGER NOT NULL DEFAULT 5,
  unit TEXT NOT NULL DEFAULT 'unidad',
  type TEXT NOT NULL DEFAULT 'product',
  brand TEXT,
  model TEXT,
  location TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workshopId) REFERENCES Workshop(id),
  FOREIGN KEY (categoryId) REFERENCES Category(id),
  FOREIGN KEY (supplierId) REFERENCES Supplier(id)
);

CREATE TABLE IF NOT EXISTS Customer (
  id TEXT PRIMARY KEY NOT NULL,
  workshopId TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  dni TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workshopId) REFERENCES Workshop(id)
);

CREATE TABLE IF NOT EXISTS Sale (
  id TEXT PRIMARY KEY NOT NULL,
  workshopId TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  customerId TEXT,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  paymentMethod TEXT NOT NULL DEFAULT 'efectivo',
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workshopId) REFERENCES Workshop(id),
  FOREIGN KEY (customerId) REFERENCES Customer(id)
);

CREATE TABLE IF NOT EXISTS SaleItem (
  id TEXT PRIMARY KEY NOT NULL,
  saleId TEXT NOT NULL,
  productId TEXT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unitPrice REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'product',
  FOREIGN KEY (saleId) REFERENCES Sale(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES Product(id)
);

CREATE TABLE IF NOT EXISTS RepairOrder (
  id TEXT PRIMARY KEY NOT NULL,
  workshopId TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  customerId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  device TEXT NOT NULL,
  brand TEXT,
  imei TEXT,
  issue TEXT NOT NULL,
  diagnosis TEXT,
  solution TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  priority TEXT NOT NULL DEFAULT 'normal',
  costEstimate REAL NOT NULL DEFAULT 0,
  laborCost REAL NOT NULL DEFAULT 0,
  partsCost REAL NOT NULL DEFAULT 0,
  totalCost REAL NOT NULL DEFAULT 0,
  paymentMethod TEXT NOT NULL DEFAULT 'efectivo',
  paid BOOLEAN NOT NULL DEFAULT false,
  receivedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estimatedReady DATETIME,
  completedAt DATETIME,
  deliveredAt DATETIME,
  notes TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workshopId) REFERENCES Workshop(id),
  FOREIGN KEY (customerId) REFERENCES Customer(id)
);

CREATE TABLE IF NOT EXISTS RepairPart (
  id TEXT PRIMARY KEY NOT NULL,
  repairOrderId TEXT NOT NULL,
  productId TEXT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unitPrice REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (repairOrderId) REFERENCES RepairOrder(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES Product(id)
);

CREATE TABLE IF NOT EXISTS StockMovement (
  id TEXT PRIMARY KEY NOT NULL,
  productId TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference TEXT,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES Product(id)
);

CREATE TABLE IF NOT EXISTS Expense (
  id TEXT PRIMARY KEY NOT NULL,
  workshopId TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workshopId) REFERENCES Workshop(id)
);

CREATE TABLE IF NOT EXISTS Setting (
  id TEXT PRIMARY KEY NOT NULL,
  workshopId TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  FOREIGN KEY (workshopId) REFERENCES Workshop(id),
  UNIQUE(workshopId, key)
);

CREATE TABLE IF NOT EXISTS AuditLog (
  id TEXT PRIMARY KEY NOT NULL,
  workshopId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entityId TEXT,
  details TEXT,
  ip TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workshopId) REFERENCES Workshop(id)
);

CREATE INDEX IF NOT EXISTS WorkshopUser_workshopId_idx ON WorkshopUser(workshopId);
CREATE INDEX IF NOT EXISTS WorkshopUser_userId_idx ON WorkshopUser(userId);
CREATE INDEX IF NOT EXISTS Category_workshopId_idx ON Category(workshopId);
CREATE INDEX IF NOT EXISTS Supplier_workshopId_idx ON Supplier(workshopId);
CREATE INDEX IF NOT EXISTS Product_workshopId_idx ON Product(workshopId);
CREATE INDEX IF NOT EXISTS Product_categoryId_idx ON Product(categoryId);
CREATE INDEX IF NOT EXISTS Product_supplierId_idx ON Product(supplierId);
CREATE INDEX IF NOT EXISTS Customer_workshopId_idx ON Customer(workshopId);
CREATE INDEX IF NOT EXISTS Sale_workshopId_idx ON Sale(workshopId);
CREATE INDEX IF NOT EXISTS Sale_customerId_idx ON Sale(customerId);
CREATE INDEX IF NOT EXISTS SaleItem_saleId_idx ON SaleItem(saleId);
CREATE INDEX IF NOT EXISTS SaleItem_productId_idx ON SaleItem(productId);
CREATE INDEX IF NOT EXISTS RepairOrder_workshopId_idx ON RepairOrder(workshopId);
CREATE INDEX IF NOT EXISTS RepairOrder_customerId_idx ON RepairOrder(customerId);
CREATE INDEX IF NOT EXISTS RepairPart_repairOrderId_idx ON RepairPart(repairOrderId);
CREATE INDEX IF NOT EXISTS RepairPart_productId_idx ON RepairPart(productId);
CREATE INDEX IF NOT EXISTS StockMovement_productId_idx ON StockMovement(productId);
CREATE INDEX IF NOT EXISTS Expense_workshopId_idx ON Expense(workshopId);
CREATE INDEX IF NOT EXISTS Setting_workshopId_idx ON Setting(workshopId);
CREATE INDEX IF NOT EXISTS AuditLog_workshopId_idx ON AuditLog(workshopId);
`

export async function ensureSchemaExists(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  const authToken = process.env.DATABASE_AUTH_TOKEN
  const isLocal = databaseUrl.startsWith('file:')

  const client: Client = createClient({
    url: databaseUrl,
    authToken: isLocal ? undefined : (authToken || undefined),
  })

  try {
    // Execute each statement separately for libSQL compatibility
    const statements = CREATE_TABLES_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const statement of statements) {
      await client.execute(statement)
    }

    console.log('[db-setup] Schema verified/created successfully')
  } catch (error) {
    console.error('[db-setup] Error creating schema:', error)
    throw error
  } finally {
    client.close()
  }
}
