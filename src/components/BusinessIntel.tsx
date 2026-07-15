import React, { useState, useEffect } from 'react';
import { Product, Sale, Expense, AppConfig } from '../types';
import { BrainCircuit, Loader2, Sparkles, AlertTriangle, HelpCircle, PackageOpen, Lightbulb, TrendingUp, RefreshCw } from 'lucide-react';

interface BusinessIntelProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  config: AppConfig;
  currency: string;
}

interface AIAnalysis {
  recommendations: Array<{ productName: string; reason: string; suggestedQty: number }>;
  lowStockWarnings: Array<{ productName: string; currentStock: number; minStock: number; urgency: string; action: string }>;
  slowRotationAlerts: Array<{ productName: string; currentStock: number; daysUnsoldEstimate: number; strategy: string }>;
  financialInsights: string[];
  _simulated?: boolean;
}

const LOADING_STEPS = [
  'Analizando existencias y categorías de almacén...',
  'Auditando historial de ventas de las últimas semanas...',
  'Conciliando gastos fijos de operación contra ingresos...',
  'Evaluando rotación de capital en catálogo de abarrotes...',
  'Invocando red neuronal Gemini AI para sintetizar recomendaciones...',
];

export default function BusinessIntel({ products, sales, expenses, config, currency }: BusinessIntelProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Staggered loading text rotation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerateAudit = async () => {
    setLoading(true);
    setLoadingStep(0);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products,
          sales,
          expenses,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo conectar con el servidor de IA.');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setError('Ocurrió un inconveniente al generar la auditoría de inteligencia artificial. Revisa tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Title Header banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-6 rounded-2xl border border-emerald-800 text-white shadow-xs relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Decorative ambient blobs */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full blur-2xl -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl translate-y-12 -translate-x-12"></div>

        <div className="space-y-1 z-10">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />
            <span>Consultoría & Auditoría de IA</span>
          </h1>
          <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
            AbarroControl utiliza inteligencia artificial de última generación para auditar tus niveles de inventario, proyectar compras ideales y calcular la rentabilidad real de tu negocio.
          </p>
        </div>

        {!loading && (
          <button
            onClick={handleGenerateAudit}
            className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5 z-10"
          >
            <BrainCircuit className="w-4 h-4 text-emerald-600" />
            <span>{analysis ? 'Re-generar Auditoría' : 'Iniciar Auditoría IA'}</span>
          </button>
        )}
      </div>

      {/* Loading active screen */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-5 animate-pulse">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <div className="space-y-1.5">
            <h3 className="font-bold text-gray-800 text-sm">Consultor de IA redactando recomendaciones...</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto font-mono text-emerald-700 font-semibold">
              {LOADING_STEPS[loadingStep]}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold">Error de Conexión IA</h4>
            <p>{error}</p>
            <button
              onClick={handleGenerateAudit}
              className="mt-2 text-rose-700 hover:underline font-bold"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      )}

      {/* Welcome standard panel if no audit started */}
      {!loading && !analysis && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
          <BrainCircuit className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 text-sm">Auditoría del Negocio Pendiente</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Presiona el botón de arriba para iniciar la consultoría de IA. El sistema cruzará todas tus bases de datos de inventario, ventas y egresos históricos de las últimas semanas para redactar insights.
          </p>
        </div>
      )}

      {/* AI Recommendations Panels Container */}
      {!loading && analysis && (
        <div className="space-y-6">
          {/* Simulated engine indicator banner if key fell back */}
          {analysis._simulated && (
            <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 text-xxs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{analysis._message || 'Modo demostración local activo. Los resultados se han estructurado localmente de forma inteligente.'}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Restocking suggestions (Surtido ideal) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Surtido de Mercancía Sugerido</span>
              </h3>
              
              <div className="space-y-3.5">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="p-3.5 bg-emerald-50/20 hover:bg-emerald-50/50 rounded-xl border border-emerald-100/50 flex justify-between items-start gap-4 transition-colors">
                    <div>
                      <h4 className="font-bold text-xs text-gray-800">{rec.productName}</h4>
                      <p className="text-xxs text-gray-500 mt-1 leading-relaxed">{rec.reason}</p>
                    </div>
                    <div className="shrink-0 text-right bg-emerald-100 px-2.5 py-1 rounded-lg">
                      <span className="block text-[9px] font-black text-emerald-800 uppercase tracking-wide">Comprar</span>
                      <span className="text-xs font-black text-emerald-700 font-mono">+{rec.suggestedQty} pzas</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Urgent critical stocks alerts */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>Alertas Críticas de Inventario</span>
              </h3>

              <div className="space-y-3.5">
                {analysis.lowStockWarnings.map((warn, i) => (
                  <div key={i} className="p-3.5 bg-rose-50/20 hover:bg-rose-50/50 rounded-xl border border-rose-100/50 flex justify-between items-start gap-4 transition-colors">
                    <div>
                      <h4 className="font-bold text-xs text-gray-800">{warn.productName}</h4>
                      <p className="text-xxs text-rose-700 mt-1 leading-relaxed"><strong>Acción:</strong> {warn.action}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        warn.urgency.toLowerCase().includes('alta') ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {warn.urgency}
                      </span>
                      <span className="block text-[10px] text-gray-400 font-medium mt-1">Stock: {warn.currentStock}/{warn.minStock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Underperforming liquidations strategy */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2 text-indigo-700">
                <PackageOpen className="w-5 h-5 text-indigo-500" />
                <span>Productos Estancados (Estrategias)</span>
              </h3>

              <div className="space-y-3.5">
                {analysis.slowRotationAlerts.map((slow, i) => (
                  <div key={i} className="p-3.5 bg-indigo-50/20 hover:bg-indigo-50/50 rounded-xl border border-indigo-100/50 space-y-2 transition-colors">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-xs text-gray-800">{slow.productName}</h4>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-bold">
                        Stock: {slow.currentStock} pzas
                      </span>
                    </div>
                    <p className="text-xxs text-indigo-800 bg-white/70 p-2 rounded-lg border border-indigo-100/20 leading-relaxed">
                      <strong>Estrategia AI:</strong> {slow.strategy}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Financial advisory tips (Utilidad real) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2 text-teal-800">
                <Lightbulb className="w-5 h-5 text-teal-600 animate-pulse" />
                <span>Consejos Financieros y Utilidad Real</span>
              </h3>

              <div className="space-y-3.5">
                {analysis.financialInsights.map((ins, i) => (
                  <div key={i} className="p-3.5 bg-teal-50/30 rounded-xl border border-teal-100/30 flex gap-3 items-start hover:bg-teal-50/60 transition-colors">
                    <span className="p-1 bg-teal-100 text-teal-700 rounded-lg shrink-0 text-xs font-black">
                      #{i + 1}
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                      {ins}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
