import React, { useState, useEffect } from 'react';
import { db } from './lib/db';
import { Product, Supplier, Sale, Purchase, Expense, AppConfig, SyncStatus, StockMovement } from './types';

// Subcomponents
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Purchases from './components/Purchases';
import Suppliers from './components/Suppliers';
import Expenses from './components/Expenses';
import Reports from './components/Reports';
import BusinessIntel from './components/BusinessIntel';
import Configuration from './components/Configuration';
import BiometricLogin from './components/BiometricLogin';

// Icons
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
  BarChart3,
  BrainCircuit,
  Settings,
  Wifi,
  Smartphone,
  Monitor,
  Menu,
  X,
  Store,
  Clock,
  CircleDot,
  Lock
} from 'lucide-react';

export default function App() {
  // DB States
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    businessName: 'Mi Tiendita de Abarrotes',
    taxRate: 16,
    currency: '$',
    theme: 'light',
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSynced: new Date().toISOString(),
    status: 'synced',
  });

  // Navigation states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Phone Mockup Simulation frame state
  const [phoneFrame, setPhoneFrame] = useState(false);

  // Security Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Load everything on mount
  useEffect(() => {
    const loadedConfig = db.getConfig();
    if (loadedConfig.securityEnabled) {
      setIsAuthenticated(false);
    }
    loadAllData();
  }, []);

  const loadAllData = () => {
    setProducts(db.getProducts());
    setSuppliers(db.getSuppliers());
    setSales(db.getSales());
    setPurchases(db.getPurchases());
    setExpenses(db.getExpenses());
    setMovements(db.getMovements());
    setConfig(db.getConfig());
    setSyncStatus(db.getSyncStatus());
  };

  const handleUpdateConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    if (!newConfig.securityEnabled) {
      setIsAuthenticated(true);
    }
  };

  // Nav items configuration
  const navigationItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'sales', label: 'Caja Ventas', icon: ShoppingCart },
    { id: 'purchases', label: 'Compras Surtido', icon: TrendingUp },
    { id: 'suppliers', label: 'Proveedores', icon: Users },
    { id: 'expenses', label: 'Gastos Caja', icon: Wallet },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
    { id: 'ai', label: 'Consultor AI', icon: BrainCircuit },
    { id: 'config', label: 'Ajustes', icon: Settings },
  ];

  // Render correct sub component
  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            products={products}
            sales={sales}
            expenses={expenses}
            currency={config.currency}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'inventory':
        return (
          <Inventory
            products={products}
            suppliers={suppliers}
            movements={movements}
            currency={config.currency}
            onRefresh={loadAllData}
          />
        );
      case 'sales':
        return (
          <Sales
            products={products}
            sales={sales}
            currency={config.currency}
            taxRate={config.taxRate}
            onRefresh={loadAllData}
          />
        );
      case 'purchases':
        return (
          <Purchases
            products={products}
            suppliers={suppliers}
            purchases={purchases}
            currency={config.currency}
            onRefresh={loadAllData}
          />
        );
      case 'suppliers':
        return <Suppliers suppliers={suppliers} onRefresh={loadAllData} />;
      case 'expenses':
        return <Expenses expenses={expenses} currency={config.currency} onRefresh={loadAllData} />;
      case 'reports':
        return (
          <Reports
            products={products}
            sales={sales}
            expenses={expenses}
            currency={config.currency}
          />
        );
      case 'ai':
        return (
          <BusinessIntel
            products={products}
            sales={sales}
            expenses={expenses}
            config={config}
            currency={config.currency}
          />
        );
      case 'config':
        return (
          <Configuration
            config={config}
            syncStatus={syncStatus}
            currency={config.currency}
            onRefresh={loadAllData}
            onUpdateConfig={handleUpdateConfig}
          />
        );
      default:
        return <div>Componente no encontrado.</div>;
    }
  };

  // Get active menu label
  const activeLabel = navigationItems.find(item => item.id === activeTab)?.label || 'AbarroControl';

  if (!isAuthenticated && config.securityEnabled) {
    return <BiometricLogin config={config} onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 transition-colors duration-200 ${config.theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'text-slate-800'}`}>
      
      {/* Upper Status bar (Top navbar) */}
      <header className="bg-white border-b border-slate-100 px-5 py-3.5 flex justify-between items-center sticky top-0 z-40 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 lg:hidden"
            title="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm shadow-emerald-200">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase block leading-none font-display">AbarroControl</span>
              <h1 className="text-sm font-black text-slate-800 leading-tight truncate max-w-[180px] sm:max-w-none mt-0.5">{config.businessName}</h1>
            </div>
          </div>
        </div>

        {/* Real-time sync & platform views widgets */}
        <div className="flex items-center gap-3.5 text-xs text-slate-500">
          
          {/* Mobile Simulator Toggle */}
          <button
            onClick={() => setPhoneFrame(!phoneFrame)}
            className={`hidden sm:flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition-all ${
              phoneFrame ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'text-slate-600'
            }`}
            title="Alternar vista de dispositivo"
          >
            {phoneFrame ? <Monitor className="w-3.5 h-3.5 text-emerald-600" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span>{phoneFrame ? 'Vista Pantalla Completa' : 'Simulador Celular'}</span>
          </button>

          {/* Sync indicator */}
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-full font-bold text-xxs tracking-wider border border-emerald-100/50">
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span>LOCAL + NUBE (OK)</span>
          </div>

          {/* Bloquear lockout manual button */}
          {config.securityEnabled && (
            <button
              onClick={() => setIsAuthenticated(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition-all text-slate-600 hover:text-rose-600 cursor-pointer"
              title="Cerrar sesión y bloquear sistema"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloquear</span>
            </button>
          )}
        </div>
      </header>

      {/* Main workspace container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Desktop Left sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-slate-100 p-5 space-y-6 shrink-0 print:hidden">
          <div className="space-y-1.5">
            <span className="text-xxs font-black text-slate-400 uppercase tracking-widest block px-3">Menú de Navegación</span>
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 text-center space-y-2">
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed">¿Necesitas ayuda operando tu tienda?</p>
            <button
              onClick={() => setActiveTab('ai')}
              className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 font-black rounded-lg text-[10px] uppercase tracking-wider transition-colors block text-center"
            >
              Consultar AI
            </button>
          </div>
        </aside>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0">
          
          {/* IF Phone simulator frame is enabled, wrap inside phone frame */}
          {phoneFrame ? (
            <div className="flex justify-center py-4">
              {/* Visual iPhone visual mockup frame */}
              <div className="relative w-[375px] h-[780px] bg-slate-900 rounded-[50px] shadow-2xl p-3 border-4 border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
                
                {/* Smartphone ear speaker notch details */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center gap-2">
                  {/* Camera lens indicator dot */}
                  <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                  <span className="w-12 h-1 bg-slate-800 rounded-full"></span>
                </div>

                {/* Simulated mobile status bar header */}
                <div className="bg-white px-5 pt-3 pb-1 flex justify-between items-center text-[10px] font-black text-slate-700 z-40 select-none border-b border-slate-50 shrink-0">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>08:46 AM</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest">{activeLabel}</span>
                  <span className="flex items-center gap-1">
                    <CircleDot className="w-3 h-3 text-emerald-500 animate-pulse" />
                    <span>5G LTE</span>
                  </span>
                </div>

                {/* Visual smartphone viewport view scroll content */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-3.5 space-y-4 rounded-b-[38px] pb-16">
                  {renderActiveComponent()}
                </div>

                {/* Bottom navigation menu floating rail for phone */}
                <div className="absolute bottom-3 inset-x-3 bg-white/95 backdrop-blur-md border-t border-slate-100 p-2 rounded-b-[38px] flex justify-around items-center text-slate-400 z-50 shadow-lg">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${activeTab === 'dashboard' ? 'text-emerald-600' : 'hover:text-slate-700'}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-[8px] font-bold">Inicio</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${activeTab === 'inventory' ? 'text-emerald-600' : 'hover:text-slate-700'}`}
                  >
                    <Package className="w-4 h-4" />
                    <span className="text-[8px] font-bold">Stock</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('sales')}
                    className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${activeTab === 'sales' ? 'text-emerald-600' : 'hover:text-slate-700'}`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="text-[8px] font-bold">Caja</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${activeTab === 'ai' ? 'text-emerald-600' : 'hover:text-slate-700'}`}
                  >
                    <BrainCircuit className="w-4 h-4 animate-bounce" />
                    <span className="text-[8px] font-bold">AI Guru</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('config')}
                    className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${activeTab === 'config' ? 'text-emerald-600' : 'hover:text-slate-700'}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-[8px] font-bold">Ajustes</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Traditional responsive desktop layout container */
            <div className="max-w-7xl mx-auto space-y-6">
              {renderActiveComponent()}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Drawer Slide Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex lg:hidden print:hidden">
          <div className="w-72 bg-white h-full p-5 flex flex-col justify-between animate-slide-right shadow-2xl">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm font-display tracking-tight text-emerald-800">Menú Comercial</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                        active
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-center space-y-1 text-[10px] text-slate-400 font-semibold border border-slate-100">
              <p>AbarroControl v1.0.0</p>
              <p>Offline-First Enabled</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
