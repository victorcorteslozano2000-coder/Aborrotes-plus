import React, { useState } from 'react';
import { Expense } from '../types';
import { db } from '../lib/db';
import { Wallet, Plus, Trash2, ArrowUpRight, ArrowDownRight, ClipboardList, Calendar, Filter, X } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  currency: string;
  onRefresh: () => void;
}

const EXPENSE_CATEGORIES = [
  'Servicios',
  'Renta',
  'Papelería',
  'Mantenimiento',
  'Limpieza',
  'Salarios',
  'Otros'
];

export default function Expenses({ expenses, currency, onRefresh }: ExpensesProps) {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Servicios');
  const [amount, setAmount] = useState(0);

  // Time boundaries helper
  const getExpensesForRange = (days: number) => {
    const boundary = new Date();
    boundary.setDate(boundary.getDate() - days);
    boundary.setHours(0, 0, 0, 0);

    return expenses.filter(e => new Date(e.timestamp) >= boundary);
  };

  // Outflow aggregations
  const getTodayExpensesSum = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expenses
      .filter(e => new Date(e.timestamp) >= today)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const getWeekExpensesSum = () => getExpensesForRange(7).reduce((acc, curr) => acc + curr.amount, 0);
  const getMonthExpensesSum = () => getExpensesForRange(30).reduce((acc, curr) => acc + curr.amount, 0);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0) {
      alert('Por favor ingresa una descripción y un monto válido mayor a cero.');
      return;
    }

    const expense: Expense = {
      id: `expense-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      description,
      category,
      amount: Number(amount)
    };

    db.saveExpense(expense);
    setIsModalOpen(false);

    // Reset Form
    setDescription('');
    setCategory('Servicios');
    setAmount(0);
    onRefresh();
  };

  const handleDeleteExpense = (id: string, description: string) => {
    if (confirm(`¿Estás seguro de borrar el gasto "${description}"?`)) {
      db.deleteExpense(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Registro de Gastos</h1>
          <p className="text-xs text-gray-500 mt-1">Lleva un control estricto de las salidas de caja y costos fijos.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-100 animate-pulse"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Gasto</span>
        </button>
      </div>

      {/* Aggregate Financial Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Day Outflow */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-100 transition-all flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xxs font-black text-gray-400 uppercase tracking-widest">Gastos de Hoy</span>
            <h3 className="text-xl font-black text-gray-800 mt-0.5">
              {currency}{getTodayExpensesSum().toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Salidas del día en curso</p>
          </div>
        </div>

        {/* Week Outflow */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-100 transition-all flex items-center gap-4">
          <div className="p-3 bg-orange-50 rounded-xl text-orange-600 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xxs font-black text-gray-400 uppercase tracking-widest">Últimos 7 Días</span>
            <h3 className="text-xl font-black text-gray-800 mt-0.5">
              {currency}{getWeekExpensesSum().toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Acumulado semanal corriente</p>
          </div>
        </div>

        {/* Month Outflow */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-100 transition-all flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-600 shrink-0">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xxs font-black text-gray-400 uppercase tracking-widest">Últimos 30 Días</span>
            <h3 className="text-xl font-black text-rose-600 mt-0.5">
              {currency}{getMonthExpensesSum().toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Egresos mensuales consolidados</p>
          </div>
        </div>
      </div>

      {/* Expenses History List Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-gray-800">Historial Detallado de Gastos</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Lista cronológica de gastos menores, suministros y servicios.</p>
          </div>
          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full font-bold text-xs border border-rose-100">
            {expenses.length} registros cargados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-500 uppercase tracking-widest text-xxs font-black border-b border-gray-200">
                <th className="py-3 px-5">Fecha / Hora</th>
                <th className="py-3 px-5">Descripción</th>
                <th className="py-3 px-5">Categoría</th>
                <th className="py-3 px-5 text-right">Monto</th>
                <th className="py-3 px-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                    No se han registrado egresos o gastos de operación aún.
                  </td>
                </tr>
              ) : (
                [...expenses].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-gray-400 whitespace-nowrap">
                      {new Date(exp.timestamp).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-gray-800">{exp.description}</td>
                    <td className="py-3.5 px-5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border border-rose-100 bg-rose-50 text-rose-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-black text-rose-600 font-mono">
                      {currency}{exp.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.description)}
                        className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Creator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-md w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Registrar Salida / Gasto</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-sm text-gray-700">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría del Gasto *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-xs font-semibold"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Concepto / Descripción *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pago de Luz Eléctrica (CFE) Bimestre"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-semibold"
                />
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto del Pago ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 transition-all font-mono font-bold"
                />
              </div>

              {/* Action row */}
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
                  Confirmar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
