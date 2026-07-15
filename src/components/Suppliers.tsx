import React, { useState } from 'react';
import { Supplier } from '../types';
import { db } from '../lib/db';
import { Users, Plus, Edit, Trash2, Phone, MapPin, Calendar, ClipboardList, Check, X } from 'lucide-react';

interface SuppliersProps {
  suppliers: Supplier[];
  onRefresh: () => void;
}

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function Suppliers({ suppliers, onRefresh }: SuppliersProps) {
  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [observations, setObservations] = useState('');
  const [visitDays, setVisitDays] = useState<string[]>([]);

  // Get current day of the week in Spanish
  const getCurrentDaySpanish = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const todayIndex = new Date().getDay();
    return days[todayIndex];
  };

  const todaySpanish = getCurrentDaySpanish();

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setName('');
    setPhone('');
    setAddress('');
    setObservations('');
    setVisitDays([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setPhone(supplier.phone);
    setAddress(supplier.address);
    setObservations(supplier.observations);
    setVisitDays(supplier.visitDays);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, supplierName: string) => {
    if (confirm(`¿Estás seguro de eliminar el proveedor "${supplierName}"?`)) {
      db.deleteSupplier(id);
      onRefresh();
    }
  };

  const handleDayToggle = (day: string) => {
    if (visitDays.includes(day)) {
      setVisitDays(visitDays.filter(d => d !== day));
    } else {
      setVisitDays([...visitDays, day]);
    }
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Por favor ingresa el nombre del proveedor.');
      return;
    }

    const supplier: Supplier = {
      id: editingSupplier?.id || Math.random().toString(36).substr(2, 9),
      name,
      phone,
      address,
      observations,
      visitDays,
    };

    db.saveSupplier(supplier);
    setIsModalOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header view */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Directorio de Proveedores</h1>
          <p className="text-xs text-gray-500 mt-1">Socio-distribuidores y calendario de entregas de mercancía.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-100"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Proveedor</span>
        </button>
      </div>

      {/* Operational Calendar alerts row */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-5 h-5 text-emerald-600 animate-pulse" />
          <span>Visitas del día de hoy ({todaySpanish})</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {suppliers.filter(s => s.visitDays.includes(todaySpanish)).length === 0 ? (
            <div className="sm:col-span-3 text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
              📅 No hay visitas programadas de proveedores para hoy.
            </div>
          ) : (
            suppliers
              .filter(s => s.visitDays.includes(todaySpanish))
              .map((s) => (
                <div key={s.id} className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100/50 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-emerald-900">{s.name}</h3>
                    {s.phone && (
                      <p className="text-xxs text-emerald-700/80 mt-1.5 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{s.phone}</span>
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md self-start mt-3 uppercase tracking-wider">
                    Visita Hoy
                  </span>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Directory supplier list cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {suppliers.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-xs">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-700 text-base">Sin proveedores cargados</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Registra tus distribuidores principales para programar visitas y auditar aumentos de costo.
            </p>
          </div>
        ) : (
          suppliers.map((s) => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-emerald-100 transition-all flex flex-col justify-between shadow-xs relative overflow-hidden group">
              <div className="space-y-4">
                {/* Upper card header row */}
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-gray-800 text-base group-hover:text-emerald-700 transition-colors">
                    {s.name}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEditModal(s)}
                      className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-emerald-600 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact data items */}
                <div className="space-y-2 text-xs text-gray-500">
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-gray-700">{s.phone}</span>
                    </div>
                  )}

                  {s.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{s.address}</span>
                    </div>
                  )}

                  {s.observations && (
                    <div className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 mt-2">
                      <ClipboardList className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-xxs leading-normal text-gray-600 truncate-3">{s.observations}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Visit calendar tags */}
              <div className="border-t border-gray-100/80 pt-3.5 mt-5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Días de Visita</span>
                <div className="flex flex-wrap gap-1">
                  {DAYS_OF_WEEK.map((d) => {
                    const active = s.visitDays.includes(d);
                    return (
                      <span
                        key={d}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-gray-100 text-gray-300'
                        }`}
                      >
                        {d.substr(0, 2)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Supplier form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-lg w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingSupplier ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-4 text-sm text-gray-700">
              {/* Supplier Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre de la Distribuidora *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Distribuidora Bimbo S.A."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-semibold"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono de Contacto</label>
                <input
                  type="tel"
                  placeholder="Ej. 55-1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Dirección / Oficinas</label>
                <input
                  type="text"
                  placeholder="Dirección física del proveedor"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              {/* Observations */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Observaciones / Notas Especiales</label>
                <textarea
                  placeholder="Notas como horarios de visita, plazos de pago, etc."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-xs"
                />
              </div>

              {/* Choose Visited Days */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Días Programados de Visita</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = visitDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1 rounded-lg text-xxs font-bold border transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action save row */}
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
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
