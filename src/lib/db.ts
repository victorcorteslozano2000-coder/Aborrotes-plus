import { Product, Supplier, Sale, Purchase, Expense, StockMovement, AppConfig, SyncStatus } from '../types';

// Storage keys
const KEYS = {
  PRODUCTS: 'abarrocontrol_products',
  SUPPLIERS: 'abarrocontrol_suppliers',
  SALES: 'abarrocontrol_sales',
  PURCHASES: 'abarrocontrol_purchases',
  EXPENSES: 'abarrocontrol_expenses',
  MOVEMENTS: 'abarrocontrol_movements',
  CONFIG: 'abarrocontrol_config',
  SYNC: 'abarrocontrol_sync_status',
};

// Initial default config
const DEFAULT_CONFIG: AppConfig = {
  currency: '$',
  taxRate: 16,
  theme: 'light',
  businessName: 'Mis Abarrotes "La Central"',
};

// Pre-defined list of common products with high-quality free image URLs (Unsplash) for visual polish
const PRODUCT_IMAGES: Record<string, string> = {
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400',
  soda: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400',
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
  chips: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=400',
  beans: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&q=80&w=400',
  soap: 'https://images.unsplash.com/photo-1607006342445-565a116f1406?auto=format&fit=crop&q=80&w=400',
  shampoo: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=400',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
  tuna: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=400',
  coffee: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400'
};

