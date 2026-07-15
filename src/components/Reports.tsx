import React from 'react';
import { Product, Sale, Expense } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { FileDown, Calendar, Wallet, ShoppingBag, ArrowUpRight, ShieldAlert, BarChart3, Printer } from 'lucide-react';

interface ReportsProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  currency: string;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#64748b', '#06b6d4'];

export default function Reports({ products, sales, expenses, currency }: ReportsProps) {
  // 1. Valued Inventory Calculations
  const inventoryCostValue = products.reduce((acc, curr) => acc + curr.cost * curr.stock, 0);
  const inventoryPriceValue = products.reduce((acc, curr) => acc + curr.price * curr.stock, 0);
  const inventoryProfitPotential = inventoryPriceValue - inventoryCostValue;

  // 2. Slow Rotators (Baja Rotación)
  // Products that have stocks > 10 but have sold less than 2 units in the entire history
  const productSalesQtyMap: Record<string, number> = {};
  sales.forEach((s) => {
    if (s.status === 'active') {
      s.items.forEach((item) => {
        productSalesQtyMap[item.productId] = (productSalesQtyMap[item.productId] || 0) + item.quantity;
      });
    }
  });

  const slowRotators = products
    .filter((p) => p.stock > 5 && (productSalesQtyMap[p.id] || 0) < 3)
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 4);

  // 3. Chart Data: Daily Sales, Profits, and Expenses for the last 7 days
  const getChartDataLast7Days = () => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 3600 * 1000);
      const dayLabel = date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
      const dateStr = date.toISOString().split('T')[0];

      // Day's sales
      const daySalesList = sales.filter((s) => s.status === 'active' && s.timestamp.startsWith(dateStr));
      const daySalesSum = daySalesList.reduce((acc, curr) => acc + curr.total, 0);
      const dayProfitSum = daySalesList.reduce((acc, curr) => acc + curr.profit, 0);

      // Day's expenses
      const dayExpensesSum = expenses
        .filter((e) => e.timestamp.startsWith(dateStr))
        .reduce((acc, curr) => acc + curr.amount, 0);

      data.push({
        name: dayLabel,
        Ventas: parseFloat(daySalesSum.toFixed(2)),
        Ganancias: parseFloat(dayProfitSum.toFixed(2)),
        Gastos: parseFloat(dayExpensesSum.toFixed(2)),
      });
    }
    return data;
  };

  const chartData = getChartDataLast7Days();

  // 4. Sales by category pie chart data
  const getCategoryShareData = () => {
    const shareMap: Record<string, number> = {};
    sales.forEach((s) => {
      if (s.status === 'active') {
        s.items.forEach((item) => {
          // Find category of item
          const prod = products.find((p) => p.id === item.productId);
          const cat = prod ? prod.category : 'Otros';
          shareMap[cat] = (shareMap[cat] || 0) + item.subtotal;
        });
      }
    });

    return Object.entries(shareMap).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  };

  const categoryShareData = getCategoryShareData();

  // 5. Exporter to Excel (CSV syntax)
  const exportToExcel = (type: 'inventory' | 'sales') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (type === 'inventory') {
      filename = 'AbarroControl_Inventario_Valorizado.csv';
      headers = ['ID', 'Codigo de Barras', 'Nombre', 'Categoria', 'Costo', 'Precio Venta', 'Stock', 'Minimo Alerta', 'Valor Costo Total', 'Valor Venta Total'];
      rows = products.map(p => [
        p.id,
        p.barcode,
        p.name,
        p.category,
        p.cost.toString(),
        p.price.toString(),
        p.stock.toString(),
        p.minStock.toString(),
        (p.cost * p.stock).toFixed(2),
        (p.price * p.stock).toFixed(2)
      ]);
    } else {
      filename = 'AbarroControl_Historial_Ventas.csv';
      headers = ['ID Venta', 'Fecha', 'Total Venta', 'Ganancia Estimada', 'Impuesto IVA', 'Metodo Pago', 'Estatus'];
      rows = sales.map(s => [
        s.id,
        new Date(s.timestamp).toLocaleString('es-MX'),
        s.total.toFixed(2),
        s.profit.toFixed(2),
        s.taxAmount.toFixed(2),
        s.paymentMethod,
        s.status
      ]);
    }

    // Excel CSV parser
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header section with exporting controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Reportes y Auditoría Financiera</h1>
          <p className="text-xs text-gray-500 mt-1">Exportación de estados de cuenta e indicadores clave de rendimiento.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportToExcel('inventory')}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all border border-gray-200"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>Excel Inventario</span>
          </button>
          <button
            onClick={() => exportToExcel('sales')}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all border border-gray-200"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            <span>Excel Ventas</span>
          </button>
          <button
            onClick={triggerPrintPDF}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir PDF (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Valued Inventory Box */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          <span>Auditoría de Capital de Inventario Valorizado</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
            <span className="text-xxs font-black text-gray-400 uppercase tracking-widest block">Capital Invertido (Costo)</span>
            <span className="text-xl font-black text-gray-800">
              {currency}{inventoryCostValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-gray-400 mt-0.5">Dinero total estancado en mercancía</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
            <span className="text-xxs font-black text-gray-400 uppercase tracking-widest block">Valor de Recuperación (Venta)</span>
            <span className="text-xl font-black text-gray-800">
              {currency}{inventoryPriceValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-gray-400 mt-0.5">Dinero que ingresará al liquidar stock</p>
          </div>

          <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100/50 space-y-1">
            <span className="text-xxs font-black text-emerald-700 uppercase tracking-widest block">Margen Potencial de Ganancia</span>
            <span className="text-xl font-black text-emerald-800">
              {currency}{inventoryProfitPotential.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-emerald-600 mt-0.5">Margen bruto proyectado del almacén</p>
          </div>
        </div>
      </div>

      {/* Recharts Performance Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Revenue, Costs & Outflows */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Flujo de Caja - Últimos 7 Días</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [`${currency}${value}`, '']} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Ventas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ganancias" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sales Pie Share */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Ventas por Categoría</h2>
          <div className="h-80 w-full flex flex-col justify-center items-center">
            {categoryShareData.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No hay ventas suficientes para segmentar por categorías.
              </div>
            ) : (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryShareData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryShareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${currency}${value}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center max-h-24 overflow-y-auto w-full px-2">
                  {categoryShareData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-[10px] text-gray-500 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="truncate max-w-[80px]">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Under-performing items row */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 text-orange-700">
          <ShieldAlert className="w-5 h-5 text-orange-500" />
          <span>Productos con Menor Rotación (Capital Atorado)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {slowRotators.length === 0 ? (
            <div className="col-span-4 text-center py-6 bg-gray-50 rounded-xl text-gray-400 text-xs">
              🎉 Todo tu catálogo tiene una excelente rotación activa.
            </div>
          ) : (
            slowRotators.map((p, i) => (
              <div key={i} className="p-4 bg-orange-50/10 border border-orange-100/50 hover:border-orange-200 transition-colors rounded-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-800 truncate">{p.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Frecuencia de venta casi nula.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xxs font-semibold">
                  <span className="text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">
                    STOCK: {p.stock} pzas
                  </span>
                  <span className="text-gray-500">
                    Costo: {currency}{(p.stock * p.cost).toFixed(2)}
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
