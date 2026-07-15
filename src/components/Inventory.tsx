import React, { useState, useRef, useEffect } from 'react';
import { Product, Supplier, StockMovement } from '../types';
import { Search, Plus, Edit, Trash2, Camera, History, AlertTriangle, Package, Check, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { db } from '../lib/db';

interface InventoryProps {
  products: Product[];
  suppliers: Supplier[];
  movements: StockMovement[];
  currency: string;
  onRefresh: () => void;
}

const CATEGORIES = [
  'Todos',
  'Lácteos',
  'Bebidas',
  'Panadería',
  'Botanas',
  'Enlatados y Conservas',
  'Limpieza',
  'Cuidado Personal',
  'Granos y Semillas',
  'Otros'
];

const PRESET_PHOTOS = [
  { name: 'Leche', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400' },
  { name: 'Refresco', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400' },
  { name: 'Pan de Caja', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400' },
  { name: 'Papas / Botana', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=400' },
  { name: 'Frijoles / Enlatados', url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&q=80&w=400' },
  { name: 'Jabón / Limpieza', url: 'https://images.unsplash.com/photo-1607006342445-565a116f1406?auto=format&fit=crop&q=80&w=400' },
  { name: 'Shampoo / Cuidado', url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=400' },
  { name: 'Arroz / Semillas', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400' }
];

export default function Inventory({ products, suppliers, movements, currency, onRefresh }: InventoryProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'movements'>('list');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [alertFilter, setAlertFilter] = useState(false);

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Lácteos');
  const [supplierId, setSupplierId] = useState('');
  const [cost, setCost] = useState(0);
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [imageUrl, setImageUrl] = useState('');

  // Camera Barcode Scanning State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerSuccess, setScannerSuccess] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync state helper to auto-fill supplier
  useEffect(() => {
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
  }, [suppliers]);

  // Search and Filter Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesAlert = !alertFilter || p.stock <= p.minStock;
    return matchesSearch && matchesCategory && matchesAlert;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setBarcode(Math.floor(1000000000000 + Math.random() * 900000000000).toString()); // random GTIN-13 barcode
    setName('');
    setCategory('Lácteos');
    setSupplierId(suppliers[0]?.id || '');
    setCost(0);
    setPrice(0);
    setStock(0);
    setMinStock(5);
    setImageUrl(PRESET_PHOTOS[0].url);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setBarcode(product.barcode);
    setName(product.name);
    setCategory(product.category);
    setSupplierId(product.supplierId);
    setCost(product.cost);
    setPrice(product.price);
    setStock(product.stock);
    setMinStock(product.minStock);
    setImageUrl(product.imageUrl || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, productName: string) => {
    if (confirm(`¿Estás seguro de eliminar el producto "${productName}"?`)) {
      db.deleteProduct(id);
      db.addMovement({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        productId: id,
        productName,
        type: 'ajuste_negativo',
        quantity: 0,
        previousStock: 0,
        newStock: 0,
      });
      onRefresh();
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !barcode) {
      alert('Por favor completa los campos requeridos (Nombre y Código de barras).');
      return;
    }

    const previousProduct = products.find(p => p.id === (editingProduct?.id || ''));
    const previousStockValue = previousProduct ? previousProduct.stock : 0;

    const newProduct: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      barcode,
      name,
      category,
      supplierId,
      cost: Number(cost),
      price: Number(price),
      stock: Number(stock),
      minStock: Number(minStock),
      imageUrl: imageUrl || undefined,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
    };

    db.saveProduct(newProduct);

    // Record adjustment movement if stock changed manually during edit
    if (editingProduct && previousStockValue !== Number(stock)) {
      const difference = Number(stock) - previousStockValue;
      db.addMovement({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        productId: newProduct.id,
        productName: newProduct.name,
        type: difference > 0 ? 'ajuste_positivo' : 'ajuste_negativo',
        quantity: difference,
        previousStock: previousStockValue,
        newStock: Number(stock),
      });
    } else if (!editingProduct) {
      // New product stock movement entry
      db.addMovement({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        productId: newProduct.id,
        productName: newProduct.name,
        type: 'ajuste_positivo',
        quantity: Number(stock),
        previousStock: 0,
        newStock: Number(stock),
      });
    }

    setIsModalOpen(false);
    onRefresh();
  };

  // Barcode Scanner Camera Controls
  const startCamera = async () => {
    setScannerSuccess(null);
    setIsScannerOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable. Running in high-fidelity simulator mode.', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScannerOpen(false);
  };

  // Simulate picking a random preloaded or existing barcode for easier testing
  const simulateBarcodeDetection = (simulatedCode?: string) => {
    const codeToDetect = simulatedCode || (products.length > 0 
      ? products[Math.floor(Math.random() * products.length)].barcode 
      : '7501000111223');
    
    setScannerSuccess(codeToDetect);
    setBarcode(codeToDetect);
    
    // Auto find if there is an existing product with this barcode
    const match = products.find(p => p.barcode === codeToDetect);
    if (match) {
      // If we are in add mode, let them know they can edit it
      setTimeout(() => {
        if (confirm(`El código "${codeToDetect}" pertenece a "${match.name}". ¿Deseas editar este producto?`)) {
          handleOpenEditModal(match);
          stopCamera();
        }
      }, 500);
    } else {
      setTimeout(() => {
        alert(`Código de barras detectado: "${codeToDetect}" (Nuevo producto)`);
        stopCamera();
      }, 500);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'list' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Productos ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'movements' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Movimientos de Almacén</span>
          </button>
        </div>

        {activeTab === 'list' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={startCamera}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all border border-gray-200"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>Escanear</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-100 flex-1 sm:flex-initial"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Filters & Search */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o código de barras..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm text-gray-800"
                />
              </div>

              {/* Alert Filter Toggle */}
              <button
                onClick={() => setAlertFilter(!alertFilter)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs border transition-all ${
                  alertFilter
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 ${alertFilter ? 'text-rose-600 animate-bounce' : 'text-gray-400'}`} />
                <span>Solo Bajo Stock ({products.filter((p) => p.stock <= p.minStock).length})</span>
              </button>
            </div>

            {/* Category horizontal scroller */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs shadow-emerald-100'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200/60 text-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-xs">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700">No se encontraron productos</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                Prueba cambiando los filtros de búsqueda o registra un nuevo producto en tu catálogo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock <= p.minStock;
                const isOutOfStock = p.stock === 0;

                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col group ${
                      isOutOfStock
                        ? 'border-rose-200 hover:border-rose-300 bg-rose-50/10'
                        : isLowStock
                        ? 'border-amber-200 hover:border-amber-300 bg-amber-50/10'
                        : 'border-gray-100 hover:border-emerald-100'
                    }`}
                  >
                    {/* Image Area */}
                    <div className="h-40 w-full bg-gray-50 rounded-t-2xl overflow-hidden relative border-b border-gray-100/50">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                          <Package className="w-10 h-10" />
                          <span className="text-xxs uppercase font-bold tracking-wider mt-1">Sin Foto</span>
                        </div>
                      )}

                      {/* Stock Badge Overlay */}
                      <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xxs font-black tracking-wide shadow-xs ${
                          isOutOfStock
                            ? 'bg-rose-600 text-white'
                            : isLowStock
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {isOutOfStock ? 'AGOTADO' : `STOCK: ${p.stock}`}
                        </span>
                      </div>

                      {/* Price Badge Overlay */}
                      <div className="absolute bottom-3 right-3 bg-gray-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg font-black text-xs">
                        {currency}{p.price.toFixed(2)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-xxs font-bold text-gray-400 uppercase tracking-widest">{p.category}</span>
                        <h4 className="font-bold text-gray-800 text-sm mt-0.5 line-clamp-2 h-10 group-hover:text-emerald-700 transition-colors">
                          {p.name}
                        </h4>
                        
                        {/* Barcode & Cost details */}
                        <div className="mt-2 pt-2 border-t border-gray-100/60 space-y-1">
                          <div className="flex justify-between text-xxs text-gray-400">
                            <span>Código:</span>
                            <span className="font-mono font-medium text-gray-600">{p.barcode}</span>
                          </div>
                          <div className="flex justify-between text-xxs text-gray-400">
                            <span>Costo / Margen:</span>
                            <span className="text-gray-600">
                              {currency}{p.cost.toFixed(2)} ({Math.round(((p.price - p.cost) / p.price) * 100)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Action Bar */}
                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-50">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-emerald-600 rounded-lg transition-colors"
                          title="Editar producto"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Movement Logs Table */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 className="text-base font-bold text-gray-800">Historial de Movimientos</h2>
              <p className="text-xs text-gray-500 mt-0.5">Auditoría en tiempo real de entradas, salidas y ajustes.</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-100">
              {movements.length} movimientos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-500 uppercase tracking-widest text-xxs font-black border-b border-gray-200">
                  <th className="py-3 px-5">Fecha / Hora</th>
                  <th className="py-3 px-5">Producto</th>
                  <th className="py-3 px-5">Tipo de Movimiento</th>
                  <th className="py-3 px-5 text-right">Cantidad</th>
                  <th className="py-3 px-5 text-right">Stock Anterior</th>
                  <th className="py-3 px-5 text-right">Nuevo Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                      Aún no hay movimientos de almacén registrados.
                    </td>
                  </tr>
                ) : (
                  movements.slice(0, 150).map((mov) => (
                    <tr key={mov.id} className="hover:bg-gray-50/50 text-xs text-gray-700 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-gray-400 whitespace-nowrap">
                        {new Date(mov.timestamp).toLocaleString('es-MX', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-gray-800 max-w-[200px] truncate">
                        {mov.productName}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-xxs uppercase tracking-wide border ${
                          mov.type === 'venta'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : mov.type === 'compra'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : mov.type === 'cancelacion_venta'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {mov.type === 'venta' && <ArrowDownRight className="w-3 h-3 text-amber-500" />}
                          {mov.type === 'compra' && <ArrowUpRight className="w-3 h-3 text-emerald-500" />}
                          {mov.type === 'cancelacion_venta' && <ArrowUpRight className="w-3 h-3 text-blue-500" />}
                          {mov.type === 'venta' && 'Salida por Venta'}
                          {mov.type === 'compra' && 'Entrada por Compra'}
                          {mov.type === 'cancelacion_venta' && 'Cancelación de Venta'}
                          {mov.type === 'ajuste_positivo' && 'Ajuste Manual (+)'}
                          {mov.type === 'ajuste_negativo' && 'Ajuste Manual (-)'}
                        </span>
                      </td>
                      <td className={`py-3.5 px-5 text-right font-black ${
                        mov.quantity < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                      </td>
                      <td className="py-3.5 px-5 text-right font-medium text-gray-400">{mov.previousStock}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-gray-800">{mov.newStock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-lg w-full p-6 shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-sm text-gray-700">
              {/* Barcode scanner row */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Código de Barras *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Escribe o escanea el código"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1"
                    title="Escanear con cámara"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline font-bold text-xs">Escanear</span>
                  </button>
                </div>
              </div>

              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Jabón Líquido Ariel 1L"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              {/* Category and Supplier Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 transition-all"
                  >
                    {CATEGORIES.slice(1).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Proveedor</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 transition-all"
                  >
                    {suppliers.length === 0 ? (
                      <option value="">Sin Proveedores</option>
                    ) : (
                      suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Cost and Price Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Costo de Compra ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={cost || ''}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio de Venta ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price || ''}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Stock and MinStock Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Existencia Inicial *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stock || ''}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Inventario Mínimo Alerta *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={minStock || ''}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Product Photo Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Fotografía del Producto (URL)</label>
                <input
                  type="text"
                  placeholder="URL de imagen externa..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 transition-all text-xs"
                />

                {/* Pre-sets */}
                <div className="space-y-1">
                  <span className="text-xxs text-gray-400 block font-bold uppercase tracking-wider">Ajustar pre-cargado rápido:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_PHOTOS.map((pho, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImageUrl(pho.url)}
                        className={`px-2 py-1 rounded-md text-xxs border whitespace-nowrap transition-all ${
                          imageUrl === pho.url
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pho.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Save Row */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-semibold transition-all text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 rounded-xl font-bold shadow-sm shadow-emerald-100 transition-all"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webcam Barcode Scanning Modal Simulator Frame */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full border border-gray-100 shadow-2xl flex flex-col">
            <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400 animate-pulse" />
                <span className="font-bold text-sm tracking-tight">Escáner de Código de Barras</span>
              </div>
              <button onClick={stopCamera} className="p-1 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Video or Simulator view area */}
            <div className="bg-black relative aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Simulated scan bounds target */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Visual target lines */}
                <div className="w-2/3 h-1/2 border-2 border-emerald-500 border-dashed rounded-lg relative flex items-center justify-center">
                  {/* Laser line effect */}
                  <div className="absolute w-full h-[2px] bg-rose-500 shadow-md shadow-rose-600 animate-pulse top-1/2 -translate-y-1/2"></div>
                </div>
                <p className="text-xxs text-gray-300 mt-4 bg-gray-950/70 px-3 py-1 rounded-full text-center">
                  Apunta el código de barras hacia la cámara
                </p>
              </div>

              {scannerSuccess && (
                <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
                  <div className="p-3 bg-emerald-500 text-white rounded-full mb-2">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-white text-base">¡Código Detectado!</h4>
                  <p className="text-xs text-emerald-200 mt-1 font-mono">{scannerSuccess}</p>
                </div>
              )}
            </div>

            {/* Simulated testing panel (since direct webcam access might be blocked inside some preview iframes) */}
            <div className="p-5 bg-gray-50 border-t border-gray-100 space-y-4">
              <div className="text-center">
                <span className="text-xxs text-gray-400 uppercase tracking-widest font-black">Panel de Pruebas de Inteligencia</span>
                <p className="text-xs text-gray-500 mt-1">
                  En entornos de prueba virtuales sin cámara real, haz clic abajo para simular una lectura:
                </p>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => simulateBarcodeDetection('7501000111223')}
                    className="p-2.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-gray-200 rounded-xl text-xxs font-bold text-gray-700 transition-all text-left"
                  >
                    🥛 Leche Santa Clara
                  </button>
                  <button
                    onClick={() => simulateBarcodeDetection('7501055300075')}
                    className="p-2.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-gray-200 rounded-xl text-xxs font-bold text-gray-700 transition-all text-left"
                  >
                    🥤 Coca-Cola 600ml
                  </button>
                  <button
                    onClick={() => simulateBarcodeDetection('7501000111300')}
                    className="p-2.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-gray-200 rounded-xl text-xxs font-bold text-gray-700 transition-all text-left"
                  >
                    🍞 Conchas Bimbo
                  </button>
                  <button
                    onClick={() => simulateBarcodeDetection('7501011115566')}
                    className="p-2.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-gray-200 rounded-xl text-xxs font-bold text-gray-700 transition-all text-left"
                  >
                    🍟 Papas Sabritas
                  </button>
                </div>

                <div className="border-t border-gray-200/60 pt-3 flex flex-col items-center">
                  <button
                    onClick={() => {
                      const newCode = Math.floor(7500000000000 + Math.random() * 99999999999).toString();
                      simulateBarcodeDetection(newCode);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Detectar Código Nuevo No Registrado</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