// Helper: load from localStorage
function load<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Error parsing key ${key}`, e);
    return defaultValue;
  }
}

// Helper: save to localStorage
function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const db = {
  getProducts(): Product[] {
    return load<Product[]>(KEYS.PRODUCTS, []);
  },
  saveProducts(products: Product[]): void {
    save(KEYS.PRODUCTS, products);
  },
  saveProduct(product: Product): void {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === product.id || p.barcode === product.barcode);
    if (idx >= 0) {
      products[idx] = product;
    } else {
      products.push(product);
    }
    this.saveProducts(products);
  },
  deleteProduct(id: string): void {
    const products = this.getProducts().filter((p) => p.id !== id);
    this.saveProducts(products);
  },

  getSuppliers(): Supplier[] {
    return load<Supplier[]>(KEYS.SUPPLIERS, []);
  },
  saveSuppliers(suppliers: Supplier[]): void {
    save(KEYS.SUPPLIERS, suppliers);
  },
  saveSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers();
    const idx = suppliers.findIndex((s) => s.id === supplier.id);
    if (idx >= 0) {
      suppliers[idx] = supplier;
    } else {
      suppliers.push(supplier);
    }
    this.saveSuppliers(suppliers);
  },
  deleteSupplier(id: string): void {
    const suppliers = this.getSuppliers().filter((s) => s.id !== id);
    this.saveSuppliers(suppliers);
  },

  getSales(): Sale[] {
    return load<Sale[]>(KEYS.SALES, []);
  },
  saveSales(sales: Sale[]): void {
    save(KEYS.SALES, sales);
  },
  saveSale(sale: Sale): void {
    const sales = this.getSales();
    sales.push(sale);
    this.saveSales(sales);

    // Update product stock and record movements
    const products = this.getProducts();
    sale.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        const prev = product.stock;
        product.stock = Math.max(0, product.stock - item.quantity);
        this.addMovement({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: sale.timestamp,
          productId: product.id,
          productName: product.name,
          type: 'venta',
          quantity: -item.quantity,
          previousStock: prev,
          newStock: product.stock,
        });
      }
    });
    this.saveProducts(products);
  },
  cancelSale(id: string): void {
    const sales = this.getSales();
    const sale = sales.find((s) => s.id === id);
    if (sale && sale.status !== 'cancelled') {
      sale.status = 'cancelled';
      this.saveSales(sales);

      // Restore product stocks
      const products = this.getProducts();
      sale.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          const prev = product.stock;
          product.stock += item.quantity;
          this.addMovement({
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            productId: product.id,
            productName: product.name,
            type: 'cancelacion_venta',
            quantity: item.quantity,
            previousStock: prev,
            newStock: product.stock,
          });
        }
      });
      this.saveProducts(products);
    }
  },

  getPurchases(): Purchase[] {
    return load<Purchase[]>(KEYS.PURCHASES, []);
  },
  savePurchases(purchases: Purchase[]): void {
    save(KEYS.PURCHASES, purchases);
  },
  savePurchase(purchase: Purchase): void {
    const purchases = this.getPurchases();
    purchases.push(purchase);
    this.savePurchases(purchases);

    // Update product cost and stock and record movements
    const products = this.getProducts();
    purchase.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        // Alert checking is done in the UI (cost compared to previous cost)
        const prev = product.stock;
        product.stock += item.quantity;
        product.cost = item.cost; // Update product cost with the latest purchase cost
        this.addMovement({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: purchase.timestamp,
          productId: product.id,
          productName: product.name,
          type: 'compra',
          quantity: item.quantity,
          previousStock: prev,
          newStock: product.stock,
        });
      }
    });
    this.saveProducts(products);
  },

  getExpenses(): Expense[] {
    return load<Expense[]>(KEYS.EXPENSES, []);
  },
  saveExpenses(expenses: Expense[]): void {
    save(KEYS.EXPENSES, expenses);
  },
  saveExpense(expense: Expense): void {
    const expenses = this.getExpenses();
    const idx = expenses.findIndex((e) => e.id === expense.id);
    if (idx >= 0) {
      expenses[idx] = expense;
    } else {
      expenses.push(expense);
    }
    this.saveExpenses(expenses);
  },
  deleteExpense(id: string): void {
    const expenses = this.getExpenses().filter((e) => e.id !== id);
    this.saveExpenses(expenses);
  },

  getMovements(): StockMovement[] {
    return load<StockMovement[]>(KEYS.MOVEMENTS, []);
  },
  addMovement(movement: StockMovement): void {
    const movements = this.getMovements();
    movements.unshift(movement); // Newest first
    save(KEYS.MOVEMENTS, movements.slice(0, 1000)); // Keep last 1000 records
  },

  getConfig(): AppConfig {
    return load<AppConfig>(KEYS.CONFIG, DEFAULT_CONFIG);
  },
  saveConfig(config: AppConfig): void {
    save(KEYS.CONFIG, config);
  },

  getSyncStatus(): SyncStatus {
    return load<SyncStatus>(KEYS.SYNC, { lastSynced: null, status: 'offline' });
  },
  saveSyncStatus(status: SyncStatus): void {
    save(KEYS.SYNC, status);
  },

  // Database actions: import, export, clear
  clearAllData(): void {
    localStorage.removeItem(KEYS.PRODUCTS);
    localStorage.removeItem(KEYS.SUPPLIERS);
    localStorage.removeItem(KEYS.SALES);
    localStorage.removeItem(KEYS.PURCHASES);
    localStorage.removeItem(KEYS.EXPENSES);
    localStorage.removeItem(KEYS.MOVEMENTS);
    localStorage.removeItem(KEYS.CONFIG);
    localStorage.removeItem(KEYS.SYNC);
  },

  exportBackup(): string {
    const backup = {
      products: this.getProducts(),
      suppliers: this.getSuppliers(),
      sales: this.getSales(),
      purchases: this.getPurchases(),
      expenses: this.getExpenses(),
      movements: this.getMovements(),
      config: this.getConfig(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackup(backupStr: string): boolean {
    try {
      const backup = JSON.parse(backupStr);
      if (backup.products) this.saveProducts(backup.products);
      if (backup.suppliers) this.saveSuppliers(backup.suppliers);
      if (backup.sales) this.saveSales(backup.sales);
      if (backup.purchases) this.savePurchases(backup.purchases);
      if (backup.expenses) this.saveExpenses(backup.expenses);
      if (backup.movements) save(KEYS.MOVEMENTS, backup.movements);
      if (backup.config) this.saveConfig(backup.config);
      this.saveSyncStatus({ lastSynced: new Date().toISOString(), status: 'synced' });
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  },

  // Populate Demo Data
  seedDemoData(): void {
    this.clearAllData();

    // 1. Suppliers
    const suppliers: Supplier[] = [
      {
        id: 'sup1',
        name: 'Distribuidora Bimbo',
        phone: '55-1234-5678',
        address: 'Av. Constituyentes 400, CDMX',
        observations: 'Visita los martes y jueves en la mañana.',
        visitDays: ['Martes', 'Jueves'],
      },
      {
        id: 'sup2',
        name: 'Coca-Cola FEMSA',
        phone: '55-8765-4321',
        address: 'Calzada de Tlalpan 1234, CDMX',
        observations: 'Visita los lunes y viernes. Requiere pago de contado o transferencia.',
        visitDays: ['Lunes', 'Viernes'],
      },
      {
        id: 'sup3',
        name: 'Lácteos Santa Clara',
        phone: '55-9988-7766',
        address: 'Zona Industrial Vallejo, CDMX',
        observations: 'Surtido de leche fresca los miércoles.',
        visitDays: ['Miércoles'],
      },
      {
        id: 'sup4',
        name: 'Abarrotes El Patrón S.A.',
        phone: '55-3344-5566',
        address: 'Central de Abastos Pasillo I, CDMX',
        observations: 'Proveedor general de granos, enlatados y productos de limpieza.',
        visitDays: ['Sábado'],
      }
    ];
    this.saveSuppliers(suppliers);

    // 2. Products
    const products: Product[] = [
      {
        id: 'p1',
        barcode: '7501000111223',
        name: 'Leche Entera Santa Clara 1L',
        category: 'Lácteos',
        supplierId: 'sup3',
        cost: 19.50,
        price: 26.00,
        stock: 35,
        minStock: 10,
        imageUrl: PRODUCT_IMAGES.milk,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'p2',
        barcode: '7501055300075',
        name: 'Coca-Cola Original 600ml',
        category: 'Bebidas',
        supplierId: 'sup2',
        cost: 11.20,
        price: 18.00,
        stock: 48,
        minStock: 15,
        imageUrl: PRODUCT_IMAGES.soda,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'p3',
        barcode: '7501000111300',
        name: 'Pan Dulce Conchas Bimbo 2 pzas',
        category: 'Panadería',
        supplierId: 'sup1',
        cost: 15.00,
        price: 21.00,
        stock: 4, // LOW STOCK ON PURPOSE FOR ALERTS!
        minStock: 8,
        imageUrl: PRODUCT_IMAGES.bread,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'p4',
        barcode: '7501011115566',
        name: 'Papas Sabritas Sal 45g',
        category: 'Botanas',
        supplierId: 'sup4',
        cost: 12.00,
        price: 17.50,
        stock: 42,
        minStock: 12,
        imageUrl: PRODUCT_IMAGES.chips,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'p5',
        barcode: '7501001421390',
        name: 'Frijoles Bayos Refritos La Costeña 400g',
        category: 'Enlatados y Conservas',
        supplierId: 'sup4',
        cost: 10.50,
        price: 15.00,
        stock: 25,
        minStock: 10,
        imageUrl: PRODUCT_IMAGES.beans,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'p6',
        barcode: '7501001155990',
        name: 'Jabón Zote Blanco 400g',
        category: 'Limpieza',
        supplierId: 'sup4',
        cost: 15.00,
        price: 22.00,
        stock: 20,
        minStock: 5,
        imageUrl: PRODUCT_IMAGES.soap,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'p7',
        barcode: '7501000300123',
        name: 'Shampoo Pantene Restauración 400ml',
        category: 'Cuidado Personal',
        supplierId: 'sup4',
        cost: 45.00,
        price: 65.00,
        stock: 8,
        minStock: 3,
        imageUrl: PRODUCT_IMAGES.shampoo,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'p8',
        barcode: '7501021421000',
        name: 'Arroz Súper Extra Morelos 1kg',
        category: 'Granos y Semillas',
        supplierId: 'sup4',
        cost: 21.00,
        price: 29.50,
        stock: 18,
        minStock: 8,
        imageUrl: PRODUCT_IMAGES.rice,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'p9',
        barcode: '7501006540112',
        name: 'Atún en Agua Herdez 140g',
        category: 'Enlatados y Conservas',
        supplierId: 'sup4',
        cost: 13.50,
        price: 19.50,
        stock: 30,
        minStock: 10,
        imageUrl: PRODUCT_IMAGES.tuna,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'p10',
        barcode: '7501000222019',
        name: 'Café Soluble Nescafé Clásico 120g',
        category: 'Enlatados y Conservas',
        supplierId: 'sup4',
        cost: 52.00,
        price: 74.00,
        stock: 2, // LOW STOCK AS WELL
        minStock: 5,
        imageUrl: PRODUCT_IMAGES.coffee,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      }
    ];
    this.saveProducts(products);

    // 3. Historical Sales (generate data for the last 14 days)
    const sales: Sale[] = [];
    const movements: StockMovement[] = [];
    const expenses: Expense[] = [];
    const purchases: Purchase[] = [];

    const paymentMethods: Array<'efectivo' | 'transferencia' | 'tarjeta'> = ['efectivo', 'efectivo', 'tarjeta', 'transferencia'];
    
    // Day helper
    const today = new Date();
    
    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const date = new Date(today.getTime() - dayOffset * 24 * 3600 * 1000);
      const isToday = dayOffset === 0;

      // Sales per day: 3 to 10 sales
      const salesCount = isToday ? 5 : Math.floor(Math.random() * 8) + 4;
      for (let s = 0; s < salesCount; s++) {
        // Set distinct times of day
        const saleHour = 8 + Math.floor(Math.random() * 12);
        const saleMin = Math.floor(Math.random() * 60);
        const saleDate = new Date(date.getTime());
        saleDate.setHours(saleHour, saleMin, 0);

        // Select 1 to 4 random products
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const selectedItems: { productId: string; name: string; cost: number; price: number; quantity: number; subtotal: number }[] = [];
        let saleTotal = 0;
        let saleCost = 0;

        const shuffledProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, itemCount);
        shuffledProducts.forEach((p) => {
          const qty = Math.floor(Math.random() * 3) + 1;
          const subtotal = p.price * qty;
          selectedItems.push({
            productId: p.id,
            name: p.name,
            cost: p.cost,
            price: p.price,
            quantity: qty,
            subtotal,
          });
          saleTotal += subtotal;
          saleCost += p.cost * qty;
        });

        const taxRate = 16;
        const taxAmount = parseFloat(((saleTotal * taxRate) / (100 + taxRate)).toFixed(2));
        const profit = parseFloat((saleTotal - saleCost).toFixed(2));

        const sale: Sale = {
          id: `sale-${dayOffset}-${s}`,
          timestamp: saleDate.toISOString(),
          items: selectedItems,
          total: parseFloat(saleTotal.toFixed(2)),
          profit,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          taxAmount,
          status: 'active',
        };
        sales.push(sale);

        // Record stock movements for these sales
        selectedItems.forEach((it) => {
          movements.push({
            id: `mov-sale-${dayOffset}-${s}-${it.productId}`,
            timestamp: saleDate.toISOString(),
            productId: it.productId,
            productName: it.name,
            type: 'venta',
            quantity: -it.quantity,
            previousStock: 45, // approximate
            newStock: 45 - it.quantity,
          });
        });
      }

      // Expenses per day (or every few days): bills, rentals, etc.
      if (dayOffset % 3 === 0) {
        const categories = ['Servicios', 'Renta', 'Papelería', 'Mantenimiento', 'Limpieza'];
        const desc = [
          'Pago de Luz Eléctrica CFE',
          'Renta mensual del local',
          'Bolsas de plástico y papelería',
          'Reparación de refrigerador de refrescos',
          'Artículos de limpieza para tienda'
        ];
        const idx = Math.floor(Math.random() * categories.length);
        const amount = idx === 1 ? 500 : Math.floor(Math.random() * 200) + 50; // renta is higher

        const expDate = new Date(date.getTime());
        expDate.setHours(12, 0, 0);

        expenses.push({
          id: `exp-${dayOffset}`,
          timestamp: expDate.toISOString(),
          description: desc[idx],
          category: categories[idx],
          amount: amount,
        });
      }

      // Purchases (restocking from suppliers) once in a while
      if (dayOffset === 10 || dayOffset === 4) {
        const purchaseDate = new Date(date.getTime());
        purchaseDate.setHours(9, 30, 0);

        // Restock Milk and Soda
        const pItems = [
          {
            productId: 'p1',
            name: 'Leche Entera Santa Clara 1L',
            cost: 19.50,
            quantity: 24,
            subtotal: 19.50 * 24
          },
          {
            productId: 'p2',
            name: 'Coca-Cola Original 600ml',
            cost: 11.20,
            quantity: 36,
            subtotal: 11.20 * 36
          }
        ];
        const total = pItems.reduce((acc, item) => acc + item.subtotal, 0);

        purchases.push({
          id: `pur-${dayOffset}`,
          timestamp: purchaseDate.toISOString(),
          supplierId: 'sup3',
          supplierName: 'Lácteos Santa Clara',
          items: pItems,
          total,
        });

        pItems.forEach((it) => {
          movements.push({
            id: `mov-pur-${dayOffset}-${it.productId}`,
            timestamp: purchaseDate.toISOString(),
            productId: it.productId,
            productName: it.name,
            type: 'compra',
            quantity: it.quantity,
            previousStock: 10,
            newStock: 10 + it.quantity,
          });
        });
      }
    }

    save(KEYS.SALES, sales);
    save(KEYS.EXPENSES, expenses);
    save(KEYS.PURCHASES, purchases);
    save(KEYS.MOVEMENTS, movements.slice(0, 500));
    this.saveConfig({
      ...DEFAULT_CONFIG,
      businessName: 'Mis Abarrotes "La Central"',
    });
    this.saveSyncStatus({ lastSynced: new Date().toISOString(), status: 'synced' });
  }
};

// Check if db is empty and seed if first run
const currentProducts = db.getProducts();
if (currentProducts.length === 0) {
  db.seedDemoData();
}
