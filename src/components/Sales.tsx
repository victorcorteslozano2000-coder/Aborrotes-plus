import React, { useState, useEffect } from 'react';
import { Product, Sale, SaleItem } from '../types';
import { db } from '../lib/db';
import { ShoppingCart, Search, Trash2, CheckCircle2, DollarSign, CreditCard, Send, X, ArrowRight, CornerDownLeft, AlertCircle, RefreshCw } from 'lucide-react';

interface SalesProps {
  products: Product[];
  sales: Sale[];
  currency: string;
  taxRate: number;
  onRefresh: () => void;
}

export default function Sales({ products, sales, currency, taxRate, onRefresh }: SalesProps) {
  const [activeTab, setActiveTab] = useState<'checkout' | 'history'>('checkout');

  // Checkout State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');
  
  // Cash calculator state
  const [cashReceived, setCashReceived] = useState<string>('');
  const [changeAmount, setChangeAmount] = useState<number>(0);

  // Success modal
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastSavedSale, setLastSavedSale] = useState<Sale | null>(null);

  // Search filter
  useEffect(() => {
    if (!productSearch) {
      setSearchResults([]);
      return;
    }
    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.barcode.includes(productSearch) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase())
    );
    setSearchResults(results.slice(0, 8)); // Limit search autocomplete to 8 items
  }, [productSearch, products]);

  // Handle barcode/product selection
  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      alert(`⚠️ El producto "${product.name}" se encuentra agotado.`);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    if (existingIndex >= 0) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + 1;
      
      if (newQty > product.stock) {
        alert(`⚠️ No puedes vender más de la existencia disponible (${product.stock} pzas).`);
        return;
      }
      
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].subtotal = parseFloat((newQty * product.price).toFixed(2));
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          cost: product.cost,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
        },
      ]);
    }
    setProductSearch('');
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (qty > product.stock) {
      alert(`⚠️ No puedes vender más de la existencia disponible (${product.stock} pzas).`);
      return;
    }

    const updated = cart.map((item) => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: qty,
          subtotal: parseFloat((qty * item.price).toFixed(2)),
        };
      }
      return item;
    });
    setCart(updated);
  };

  // Calculations
  const cartSubtotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
  const taxAmount = parseFloat(((cartSubtotal * taxRate) / (100 + taxRate)).toFixed(2));
  const cartTotal = cartSubtotal; // total is inclusive of tax rate already

  // Update change on cash received change
  useEffect(() => {
    const received = parseFloat(cashReceived);
    if (!isNaN(received) && received >= cartTotal) {
      setChangeAmount(parseFloat((received - cartTotal).toFixed(2)));
    } else {
      setChangeAmount(0);
    }
  }, [cashReceived, cartTotal]);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Tu carrito de ventas está vacío.');
      return;
    }

    if (paymentMethod === 'efectivo') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < cartTotal) {
        alert('Por favor ingresa un monto recibido en efectivo válido e igual o mayor al total.');
        return;
      }
    }

    // Calculate profit
    const totalCost = cart.reduce((acc, curr) => acc + curr.cost * curr.quantity, 0);
    const profit = parseFloat((cartTotal - totalCost).toFixed(2));

    const sale: Sale = {
      id: `sale-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      items: cart,
      total: parseFloat(cartTotal.toFixed(2)),
      profit,
      paymentMethod,
      taxAmount,
      status: 'active',
    };

    db.saveSale(sale);
    setLastSavedSale(sale);
    setIsSuccessOpen(true);

    // Clear checkout form
    setCart([]);
    setCashReceived('');
    setChangeAmount(0);
    onRefresh();
  };

  const handleCancelSale = (saleId: string) => {
    if (confirm('¿Estás completamente seguro de CANCELAR esta venta? Se devolverá la mercancía al inventario automáticamente.')) {
      db.cancelSale(saleId);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex bg-white p-2 rounded-2xl border border-gray-100 shadow-xs max-w-sm">
        <button
          onClick={() => setActiveTab('checkout')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'checkout' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Registrar Venta</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'history' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Historial Ventas</span>
        </button>
      </div>

      {activeTab === 'checkout' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Catalog search & suggestions */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-600" />
              <span>Búsqueda de Artículos</span>
            </h2>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Escanea código de barras o escribe nombre del producto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 hover:bg-gray-100/50 focus:bg-white rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Results Autocomplete */}
            {searchResults.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-[300px] overflow-y-auto shadow-md">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between p-3.5 text-left hover:bg-emerald-50/40 transition-colors group"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-xxs text-gray-400 mt-0.5">
                        Categoría: {p.category} | Stock: <span className={p.stock <= p.minStock ? 'text-amber-600 font-bold' : 'text-gray-500'}>{p.stock} pzas</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-gray-900">
                        {currency}{p.price.toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-gray-400 font-mono mt-0.5">{p.barcode}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Presets for checkout simulation */}
            <div className="space-y-2">
              <span className="text-xxs font-bold text-gray-400 uppercase tracking-widest block">Acceso Rápido Productos Populares</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {products.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="flex flex-col items-center justify-between p-3 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/20 rounded-xl transition-all text-center h-28 relative group"
                  >
                    {p.stock === 0 && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                        <span className="text-xxs font-black text-rose-600 tracking-wider">AGOTADO</span>
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md self-center">
                      {currency}{p.price.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-bold text-gray-700 line-clamp-2 h-8 leading-tight mb-1 group-hover:text-emerald-800 transition-colors">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Stock: {p.stock}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Cart list & checkout form */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="font-bold text-gray-900 text-base">Carrito de Compras</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full">
                  {cart.reduce((acc, curr) => acc + curr.quantity, 0)} pzas
                </span>
              </div>

              {/* Cart contents */}
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm">El carrito está vacío.</p>
                    <p className="text-xxs mt-1 text-gray-400">Busca o haz clic en un producto para agregarlo.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-gray-800 truncate">{item.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-bold flex items-center justify-center text-gray-600"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-bold text-gray-800 w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-bold flex items-center justify-center text-gray-600"
                          >
                            +
                          </button>
                          <span className="text-[10px] text-gray-400 font-medium ml-2">x {currency}{item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-right ml-3 shrink-0 flex flex-col items-end gap-1">
                        <span className="text-sm font-black text-gray-900">
                          {currency}{item.subtotal.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-md transition-all"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Calculations & Checkout form */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckout} className="border-t border-gray-100 pt-4 space-y-4">
                {/* Total breakdowns */}
                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-gray-800 font-medium">{currency}{(cartTotal - taxAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA Configurado ({taxRate}%):</span>
                    <span className="text-gray-800 font-medium">{currency}{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-black text-gray-900">
                    <span>TOTAL COMPRA:</span>
                    <span className="text-emerald-700 text-lg">{currency}{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <span className="block text-xxs font-black text-gray-400 uppercase tracking-widest">Método de Pago</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`py-2 rounded-lg text-xxs font-bold border transition-all flex flex-col items-center gap-1 ${
                        paymentMethod === 'efectivo'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-white border-gray-200 text-gray-500'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Efectivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transferencia')}
                      className={`py-2 rounded-lg text-xxs font-bold border transition-all flex flex-col items-center gap-1 ${
                        paymentMethod === 'transferencia'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-white border-gray-200 text-gray-500'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>Transfer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('tarjeta')}
                      className={`py-2 rounded-lg text-xxs font-bold border transition-all flex flex-col items-center gap-1 ${
                        paymentMethod === 'tarjeta'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-white border-gray-200 text-gray-500'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Tarjeta</span>
                    </button>
                  </div>
                </div>

                {/* Cash received calculator for change */}
                {paymentMethod === 'efectivo' && (
                  <div className="grid grid-cols-2 gap-3.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Pago Recibido</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">{currency}</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg outline-none font-mono text-sm font-bold text-gray-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Cambio a Entregar</label>
                      <div className="h-[34px] flex items-center font-mono text-base font-black text-emerald-700">
                        {currency}{changeAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action submit button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 rounded-xl font-bold transition-all shadow-sm shadow-emerald-100 flex items-center justify-center gap-1.5"
                >
                  <span>Registrar Venta de Caja</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* Sales Log History Tab */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 className="text-base font-bold text-gray-800">Historial de Ventas</h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Revisa las transacciones pasadas y cancela de ser necesario.</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-100">
              {sales.length} transacciones totales
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-500 uppercase tracking-widest text-xxs font-black border-b border-gray-200">
                  <th className="py-3 px-5">Código Venta</th>
                  <th className="py-3 px-5">Fecha / Hora</th>
                  <th className="py-3 px-5">Artículos Vendidos</th>
                  <th className="py-3 px-5">Pago</th>
                  <th className="py-3 px-5 text-right">Monto IVA</th>
                  <th className="py-3 px-5 text-right">Total</th>
                  <th className="py-3 px-5 text-right">Ganancia</th>
                  <th className="py-3 px-5 text-center">Estatus</th>
                  <th className="py-3 px-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                      No hay registros de ventas anteriores.
                    </td>
                  </tr>
                ) : (
                  [...sales].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((sale) => (
                    <tr key={sale.id} className={`hover:bg-gray-50/50 transition-colors ${sale.status === 'cancelled' ? 'bg-rose-50/20 text-gray-400 line-through' : 'text-gray-700'}`}>
                      <td className="py-3 px-5 font-mono font-bold text-gray-600">{sale.id}</td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        {new Date(sale.timestamp).toLocaleString('es-MX')}
                      </td>
                      <td className="py-3 px-5">
                        <div className="space-y-1">
                          {sale.items.map((it, idx) => (
                            <div key={idx} className="truncate max-w-[180px]">
                              {it.quantity}x {it.name}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-5 capitalize font-medium">{sale.paymentMethod}</td>
                      <td className="py-3 px-5 text-right text-gray-400 font-mono">{currency}{sale.taxAmount.toFixed(2)}</td>
                      <td className="py-3 px-5 text-right font-black text-gray-900">{currency}{sale.total.toFixed(2)}</td>
                      <td className="py-3 px-5 text-right text-teal-700 font-bold">{currency}{sale.profit.toFixed(2)}</td>
                      <td className="py-3 px-5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${
                          sale.status === 'active'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-rose-50 border-rose-100 text-rose-700'
                        }`}>
                          {sale.status === 'active' ? 'Completada' : 'Cancelada'}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        {sale.status === 'active' ? (
                          <button
                            onClick={() => handleCancelSale(sale.id)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md border border-rose-100 font-bold transition-all text-[10px] uppercase"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checkout Success Popup Receipt Modal */}
      {isSuccessOpen && lastSavedSale && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-black text-gray-900">¡Venta Registrada Exitosamente!</h3>
              <p className="text-xs text-gray-400">Folio: {lastSavedSale.id}</p>
            </div>

            {/* Simulated Receipt paper layout */}
            <div className="bg-gray-50 border-t-2 border-b-2 border-dashed border-gray-300 p-4 font-mono text-xs space-y-2.5">
              <div className="text-center font-bold text-gray-700 uppercase tracking-widest pb-2 border-b border-gray-200">
                Ticket de Venta
              </div>
              <div className="space-y-1 text-gray-600">
                {lastSavedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[180px]">{it.quantity}x {it.name}</span>
                    <span>{currency}{it.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-2 space-y-1 font-bold text-gray-700">
                <div className="flex justify-between text-xxs text-gray-400">
                  <span>Impuestos IVA:</span>
                  <span>{currency}{lastSavedSale.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-900">
                  <span>TOTAL PAGADO:</span>
                  <span>{currency}{lastSavedSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xxs text-gray-500 font-sans">
                  <span>Método de pago:</span>
                  <span className="capitalize font-mono font-bold">{lastSavedSale.paymentMethod}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsSuccessOpen(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl border border-emerald-700 transition-colors flex items-center justify-center gap-1"
            >
              <CornerDownLeft className="w-4 h-4" />
              <span>Aceptar y Siguiente Venta</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
