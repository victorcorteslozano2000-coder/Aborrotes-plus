export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  supplierId: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  observations: string;
  visitDays: string[]; // ['Lunes', 'Martes', etc.]
}

export interface SaleItem {
  productId: string;
  name: string;
  cost: number;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  timestamp: string;
  items: SaleItem[];
  total: number;
  profit: number;
  paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta';
  taxAmount: number;
  status: 'active' | 'cancelled';
}

export interface PurchaseItem {
  productId: string;
  name: string;
  cost: number;
  quantity: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  timestamp: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
}

export interface Expense {
  id: string;
  timestamp: string;
  description: string;
  category: string;
  amount: number;
}

export type MovementType = 'venta' | 'compra' | 'ajuste_positivo' | 'ajuste_negativo' | 'cancelacion_venta';

export interface StockMovement {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
}

export interface AppConfig {
  currency: string;
  taxRate: number; // e.g. 16 for 16% VAT
  theme: 'light' | 'dark';
  businessName: string;
  securityEnabled?: boolean;
  securityPin?: string;
  fingerprintRegistered?: boolean;
  faceRegistered?: boolean;
}

export interface SyncStatus {
  lastSynced: string | null;
  status: 'synced' | 'pending' | 'offline' | 'error';
}
