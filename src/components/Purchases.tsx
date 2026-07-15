import React, { useState } from 'react';
import { Product, Supplier, Purchase, PurchaseItem } from '../types';
import { db } from '../lib/db';
import { FileText, Plus, Search, Trash2, ArrowUpRight, TrendingUp, AlertOctagon, CheckCircle } from 'lucide-react';

interface PurchasesProps {
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  currency: string;
  onRefresh: () => void;
}

export default function Purchases({ products, suppliers, purchases, currency, onRefresh }: PurchasesProps) {
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');

  // New Purchase Form state
  const [supplierId, setSupplierId] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  
  // Single item entry row state
  const [productId, setProductId] = useState('');
  const [itemCost, setItemCost] = useState<number>(0);
  const [itemQty, setItemQty] = useState<number>(1);

  // Price increase alerts to warn before submitting
  const [priceAlerts, setPriceAlerts] = useState<{ name: string; oldCost: number; newCost: number }[]>([]);

  // Find product details
  const selectedProductDetails = products.find(p => p.id === productId);

  const handleProductSelectChange = (id: string) => {
    setProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setItemCost(prod.cost);
      setItemQty(1);
    }
  };

  const handleAddItemToPurchase = () => {
    if (!productId) {
      alert('Por favor selecciona un producto.');
      return;
    }
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    // Check if cost has increased
    const existingAlerts = [...priceAlerts];
    if (itemCost > prod.cost) {
      // cost increased alert
      if (!priceAlerts.some(a => a.name === prod.name)) {
        existingAlerts.push({
          name: prod.name,
          oldCost: prod.cost,
          newCost: itemCost
        });
        setPriceAlerts(existingAlerts);
      }
    }

    const existingIndex = purchaseItems.findIndex(it => it.productId === productId);
    if (existingIndex >= 0) {
      const updated = [...purchaseItems];
      updated[existingIndex].quantity += Number(itemQty);
      updated[existingIndex].subtotal = parseFloat((updated[existingIndex].quantity * itemCost).toFixed(2));
      setPurchaseItems(updated);
    } else {
      setPurchaseItems([
        ...purchaseItems,
        {
          productId,
          name: prod.name,
          cost: Number(itemCost),
          quantity: Number(itemQty),
          subtotal: parseFloat((Number(itemQty) * Number(itemCost)).toFixed(2))
        }
      ]);
    }

    // Reset item input line
    setProductId('');
    setItemCost(0);
    setItemQty(1);
  };

  const handleRemoveItem = (index: number) => {
    const item = purchaseItems[index];
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    // Clear alerts for this product if removed
    setPriceAlerts(priceAlerts.filter(a => a.name !== item.name));
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      alert('Por favor selecciona el proveedor que te surte.');
      return;
    }
    if (purchaseItems.length === 0) {
      alert('Por favor agrega al menos un producto a la orden de compra.');
      return;
    }

    const supplierObj = suppliers.find(s => s.id === supplierId);
    const total = purchaseItems.reduce((acc, curr) => acc + curr.subtotal, 0);

    const purchase: Purchase = {
      id: `purchase-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      supplierId,
      supplierName: supplierObj?.name || 'Proveedor General',
      items: purchaseItems,
      total: parseFloat(total.toFixed(2))
    };

    db.savePurchase(purchase);

    // Alert feedback on price increases
    if (priceAlerts.length > 0) {
      const alertMsg = priceAlerts
        .map(a => `- ${a.name}: Aumentó de ${currency}${a.oldCost.toFixed(2)} a ${currency}${a.newCost.toFixed(2)} (+${Math.round(((a.newCost - a.oldCost) / a.oldCost) * 100)}%)`)
        .join('\n');
      alert(`⚠️ ¡ATENCIÓN! Se registraron aumentos de costo en los siguientes productos:\n\n${alertMsg}\n\nLos costos de compra se actualizaron en el inventario. Considera ajustar el precio de venta para mantener tu margen de ganancia.`);
    } else {
      alert('¡Compra registrada correctamente! El inventario ha sido actualizado.');
    }

    // Reset form
    setSupplierId('');
    setPurchaseItems([]);
    setPriceAlerts([]);
    onRefresh();
    setActiveTab('history');
  };

  return (
    <div className="space-y-6">
      {/* Upper sub navigation */}
      <div className="flex bg-white p-2 rounded-2xl border border-gray-100 shadow-xs max-w-sm">
        <button
          onClick={() => setActiveTab('record')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'record' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Compra</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'history' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Historial Compras</span>
        </button>
      </div>

      {activeTab === 'record' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main order input panel */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Cargar Surtido de Mercancía</h2>
            
            {/* Add single product form row */}
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xxs font-black text-gray-400 uppercase tracking-widest">Seleccionar Producto</label>
                <select
                  value={productId}
                  onChange={(e) => handleProductSelectChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="">-- Elige un artículo --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xxs font-black text-gray-400 uppercase tracking-widest">Costo Compra Unitario ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemCost || ''}
                  onChange={(e) => setItemCost(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-emerald-500 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5 flex gap-2">
                <div className="flex-1">
                  <label className="block text-xxs font-black text-gray-400 uppercase tracking-widest">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={itemQty || ''}
                    onChange={(e) => setItemQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-emerald-500 text-xs font-mono font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddItemToPurchase}
                  className="px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg border border-emerald-700 font-bold text-xs"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* List of currently staged products */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Productos en esta Compra</h3>
              
              {purchaseItems.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                  Stagging vacío. Añade productos arriba para registrar la factura de compra.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {purchaseItems.map((item, index) => {
                    const originalProd = products.find(p => p.id === item.productId);
                    const originalCost = originalProd ? originalProd.cost : item.cost;
                    const hasIncreased = item.cost > originalCost;

                    return (
                      <div key={index} className={`flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-all ${hasIncreased ? 'bg-amber-50/10' : ''}`}>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-gray-800 truncate">{item.name}</h4>
                          <p className="text-xxs text-gray-400 mt-1 flex items-center gap-1.5">
                            <span>Surtidas: <strong className="font-bold text-gray-700">{item.quantity} pzas</strong></span>
                            <span>•</span>
                            <span>Costo: <strong className="font-bold text-gray-700">{currency}{item.cost.toFixed(2)}</strong></span>
                            {hasIncreased && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[9px] uppercase animate-pulse">
                                <AlertOctagon className="w-2.5 h-2.5 text-amber-600" />
                                <span>Aumentó ({currency}{originalCost.toFixed(2)})</span>
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 ml-3">
                          <span className="text-sm font-black text-gray-900">
                            {currency}{item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Supplier & totals panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
            <form onSubmit={handleSavePurchase} className="space-y-4">
              <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-2">Resumen de Compra</h3>

              {/* Select Supplier */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Proveedor Surtidor *</label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="">-- Selecciona el Proveedor --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price warnings banner if cost goes up */}
              {priceAlerts.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 space-y-2 text-xxs text-amber-800">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <AlertOctagon className="w-4 h-4 text-amber-600 animate-bounce" />
                    <span>Costos más altos detectados</span>
                  </div>
                  <ul className="list-disc pl-3.5 space-y-0.5">
                    {priceAlerts.map((a, i) => (
                      <li key={i}>
                        {a.name}: +{Math.round(((a.newCost - a.oldCost) / a.oldCost) * 100)}% de costo.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Order total */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center space-y-1">
                <span className="text-xxs font-black text-gray-400 uppercase tracking-widest block">Total de Inversión</span>
                <span className="text-2xl font-black text-emerald-800">
                  {currency}{purchaseItems.reduce((acc, curr) => acc + curr.subtotal, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xxs text-gray-400 block font-semibold">{purchaseItems.length} artículos cargados</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 rounded-xl font-bold transition-all shadow-sm shadow-emerald-100 flex items-center justify-center gap-1.5 text-xs uppercase"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Guardar Factura Compra</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Purchase invoice log history */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 className="text-base font-bold text-gray-800">Facturas de Compra a Proveedores</h2>
              <p className="text-xs text-gray-500 mt-0.5">Control histórico de inversiones en existencias de catálogo.</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-100">
              {purchases.length} compras cargadas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-500 uppercase tracking-widest text-xxs font-black border-b border-gray-200">
                  <th className="py-3 px-5">Folio Factura</th>
                  <th className="py-3 px-5">Fecha</th>
                  <th className="py-3 px-5">Proveedor Surtidor</th>
                  <th className="py-3 px-5">Artículos Surtidos</th>
                  <th className="py-3 px-5 text-right">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                      No hay compras registradas aún.
                    </td>
                  </tr>
                ) : (
                  [...purchases].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((pur) => (
                    <tr key={pur.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-gray-500">{pur.id}</td>
                      <td className="py-3.5 px-5 whitespace-nowrap">{new Date(pur.timestamp).toLocaleDateString('es-MX')}</td>
                      <td className="py-3.5 px-5 font-bold">{pur.supplierName}</td>
                      <td className="py-3.5 px-5">
                        <div className="space-y-1 font-medium">
                          {pur.items.map((it, idx) => (
                            <div key={idx} className="truncate max-w-[200px]">
                              {it.quantity}x {it.name} ({currency}{it.cost.toFixed(2)})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right font-black text-emerald-800 font-mono">
                        {currency}{pur.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
