import React from 'react';
import { Product, Sale, Expense } from '../types';
import { TrendingUp, TrendingDown, DollarSign, PackageX, ShoppingBag, ArrowUpRight, Zap } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  currency: string;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ products, sales, expenses, currency, onNavigate }: DashboardProps) {
  // Helper: Get today's start and end date boundaries in local time
  const getTodayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const { start: todayStart, end: todayEnd } = getTodayRange();

  // Filter today's active sales
  const todaySales = sales.filter((s) => {
    const date = new Date(s.timestamp);
    return s.status === 'active' && date >= todayStart && date <= todayEnd;
  });

  // Today's total sales and profit
  const totalSalesToday = todaySales.reduce((acc, curr) => acc + curr.total, 0);
  const totalProfitToday = todaySales.reduce((acc, curr) => acc + curr.profit, 0);

  // Filter today's expenses
  const todayExpensesList = expenses.filter((e) => {
    const date = new Date(e.timestamp);
    return date >= todayStart && date <= todayEnd;
  });
  const totalExpensesToday = todayExpensesList.reduce((acc, curr) => acc + curr.amount, 0);

  // Products with low inventory (below or equal to min stock)
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  // Top selling products calculated from sales history
  const productSalesMap: Record<string, { name: string; qty: number; total: number }> = {};
  sales.forEach((s) => {
    if (s.status === 'active') {
      s.items.forEach((item) => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { name: item.name, qty: 0, total: 0 };
        }
        productSalesMap[item.productId].qty += item.quantity;
        productSalesMap[item.productId].total += item.subtotal;
      });
    }
  });

  const topSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Upper Welcoming Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Resumen General</h1>
          <p className="text-sm text-gray-500 mt-1">Monitoreo de ingresos, rentabilidad y alertas operativas de hoy.</p>
        </div>
        <button
          onClick={() => onNavigate('sales')}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-200"
          id="btn-quick-sale"
        >
          <Zap className="w-5 h-5" />
          <span>Venta Rápida (F1)</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Sales Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4 hover:border-emerald-100 transition-all">
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ventas de Hoy</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
              {currency}{totalSalesToday.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{todaySales.length} transacciones</span>
            </span>
          </div>
        </div>

        {/* Profits Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4 hover:border-emerald-100 transition-all">
          <div className="p-3.5 bg-teal-50 rounded-xl text-teal-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ganancias Estimadas</span>
            <h3 className="text-2xl font-bold text-teal-700 mt-0.5">
              {currency}{totalProfitToday.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-teal-600 font-medium flex items-center gap-1 mt-1">
              <span>Rendimiento neto sano</span>
            </span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4 hover:border-rose-100 transition-all">
          <div className="p-3.5 bg-rose-50 rounded-xl text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gastos de Hoy</span>
            <h3 className="text-2xl font-bold text-rose-600 mt-0.5">
              {currency}{totalExpensesToday.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
              <span>{todayExpensesList.length} registros hoy</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions Panel */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Accesos Rápidos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigate('sales')}
              className="flex flex-col items-center justify-center p-4 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl border border-emerald-100/50 hover:border-emerald-200 transition-all text-center group"
            >
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl mb-3 shadow-xs group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-emerald-800">Caja Registradora</span>
              <span className="text-xxs text-emerald-600/70 mt-1">Nueva venta rápida</span>
            </button>

            <button
              onClick={() => onNavigate('inventory')}
              className="flex flex-col items-center justify-center p-4 bg-blue-50/50 hover:bg-blue-50 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-all text-center group"
            >
              <div className="p-2.5 bg-blue-600 text-white rounded-xl mb-3 shadow-xs group-hover:scale-110 transition-transform">
                <PackageX className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-blue-800">Inventario</span>
              <span className="text-xxs text-blue-600/70 mt-1">Control de almacén</span>
            </button>

            <button
              onClick={() => onNavigate('purchases')}
              className="flex flex-col items-center justify-center p-4 bg-purple-50/50 hover:bg-purple-50 rounded-xl border border-purple-100/50 hover:border-purple-200 transition-all text-center group"
            >
              <div className="p-2.5 bg-purple-600 text-white rounded-xl mb-3 shadow-xs group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-purple-800">Compras</span>
              <span className="text-xxs text-purple-600/70 mt-1">Surtir a proveedores</span>
            </button>

            <button
              onClick={() => onNavigate('expenses')}
              className="flex flex-col items-center justify-center p-4 bg-amber-50/50 hover:bg-amber-50 rounded-xl border border-amber-100/50 hover:border-amber-200 transition-all text-center group"
            >
              <div className="p-2.5 bg-amber-600 text-white rounded-xl mb-3 shadow-xs group-hover:scale-110 transition-transform">
                <TrendingDown className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-amber-800">Gastos</span>
              <span className="text-xxs text-amber-600/70 mt-1">Registrar salidas</span>
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="flex flex-col items-center justify-center p-4 bg-teal-50/50 hover:bg-teal-50 rounded-xl border border-teal-100/50 hover:border-teal-200 transition-all text-center group"
            >
              <div className="p-2.5 bg-teal-600 text-white rounded-xl mb-3 shadow-xs group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-teal-800">Reportes</span>
              <span className="text-xxs text-teal-600/70 mt-1">Gráficas e historial</span>
            </button>

            <button
              onClick={() => onNavigate('ai')}
              className="flex flex-col items-center justify-center p-4 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl border border-indigo-100/50 hover:border-indigo-200 transition-all text-center group"
            >
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl mb-3 shadow-xs group-hover:scale-110 transition-transform animate-pulse">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-indigo-800">Inteligencia IA</span>
              <span className="text-xxs text-indigo-600/70 mt-1">Consultoría inteligente</span>
            </button>
          </div>
        </div>

        {/* Low Inventory Warnings Panel */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Alertas de Stock</h2>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-full">
              {lowStockProducts.length} críticos
            </span>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                🎉 No hay productos con stock bajo. ¡Buen trabajo!
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-amber-200 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Sugerido: {p.minStock} pzas</p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                      p.stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.stock === 0 ? 'Agotado' : `${p.stock} pzas`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          {lowStockProducts.length > 0 && (
            <button 
              onClick={() => onNavigate('purchases')}
              className="w-full text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline pt-1 block"
            >
              Registrar compra para surtir inventario
            </button>
          )}
        </div>
      </div>

      {/* Top Sellers Row */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">Productos Más Vendidos (Histórico)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topSellingProducts.length === 0 ? (
            <div className="col-span-3 text-center py-6 text-gray-400 text-sm">
              No hay ventas registradas aún para calcular los más vendidos.
            </div>
          ) : (
            topSellingProducts.map((p, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-emerald-50/20 rounded-xl border border-emerald-50/50 hover:border-emerald-200 transition-colors">
                <span className="text-2xl font-black text-emerald-300">#{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-gray-800 truncate">{p.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{p.qty} piezas vendidas</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-emerald-700">
                    {currency}{p.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
